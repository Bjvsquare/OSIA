import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../features/auth/AuthContext';

interface Message {
    id: string;
    userId: string;
    content: string;
    timestamp: string;
    senderName?: string;
    senderAvatar?: string;
}

interface TeamChatProps {
    teamId: string;
    currentUserRole?: 'Leader' | 'Member' | 'Admin';
}

export function TeamChat({ teamId, currentUserRole }: TeamChatProps) {
    const { userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const canWrite = currentUserRole === 'Leader' || currentUserRole === 'Admin';

    useEffect(() => {
        loadMessages();
        // Poll for messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [teamId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await api.getTeamMessages(teamId);
            setMessages(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !canWrite) return;

        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            userId: userProfile?.id || '',
            content: newMessage,
            timestamp: new Date().toISOString(),
            senderName: userProfile?.name || userProfile?.username || 'Me',
            senderAvatar: userProfile?.avatarUrl
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            await api.sendTeamMessage(teamId, newMessage);
            loadMessages(); // Refresh to get real ID
        } catch (error) {
            console.error('Failed to send', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await api.deleteTeamMessage(teamId, messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
            console.error('Failed to delete message', error);
            alert('Failed to delete message');
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-xs text-osia-neutral-500">Loading secure comms...</div>;

    return (
        <div className="flex flex-col h-[500px] bg-[#050b14] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-osia-teal-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-osia-neutral-400">Secure Channel</span>
                </div>
                {!canWrite && (
                    <div className="flex items-center gap-1.5 text-[9px] text-osia-neutral-500 px-2 py-1 rounded bg-white/5">
                        <Lock size={10} />
                        <span>Read Only</span>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-osia-neutral-600 text-xs italic">Encrypted channel established.<br />No messages yet.</div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.userId === userProfile?.id;
                        const showAvatar = i === 0 || messages[i - 1].userId !== msg.userId;
                        const avatarUrl = isMe ? (userProfile?.avatarUrl || msg.senderAvatar) : msg.senderAvatar;
                        const initials = (msg.senderName || (isMe ? 'ME' : 'TM'))[0].toUpperCase();

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                                {showAvatar ? (
                                    <>
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={isMe ? 'Me' : 'Member'}
                                                className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                                            />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${isMe ? 'bg-osia-teal-500/20 text-osia-teal-500' : 'bg-white/5 text-osia-neutral-400'}`}>
                                                <span className="text-[10px] font-bold">{initials}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-8 shrink-0" />
                                )}

                                <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className="flex items-center gap-1">
                                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe
                                            ? 'bg-osia-teal-500 text-white rounded-tr-sm'
                                            : 'bg-white/10 text-osia-neutral-200 rounded-tl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        {isMe && !msg.id.startsWith('temp-') && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                                                title="Delete message"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-osia-neutral-600 block">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            {canWrite ? (
                <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-white/[0.02] flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Broadcast to team..."
                        className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-osia-neutral-600 focus:outline-none focus:border-osia-teal-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2.5 rounded-xl bg-osia-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-osia-teal-400 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
            ) : (
                <div className="p-3 border-t border-white/5 bg-black/40 text-center">
                    <p className="text-[10px] text-osia-neutral-500 italic">Only Leaders can broadcast in this channel.</p>
                </div>
            )}
        </div>
    );
}
