import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Activity } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const RealtimeMinimal: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isActiveRef = useRef(false);
    const [voice, setVoice] = useState('ash');

    const stopSession = () => {
        console.log('[RealtimeMinimal] ⏹️ Hard Stop Triggered');
        isActiveRef.current = false;

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.srcObject = null;
            audioRef.current.load();
            audioRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        console.log('[RealtimeMinimal] ✨ Resources fully cleared');
    };

    const startSession = async () => {
        if (isActiveRef.current) return;
        isActiveRef.current = true;
        setIsConnecting(true);
        console.log('[RealtimeMinimal] 🚀 session starting...');

        const checkAbort = () => {
            if (!isActiveRef.current) {
                stopSession();
                return true;
            }
            return false;
        };

        try {
            // Get session token from our backend with the selected voice
            const response = await fetch(`/api/realtime/session?voice=${voice}`);
            if (checkAbort()) return;

            const data = await response.json();
            const ephemeralKey = data.client_secret.value;

            // Create PeerConnection
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // Handle remote audio
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioRef.current = audioEl;
            pc.ontrack = (e) => audioEl.srcObject = e.streams[0];

            // Local Mic
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = ms;
            if (checkAbort()) return;
            pc.addTrack(ms.getTracks()[0]);

            // Data Channel
            const dc = pc.createDataChannel('oai-events');
            dcRef.current = dc;
            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);
                if (event.type === 'conversation.item.input_audio_transcription.completed') {
                    setTranscript(event.transcript);
                }
                console.log('[RealtimeMinimal] Event:', event.type);
            };

            // Signaling
            const offer = await pc.createOffer();
            if (checkAbort()) return;
            await pc.setLocalDescription(offer);

            const sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${ephemeralKey}`,
                    'Content-Type': 'application/sdp',
                },
            });
            if (checkAbort()) return;

            const answer = { type: 'answer' as RTCSdpType, sdp: await sdpResp.text() };
            if (checkAbort()) return;
            await pc.setRemoteDescription(answer);

            setIsConnected(true);
            setIsConnecting(false);

            // Set minimal instructions
            dc.onopen = () => {
                dc.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        instructions: 'Respond to the user naturally and briefly. Verify that you can hear them by echoing back exactly what they say if they ask.',
                        input_audio_transcription: { model: 'whisper-1' }
                    }
                }));
            };

        } catch (err) {
            console.error('[RealtimeMinimal] Error:', err);
            stopSession();
        }
    };

    useEffect(() => {
        return () => stopSession();
    }, []);

    return (
        <div className="p-12 max-w-2xl mx-auto space-y-8 bg-black/50 rounded-3xl border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className={isConnected ? 'text-green-500 animate-pulse' : 'text-zinc-600'} />
                    Minimal Realtime Verification
                </h2>
                {isConnected && (
                    <Button variant="ghost" size="sm" onClick={stopSession} className="text-red-500 hover:text-red-400">
                        <X className="w-4 h-4 mr-2" /> Disconnect
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {!isConnected && !isConnecting && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setVoice(v)}
                                className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${voice === v
                                        ? 'bg-white text-black border-white'
                                        : 'border-white/20 text-white/40 hover:border-white/40'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {!isConnected ? (
                    <Button
                        onClick={startSession}
                        disabled={isConnecting}
                        className="w-full h-16 text-lg rounded-2xl bg-white text-black hover:bg-zinc-200"
                    >
                        {isConnecting ? 'Initializing...' : 'Start Stable Session'}
                    </Button>
                ) : (
                    <div className="p-6 bg-zinc-900 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-white/50">
                            <Mic className="w-5 h-5 text-green-500" />
                            Session Active. Speak to the model.
                        </div>
                        {transcript && (
                            <div className="text-xl italic text-green-400 animate-in slide-in-from-bottom-2">
                                "{transcript}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="text-xs text-zinc-500 space-y-2">
                <p>• This version has **ZERO** OSIA logic/personas.</p>
                <p>• Use the Console (F12) to verify network closure.</p>
                <p>• Test: "Count to 10" and wait for a single response.</p>
            </div>
        </div>
    );
};
