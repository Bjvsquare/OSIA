import React from 'react';
import { motion } from 'framer-motion';
import { Moon, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface FocusGateModalProps {
    onEnter: () => void;
    onExit: () => void;
}

export const FocusGateModal: React.FC<FocusGateModalProps> = ({ onEnter, onExit }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-osia-deep-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-lg mx-4 text-center space-y-10"
            >
                {/* Icon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-osia-teal-500/10 border border-osia-teal-500/20 flex items-center justify-center">
                            <Moon className="w-10 h-10 text-osia-teal-500" />
                        </div>
                        <div className="absolute inset-0 bg-osia-teal-500/10 blur-3xl rounded-full scale-[2] animate-pulse" />
                    </div>
                </motion.div>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                        Are you in a quiet space?
                    </h1>
                    <p className="text-osia-neutral-400 text-sm max-w-sm mx-auto leading-relaxed">
                        OSIA works best when you can give it your full attention.
                        Find a calm space where you can focus on introspection without distractions.
                    </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                >
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onEnter}
                        className="w-full py-6 text-base font-bold tracking-tight rounded-2xl shadow-[0_0_30px_rgba(56,163,165,0.3)] transition-all group"
                    >
                        <span className="flex items-center gap-3 justify-center">
                            Yes, I'm ready to enter
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                    <button
                        onClick={onExit}
                        className="w-full py-4 text-sm font-medium text-osia-neutral-500 hover:text-osia-neutral-300 transition-colors flex items-center gap-2 justify-center group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        No, there are too many distractions
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-[9px] text-osia-neutral-700 uppercase tracking-[0.3em] font-bold"
                >
                    Clarity requires presence
                </motion.p>
            </motion.div>
        </div>
    );
};
