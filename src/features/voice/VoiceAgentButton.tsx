import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface VoiceAgentButtonProps {
    className?: string;
}

// SVG Wave Animation Component
function WaveAnimation({ isActive }: { isActive: boolean }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 200"
            style={{ transform: 'scale(2.5)' }}
        >
            <defs>
                <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="waveGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="waveGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Wave Layer 1 - Outer */}
            <motion.ellipse
                cx="100"
                cy="100"
                rx="80"
                ry="40"
                fill="none"
                stroke="url(#waveGradient1)"
                strokeWidth="0.5"
                animate={isActive ? {
                    rotate: [0, 360],
                    scaleX: [1, 1.1, 1],
                    scaleY: [1, 0.9, 1],
                } : { rotate: 0 }}
                transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scaleX: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    scaleY: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Wave Layer 2 */}
            <motion.ellipse
                cx="100"
                cy="100"
                rx="70"
                ry="35"
                fill="none"
                stroke="url(#waveGradient2)"
                strokeWidth="0.5"
                animate={isActive ? {
                    rotate: [0, -360],
                    scaleX: [1, 0.9, 1],
                    scaleY: [1, 1.1, 1],
                } : { rotate: 0 }}
                transition={{
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scaleX: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                    scaleY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Wave Layer 3 */}
            <motion.ellipse
                cx="100"
                cy="100"
                rx="60"
                ry="30"
                fill="none"
                stroke="url(#waveGradient3)"
                strokeWidth="0.5"
                animate={isActive ? {
                    rotate: [0, 360],
                    scaleX: [1, 1.2, 1],
                    scaleY: [1, 0.8, 1],
                } : { rotate: 0 }}
                transition={{
                    rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                    scaleX: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    scaleY: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Wave Layer 4 - Inner */}
            <motion.ellipse
                cx="100"
                cy="100"
                rx="50"
                ry="25"
                fill="none"
                stroke="url(#waveGradient1)"
                strokeWidth="0.5"
                animate={isActive ? {
                    rotate: [0, -360],
                    scaleX: [1, 0.85, 1],
                    scaleY: [1, 1.15, 1],
                } : { rotate: 0 }}
                transition={{
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                    scaleX: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
                    scaleY: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Additional flowing curves */}
            <motion.path
                d="M 30 100 Q 100 60 170 100 Q 100 140 30 100"
                fill="none"
                stroke="url(#waveGradient2)"
                strokeWidth="0.3"
                animate={isActive ? {
                    d: [
                        "M 30 100 Q 100 60 170 100 Q 100 140 30 100",
                        "M 30 100 Q 100 40 170 100 Q 100 160 30 100",
                        "M 30 100 Q 100 60 170 100 Q 100 140 30 100",
                    ]
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.path
                d="M 50 100 Q 100 70 150 100 Q 100 130 50 100"
                fill="none"
                stroke="url(#waveGradient3)"
                strokeWidth="0.3"
                animate={isActive ? {
                    d: [
                        "M 50 100 Q 100 70 150 100 Q 100 130 50 100",
                        "M 50 100 Q 100 50 150 100 Q 100 150 50 100",
                        "M 50 100 Q 100 70 150 100 Q 100 130 50 100",
                    ]
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
        </svg>
    );
}

export function VoiceAgentButton({ className = '' }: VoiceAgentButtonProps) {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isAnimating = true; // Always animate waves

    // Check if user is admin
    const isAdmin = userProfile?.isAdmin === true ||
        userProfile?.email?.includes('admin') ||
        userProfile?.email === 'eugene.baren@gmail.com';

    const handleClick = () => {
        if (isAdmin) {
            setIsOpen(true);
            console.log('[VoiceAgent] Opening voice interface for admin');
        }
    };

    return (
        <>
            {/* Floating Voice Button */}
            <motion.div
                data-tour="voice-agent-button"
                className={`fixed bottom-6 right-6 z-50 ${className}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Wave Animation Container */}
                <div className="relative w-16 h-16">
                    <WaveAnimation isActive={isAnimating} />

                    {/* Central Orb Button */}
                    <motion.button
                        onClick={handleClick}
                        className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 flex items-center justify-center backdrop-blur-sm"
                        whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Inner glow */}
                        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />

                        <Mic className="w-5 h-5 text-cyan-400 relative z-10" />
                    </motion.button>
                </div>

                {/* Coming Soon Tooltip (for non-admins) */}
                <AnimatePresence>
                    {isHovered && !isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, x: 10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.9 }}
                            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap"
                        >
                            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-cyan-500/20 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">Voice Intelligence</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Coming soon</p>
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-slate-900/95 border-r border-t border-cyan-500/20 rotate-45" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Admin Active Indicator */}
                {isAdmin && (
                    <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.div>

            {/* Voice Interface Modal (Admin Only) */}
            <AnimatePresence>
                {isOpen && isAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative max-w-lg w-full mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors z-20"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>

                            {/* Voice Interface Content */}
                            <div className="text-center space-y-8 py-12">
                                {/* Large Wave Animation */}
                                <div className="relative w-48 h-48 mx-auto">
                                    <WaveAnimation isActive={true} />

                                    {/* Central Orb */}
                                    <motion.div
                                        className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 flex items-center justify-center"
                                        animate={{
                                            boxShadow: [
                                                '0 0 20px rgba(6, 182, 212, 0.3)',
                                                '0 0 40px rgba(6, 182, 212, 0.5)',
                                                '0 0 20px rgba(6, 182, 212, 0.3)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Mic className="w-8 h-8 text-cyan-400" />
                                    </motion.div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-light text-white tracking-wide">How can I help you?</h2>
                                    <p className="text-slate-500 mt-3 text-sm">
                                        Admin testing mode. Voice agent integration in progress.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
