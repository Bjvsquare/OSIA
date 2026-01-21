import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface HighFidContentCardProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        label: string;
        description: string;
        intensity?: number;
    } | null;
}

export function HighFidContentCard({ isOpen, onClose, data }: HighFidContentCardProps) {
    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-end p-12 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="pointer-events-auto relative w-full max-w-md"
                    >
                        {/* Premium Glass Card */}
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">

                            {/* Decorative gradient corner */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[80px]" />

                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/50 hover:text-white"
                            >
                                <X size={18} />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-[1px] bg-cyan-500/50" />
                                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.4em]">
                                        Analytical Detail
                                    </span>
                                </div>

                                <h2 className="text-4xl font-light text-white tracking-tight leading-none mb-8">
                                    {data.label}
                                </h2>

                                <div className="space-y-8">
                                    <section>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3 font-bold">Resonance Profile</div>
                                        <p className="text-lg text-white/80 font-light leading-relaxed italic">
                                            "{data.description}"
                                        </p>
                                    </section>

                                    {data.intensity !== undefined && (
                                        <section>
                                            <div className="flex justify-between items-end mb-3">
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Signal Intensity</div>
                                                <div className="text-sm font-mono text-cyan-400">
                                                    {(data.intensity * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="h-[2px] w-full bg-white/5 relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${data.intensity * 100}%` }}
                                                    transition={{ delay: 0.3, duration: 1, ease: "circOut" }}
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                />
                                            </div>
                                        </section>
                                    )}

                                    <div className="pt-4 flex gap-4">
                                        <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 uppercase tracking-widest">
                                            Blueprint-v4.0
                                        </div>
                                        <div className="px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 uppercase tracking-widest">
                                            High Alignment
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
