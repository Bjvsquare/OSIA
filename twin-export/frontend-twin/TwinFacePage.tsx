import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Mic, MicOff, Volume2, Send, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { useTwinStore } from './store/twinStore';
import { TwinFaceCapture } from './TwinFaceCapture';
import { PlexusTwinScene } from './PlexusTwinScene';
import { ProcessingAnimation } from './components/ProcessingAnimation';
import { useAuth } from '../auth/AuthContext';
import {
  startListening,
  stopListening,
  speak,
  stopSpeaking,
  startMicAmplitude,
  type VoiceEngineCallbacks,
} from './engine/VoiceEngine';
import { smoothMouthOpenness } from './engine/MouthAnimator';

interface ChatMessage {
  role: 'user' | 'twin';
  content: string;
  timestamp: string;
  emotion?: string;
}

export function TwinFacePage() {
  const { state, processingStage, processSourceImage, reset } = useTwinStore();
  const { userProfile } = useAuth();

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mouthOpenness, setMouthOpenness] = useState(0);
  const smoothMouthRef = useRef(0);
  const micCleanupRef = useRef<(() => void) | null>(null);
  const sttCleanupRef = useRef<(() => void) | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted avatar on mount
  useEffect(() => {
    if (userProfile?.userId && state.status === 'no_face') {
      useTwinStore.getState().loadPersistedAvatar(userProfile.userId);
    }
  }, [userProfile?.userId]);

  // Auto-save when avatar is ready
  useEffect(() => {
    if (state.status === 'face_ready' && state.avatar && userProfile?.userId) {
      useTwinStore.getState().saveAvatarToServer(userProfile.userId);
    }
  }, [state.status, state.avatar, userProfile?.userId]);

  // Load chat history + auto-greeting on mount
  useEffect(() => {
    if (state.status === 'face_ready') {
      loadChatHistory().then(() => fetchGreeting());
    }
  }, [state.status]);

  const greetedRef = useRef(false);

  const fetchGreeting = async () => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/twin/greeting', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const greetMsg: ChatMessage = {
            role: 'twin',
            content: data.reply,
            timestamp: new Date().toISOString(),
            emotion: data.emotion,
          };
          setChatMessages(prev => [...prev, greetMsg]);
          setTranscript(data.suggestedFollowUp || '');
          setShowChat(true);
        }
      }
    } catch { /* ignore greeting failures */ }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Smooth mouth animation loop
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      smoothMouthRef.current = smoothMouthOpenness(
        smoothMouthRef.current,
        mouthOpenness,
        0.25
      );
      if (Math.abs(smoothMouthRef.current - mouthOpenness) > 0.01) {
        setMouthOpenness(smoothMouthRef.current);
      }
      frameId = requestAnimationFrame(animate);
    };
    if (isSpeaking || isListening) {
      frameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isSpeaking, isListening, mouthOpenness]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micCleanupRef.current?.();
      sttCleanupRef.current?.();
      stopSpeaking();
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/twin/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages?.length > 0) {
          setChatMessages(data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })));
        }
      }
    } catch { /* ignore */ }
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/twin/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setChatMessages([]);
    } catch { /* ignore */ }
  };

  const voiceCallbacks: VoiceEngineCallbacks = {
    onTranscript: (text, isFinal) => {
      setTranscript(text);
      if (isFinal) {
        handleTwinResponse(text, true);
      }
    },
    onSpeakStart: () => setIsSpeaking(true),
    onSpeakEnd: () => {
      setIsSpeaking(false);
      setMouthOpenness(0);
    },
    onSpeakAmplitude: (amp) => setMouthOpenness(amp),
    onError: (err) => console.error('[Voice]', err),
  };

  const handleTwinResponse = useCallback(async (userText: string, fromVoice = false) => {
    // Stop listening while processing
    if (fromVoice) {
      stopListening();
      sttCleanupRef.current = null;
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setTranscript('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/twin/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      setIsThinking(false);

      if (res.ok) {
        const data = await res.json();

        // Add twin message to chat
        const twinMsg: ChatMessage = {
          role: 'twin',
          content: data.reply,
          timestamp: new Date().toISOString(),
          emotion: data.emotion,
        };
        setChatMessages(prev => [...prev, twinMsg]);

        // Speak the response (voice mode or always)
        if (fromVoice) {
          speak(data.reply, voiceCallbacks);
        }

        // Show suggested follow-up
        if (data.suggestedFollowUp) {
          setTranscript(data.suggestedFollowUp);
        }
      } else {
        const errMsg: ChatMessage = {
          role: 'twin',
          content: "I'm having trouble connecting to my memory right now. Try again in a moment.",
          timestamp: new Date().toISOString(),
          emotion: 'neutral',
        };
        setChatMessages(prev => [...prev, errMsg]);
        if (fromVoice) {
          speak(errMsg.content, voiceCallbacks);
        }
      }
    } catch {
      setIsThinking(false);
      const errMsg: ChatMessage = {
        role: 'twin',
        content: "I couldn't reach the server. Let me try again when the connection is restored.",
        timestamp: new Date().toISOString(),
        emotion: 'neutral',
      };
      setChatMessages(prev => [...prev, errMsg]);
      if (fromVoice) {
        speak(errMsg.content, voiceCallbacks);
      }
    }
  }, []);

  const handleTextSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text || isThinking) return;
    setTextInput('');
    handleTwinResponse(text, false);
  }, [textInput, isThinking, handleTwinResponse]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      sttCleanupRef.current?.();
      sttCleanupRef.current = null;
      micCleanupRef.current?.();
      micCleanupRef.current = null;
      setIsListening(false);
      setMouthOpenness(0);
      setTranscript('');
    } else {
      setIsListening(true);
      setTranscript('');

      const cleanup = startListening(voiceCallbacks);
      sttCleanupRef.current = cleanup;

      const micCleanup = await startMicAmplitude((amp) => {
        if (!isSpeaking) setMouthOpenness(amp);
      });
      micCleanupRef.current = micCleanup;
    }
  }, [isListening, isSpeaking]);

  const handleImageSelected = useCallback(() => {
    processSourceImage();
  }, [processSourceImage]);

  const handleReset = useCallback(() => {
    stopListening();
    stopSpeaking();
    micCleanupRef.current?.();
    sttCleanupRef.current?.();
    setIsListening(false);
    setIsSpeaking(false);
    setMouthOpenness(0);
    reset();
  }, [reset]);

  return (
    <div className="w-full min-h-[calc(100vh-7rem)] relative">
      <AnimatePresence mode="wait">
        {/* State: No face — show capture UI */}
        {state.status === 'no_face' && (
          <motion.div key="capture"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TwinFaceCapture onImageSelected={handleImageSelected} />
          </motion.div>
        )}

        {/* State: Processing */}
        {state.status === 'processing' && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center">
            <ProcessingAnimation stage={processingStage} />
          </motion.div>
        )}

        {/* State: Face ready — 3D portrait + voice + chat */}
        {state.status === 'face_ready' && state.avatar && (
          <motion.div key="portrait"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full h-[calc(100vh-7rem)] relative">
            
            <PlexusTwinScene
              avatarData={state.avatar}
              mouthOpenness={mouthOpenness}
              className="absolute inset-0"
            />

            {/* Top-right controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button onClick={() => setShowChat(!showChat)}
                className={`p-2.5 rounded-xl border backdrop-blur-sm transition-all ${
                  showChat
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                }`}
                title="Toggle Chat">
                <MessageCircle className="w-4 h-4" />
              </button>
              {chatMessages.length > 0 && (
                <button onClick={clearHistory}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/20 backdrop-blur-sm transition-all"
                  title="Clear History">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleReset}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-white/40 hover:text-white hover:border-white/20 backdrop-blur-sm transition-all"
                title="New Photo">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Top-left label */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/40 font-mono">
                NEXUS TWIN v3.0
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isThinking ? 'bg-amber-500' :
                  isListening ? 'bg-red-500' :
                  isSpeaking ? 'bg-green-500' : 'bg-cyan-500'
                } animate-pulse`} />
                <span className="text-[8px] font-bold text-cyan-500/50">
                  {isThinking ? 'THINKING' : isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Chat panel (right side overlay) */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-14 right-4 bottom-24 w-80 z-10 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto rounded-2xl bg-black/70 border border-white/5 backdrop-blur-xl p-3 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] text-white/20 text-center">
                          Start a conversation with your twin.<br />
                          Type below or use the mic.
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-cyan-500/15 border border-cyan-500/10 text-cyan-100'
                            : 'bg-white/[0.04] border border-white/5 text-white/80'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/5">
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                            <span className="text-[10px] text-amber-400/70">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcript display (voice mode) */}
            <AnimatePresence>
              {transcript && !showChat && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 left-4 right-4 z-10"
                >
                  <div className="mx-auto max-w-md px-4 py-3 rounded-xl bg-black/60 border border-cyan-500/15 backdrop-blur-sm">
                    <p className="text-xs text-cyan-400/70 font-mono text-center">
                      "{transcript}"
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom bar — Input + Voice controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="mx-auto max-w-lg px-4 pb-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  {/* Status text */}
                  <p className="text-xs text-cyan-400/50 font-medium text-center">
                    {isThinking ? 'Processing your message...' :
                     isListening ? 'Speak now...' :
                     isSpeaking ? 'Twin is responding...' :
                     'Type or tap the mic to talk'}
                  </p>

                  {/* Input row */}
                  <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                    {/* Text input */}
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Talk to your twin..."
                        disabled={isThinking || isListening || isSpeaking}
                        className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 backdrop-blur-sm transition-all disabled:opacity-30"
                      />
                    </div>

                    {/* Send button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!textInput.trim() || isThinking || isListening || isSpeaking}
                      className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>

                    {/* Mic button */}
                    <motion.button
                      type="button"
                      onClick={toggleListening}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isSpeaking || isThinking}
                      className={`p-3 rounded-2xl border backdrop-blur-sm transition-all ${
                        isListening
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-500/20'
                      } ${(isSpeaking || isThinking) ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </motion.button>
                  </form>

                  {/* Speaking indicator */}
                  <AnimatePresence>
                    {isSpeaking && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 mx-auto w-fit rounded-full bg-green-500/10 border border-green-500/20"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[10px] font-bold text-green-400">TWIN IS SPEAKING</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
