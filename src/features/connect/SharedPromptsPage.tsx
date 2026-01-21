import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';

export function SharedPromptsPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [waiting, setWaiting] = useState(false);

    const handleNext = () => {
        if (step === 3) {
            setWaiting(true);
            setTimeout(() => navigate('/connect/shared-view'), 3000);
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-2xl">
                <AnimatePresence mode="wait">
                    {!waiting ? (
                        <motion.div
                            key="prompts"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight">A shared reflection space.</h1>
                                <p className="text-osia-neutral-500 text-sm">Answer privately. Patterns appear only after both respond.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-black uppercase tracking-widest text-osia-neutral-600 mb-8">
                                <div className="p-2 border border-white/5 rounded text-center bg-white/5">No explaining others</div>
                                <div className="p-2 border border-white/5 rounded text-center bg-white/5">No scoring</div>
                                <div className="p-2 border border-white/5 rounded text-center bg-white/5">Curiosity first</div>
                                <div className="p-2 border border-white/5 rounded text-center bg-white/5">Symmetry</div>
                            </div>

                            <Card className="p-10 border-white/5 bg-[#0a1128]/40 space-y-8">
                                <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Prompt {step} of 3</div>

                                {step === 1 && (
                                    <div className="space-y-8">
                                        <h3 className="text-2xl font-bold tracking-tight">In your interactions together, when does energy tend to increase?</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {['Open-ended conversations', 'Clear goals or plans', 'Lightness or humour', 'Working through tension', 'Shared focus time', 'Novel experiences'].map(opt => (
                                                <button key={opt} className="px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-bold text-osia-neutral-400 hover:border-osia-teal-500/30 hover:text-white transition-all">
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8">
                                        <h3 className="text-2xl font-bold tracking-tight">When things feel stuck between you, what’s often present?</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {['Unclear expectations', 'Timing mismatches', 'Emotional intensity', 'Avoidance', 'Different priorities', 'Fatigue or stress'].map(opt => (
                                                <button key={opt} className="px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-bold text-osia-neutral-400 hover:border-osia-teal-500/30 hover:text-white transition-all">
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-8">
                                        <h3 className="text-2xl font-bold tracking-tight">Optional: what tends to help things reset?</h3>
                                        <textarea className="w-full min-h-[120px] bg-black/40 border-white/10 rounded-xl p-4 text-white placeholder-osia-neutral-700 resize-none focus:outline-none focus:border-osia-teal-500/50" placeholder="A sentence or two is enough..." />
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">
                                        <Lock size={12} />
                                        Private Response
                                    </div>
                                    <Button onClick={handleNext} variant="primary" className="px-10">
                                        {step === 3 ? 'Complete' : 'Next Prompt'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-12 py-20"
                        >
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 border-2 border-osia-teal-500/20 rounded-full animate-ping" />
                                <div className="absolute inset-4 border border-osia-teal-500/40 rounded-full animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CheckCircle2 size={48} className="text-osia-teal-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight">Response captured.</h2>
                                <p className="text-osia-neutral-400 max-w-sm mx-auto leading-relaxed">
                                    Waiting for the other participant to complete their reflection. Pattern view will appear instantly when both are ready.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
