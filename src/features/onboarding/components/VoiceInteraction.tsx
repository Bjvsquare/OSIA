import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Sparkles, X, Check, Lock, Star } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';

interface VoiceInteractionProps {
    onComplete: (data: { selectedWords: Record<string, string[]>, situation: string }) => void;
    onCancel: (error?: string) => void;
}

export const VoiceInteraction: React.FC<VoiceInteractionProps> = ({ onComplete, onCancel }) => {
    const { userProfile } = useAuth();
    const isPro = userProfile?.subscriptionTier === 'pro';

    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [volume, setVolume] = useState(0);
    const [extractedData, setExtractedData] = useState<{
        selectedWords: Record<string, string[]>;
        situation: string;
    }>({
        selectedWords: { best: [], pressure: [], energize: [], drain: [] },
        situation: ''
    });
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isStartingRef = useRef(false);
    const isActiveRef = useRef(false);
    const isProcessingResponseRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [voice, setVoice] = useState('sage'); // Default to Sage as requested

    const startSession = async () => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        isActiveRef.current = true;
        setIsConnecting(true);
        console.log('[Voice] 🚀 Starting stable session initialization...');

        const checkAbort = () => {
            if (!isActiveRef.current) {
                console.warn('[Voice] 🛑 Initialization aborted: session no longer active.');
                stopSession();
                return true;
            }
            return false;
        };

        try {
            const tokenResponse = await fetch(`/api/realtime/session?voice=${voice}`);
            if (checkAbort()) return;

            const responseText = await tokenResponse.text();
            if (checkAbort()) return;

            if (!tokenResponse.ok) {
                throw new Error(`Server error: ${tokenResponse.status}`);
            }

            const data = JSON.parse(responseText);
            const EPHEMERAL_KEY = data.client_secret.value;

            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioRef.current = audioEl;
            pc.ontrack = (e) => {
                if (audioRef.current) {
                    audioRef.current.srcObject = e.streams[0];
                }
            };

            const ms = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = ms;
            if (checkAbort()) return;

            pc.addTrack(ms.getTracks()[0]);

            const dc = pc.createDataChannel('oai-events');
            dcRef.current = dc;
            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);
                handleRealtimeEvent(event);
            };

            const offer = await pc.createOffer();
            if (checkAbort()) return;
            await pc.setLocalDescription(offer);
            if (checkAbort()) return;

            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp',
                },
            });
            if (checkAbort()) return;

            const sdpText = await sdpResponse.text();
            if (checkAbort()) return;

            const answer = {
                type: 'answer' as RTCSdpType,
                sdp: sdpText,
            };
            await pc.setRemoteDescription(answer);
            if (checkAbort()) return;

            setIsConnected(true);
            setIsListening(true);
            console.log('[Voice] ✅ Stable session established.');

            dc.onopen = () => {
                dc.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        instructions: `
                            You are OSIA, the user's Sentient Mirror. 
                            Speak ONLY in English. 
                            
                            STYLE:
                            - Be brief. Speak 1 or 2 short sentences.
                            - Reflect the user's tone and energy.
                            - No scripted behavior. Be natural.
                        `,
                        turn_detection: {
                            type: 'server_vad',
                            threshold: 0.8,
                            prefix_padding_ms: 300,
                            silence_duration_ms: 1000,
                        },
                        input_audio_transcription: { model: 'whisper-1' }
                    }
                }));
            };

            // Audio Visualizer Setup
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(ms);
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateVolume = () => {
                if (!isActiveRef.current || !pcRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                setVolume((sum / dataArray.length) / 128);
                requestAnimationFrame(updateVolume);
            };
            updateVolume();

        } catch (error: any) {
            console.error('[VoiceInteraction] Initialization failed:', error);
            const message = error.message || 'Unknown voice session error';
            onCancel(message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleRealtimeEvent = (event: any) => {
        // Handle input transcription
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
            // Ignore transcription if it happened while AI was speaking (echo)
            if (isAiSpeaking) return;

            const cleanText = event.transcript.trim();
            if (cleanText) {
                setTranscript(cleanText);
                extractSignals(cleanText);
            }
        }

        if (event.type === 'response.created') {
            if (isProcessingResponseRef.current) return; // Prevent overlapping triggers
            isProcessingResponseRef.current = true;
            setIsAiSpeaking(true);
            // HARD GATE: Kill the mic track immediately when AI starts to respond
            if (streamRef.current) {
                streamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }
            // CLEAR BUFFER: Wipe any "echo" or noise that might have slipped in
            if (dcRef.current?.readyState === 'open') {
                dcRef.current.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
            }
        }

        if (event.type === 'response.done') {
            setIsAiSpeaking(false);
            isProcessingResponseRef.current = false;
            // RE-ENABLE: Wait a moment after AI finishes to re-open the mic
            setTimeout(() => {
                if (streamRef.current && pcRef.current) { // Check if still connected
                    streamRef.current.getAudioTracks().forEach(track => {
                        track.enabled = true;
                    });
                }
            }, 200); // Increased delay slightly
        }

        // Ensure manual interruption also resets state
        if (event.type === 'input_audio_buffer.speech_started') {
            setIsAiSpeaking(false); // User interrupted, model should stop
        }
    };

    const removeWord = (bucket: string, word: string) => {
        setExtractedData(prev => ({
            ...prev,
            selectedWords: {
                ...prev.selectedWords,
                [bucket]: prev.selectedWords[bucket].filter(w => w !== word)
            }
        }));
    };

    const extractSignals = (text: string) => {
        const wordOptions = {
            best: ["Calm", "Curious", "Direct", "Warm", "Focused", "Playful", "Grounded", "Decisive", "Reflective", "Open", "Independent", "Collaborative"],
            pressure: ["Withdrawn", "Overthinking", "Impatient", "Reactive", "Guarded", "Avoidant", "Controlling", "Anxious", "Blunt", "Rigid", "Self-critical", "Tense"],
            energize: ["Open-ended conversations", "Clear goals", "Creative problem-solving", "Structure and routines", "Autonomy", "Collaboration", "Learning something new", "Helping others", "Quiet focus time"],
            drain: ["Ambiguity without context", "Conflict avoidance", "Constant urgency", "Micromanagement", "Unclear expectations", "Over-socialising", "Isolation", "Repetitive tasks", "High emotional tension"]
        };

        const newData = { ...extractedData };
        Object.entries(wordOptions).forEach(([bucket, options]) => {
            options.forEach(option => {
                if (text.toLowerCase().includes(option.toLowerCase()) && !newData.selectedWords[bucket].includes(option)) {
                    newData.selectedWords[bucket].push(option);
                }
            });
        });

        if (text.length > 50 && !text.includes('best') && !text.includes('pressure')) {
            newData.situation = text;
        }

        setExtractedData({ ...newData });
    };

    const stopSession = () => {
        console.log('[Voice] ⏹️ Stopping session and cleaning up resources...');
        isActiveRef.current = false;

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                console.log(`[Voice] Stopping track: ${track.kind}`);
                track.stop();
            });
            streamRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.srcObject = null;
            audioRef.current.load();
            audioRef.current.remove();
            audioRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(e => console.error('[Voice] AudioContext cleanup error:', e));
            audioContextRef.current = null;
        }
        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }
        setIsConnected(false);
        setIsListening(false);
        isStartingRef.current = false;
        setVolume(0);
        console.log('[Voice] ✨ Cleanup complete.');
    };

    useEffect(() => {
        startSession();
        return () => stopSession();
    }, []);

    if (!isPro) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-osia-deep-900/90 backdrop-blur-3xl animate-in fade-in duration-500">
                <div className="max-w-md w-full p-12 rounded-[3.5rem] bg-white/5 border border-white/10 text-center space-y-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-osia-teal-500/10 to-transparent opacity-50" />

                    <div className="relative z-10 space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-[2rem] bg-osia-teal-500/10 border border-osia-teal-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(56,163,165,0.1)]">
                            <Lock className="w-8 h-8 text-osia-teal-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                                Premium Resonance <Star className="w-4 h-4 fill-osia-teal-500 text-osia-teal-500" />
                            </h2>
                            <p className="text-osia-neutral-400 text-sm leading-relaxed">
                                Realtime Voice Interaction with OSIA is a premium feature designed for profound synchronization.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-osia-neutral-500 italic">
                            Upgrade to OSIA Pro to unlock the voice of your Sentient Mirror.
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button variant="primary" size="lg" className="w-full rounded-full bg-gradient-to-r from-osia-teal-500 to-osia-teal-400 shadow-[0_0_30px_rgba(56,163,165,0.2)]">
                                See Upgrade Options
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onCancel()} className="text-osia-neutral-500">
                                <X className="w-4 h-4 mr-2" /> Back to Onboarding
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasData = Object.values(extractedData.selectedWords).some((arr: string[]) => arr.length > 0) || extractedData.situation;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-osia-deep-900/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-xl w-full space-y-8 text-center">
                <div className="relative h-64 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Volume2 className={`w-4 h-4 transition-colors ${volume > 0.1 ? 'text-osia-teal-500' : 'text-osia-neutral-600'}`} />
                            <div className="text-[10px] text-osia-neutral-400 font-bold uppercase tracking-widest">
                                {isConnected ? 'Resonance Active' : 'Calibrating...'}
                            </div>
                        </div>

                        {!isConnected && !isConnecting && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setVoice(v)}
                                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${voice === v
                                            ? 'bg-osia-teal-500 border-osia-teal-500 text-white'
                                            : 'border-white/20 text-white/40 hover:border-white/40'
                                            }`}
                                    >
                                        {v.charAt(0).toUpperCase() + v.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <AnimatePresence>
                        {isListening && (
                            <>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1 + volume * 0.5, opacity: 0.2 + volume * 0.3 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 bg-osia-teal-500/20 blur-3xl rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: 1 + volume * 0.2 }}
                                    className="relative z-10 w-32 h-32 rounded-[3.5rem] bg-osia-teal-500/10 border border-osia-teal-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(56,163,165,0.2)]"
                                >
                                    <Mic className="w-12 h-12 text-osia-teal-500" />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                    {!isListening && isConnecting && (
                        <div className="animate-pulse text-osia-teal-500 font-bold uppercase tracking-widest text-xs">
                            Establishing Connection...
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Speak your truth.</h2>
                    <p className="text-osia-neutral-400 max-w-sm mx-auto">
                        Tell OSIA about your best self, your pressure points, and what moves you.
                    </p>
                    {transcript && (
                        <div className="text-osia-teal-500/60 text-xs italic line-clamp-2 max-w-md mx-auto">
                            "{transcript}"
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 text-left">
                    <AnimatePresence>
                        {Object.entries(extractedData.selectedWords).map(([bucket, words]) => (
                            (words as string[]).length > 0 && (
                                <motion.div
                                    key={bucket}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap gap-2 items-center"
                                >
                                    <div className="flex items-center gap-2 mr-2">
                                        <Sparkles className="w-3 h-3 text-osia-teal-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-osia-teal-500">{bucket}:</span>
                                    </div>
                                    {(words as string[]).map((w: string) => (
                                        <span
                                            key={w}
                                            className="group flex items-center gap-1.5 text-xs text-white bg-osia-teal-500/20 px-2 py-1 rounded-md border border-osia-teal-500/30 hover:bg-osia-teal-500/30 transition-colors"
                                        >
                                            {w}
                                            <button
                                                onClick={() => removeWord(bucket, w)}
                                                className="opacity-40 hover:opacity-100 p-0.5 rounded-full hover:bg-white/10 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>
                </div>

                <footer className="pt-8 flex items-center justify-center gap-4">
                    <Button variant="ghost" size="lg" onClick={() => onCancel()} className="rounded-full">
                        <X className="w-5 h-5 mr-2" /> Cancel
                    </Button>
                    {hasData && (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => onComplete(extractedData)}
                            className="rounded-full shadow-[0_0_40px_rgba(56,163,165,0.3)]"
                        >
                            <Check className="w-5 h-5 mr-2" /> Sync Insights
                        </Button>
                    )}
                </footer>
            </div>
        </div>
    );
};
