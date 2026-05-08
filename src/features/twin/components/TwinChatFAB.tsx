/**
 * TwinChatFAB — Floating Action Button for quick twin access
 * 
 * A persistent mini-chat widget that appears on every page,
 * allowing users to quickly message their twin without navigating away.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Maximize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MiniMessage {
  role: 'user' | 'twin';
  content: string;
}

export function TwinChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MiniMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on twin-face page (it has its own chat)
  if (location.pathname === '/twin-face') return null;

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Fetch greeting on first open
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      fetchGreeting();
    }
  }, [isOpen]);

  const fetchGreeting = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/twin/greeting', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages([{ role: 'twin', content: data.reply }]);
        }
      }
    } catch { /* ignore */ }
  };

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsThinking(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/twin/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      setIsThinking(false);
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'twin', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'twin', content: "Couldn't connect right now." }]);
      }
    } catch {
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'twin', content: "Connection lost. Try again." }]);
    }
  }, [input, isThinking]);

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:shadow-cyan-500/50 transition-shadow"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Pulse indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a1128] animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 h-[28rem] flex flex-col rounded-2xl bg-[#0a1128]/95 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Twin</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsOpen(false); navigate('/twin-face'); }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                  title="Open full Twin"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && !isThinking && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] text-white/20 text-center">
                    Quick-chat with your twin.<br />
                    Type below to start.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
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

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-white/5 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your twin..."
                disabled={isThinking}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 disabled:opacity-30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 transition-all disabled:opacity-20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
