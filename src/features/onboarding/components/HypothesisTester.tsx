import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';
import { Sparkles, ThumbsUp, Loader2, RefreshCcw } from 'lucide-react';
import type { TraitProbability } from '../../../core/models';
import { useNavigate } from 'react-router-dom';

export function HypothesisTester({ onComplete }: { onComplete: () => void }) {
    const navigate = useNavigate();
    // const { dispatch } = useOnboarding();
    const [hypotheses, setHypotheses] = useState<TraitProbability[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isRefining, setIsRefining] = useState(false);
    const [iterations, setIterations] = useState<Record<number, number>>({});
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [finalizeError, setFinalizeError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getHypotheses();
                // Only show the top 5 most significant hypotheses
                const top5 = data
                    .sort((a: TraitProbability, b: TraitProbability) => (b.confidence || 0) - (a.confidence || 0))
                    .slice(0, 5);
                setHypotheses(top5);
            } catch (err) {
                console.error("Failed to load hypotheses:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleResonate = () => {
        if (currentIndex < hypotheses.length - 1) {
            setCurrentIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleFinalize();
        }
    };

    const handleRefine = async () => {
        const layerId = hypotheses[currentIndex].layerId;
        const nextIteration = (iterations[layerId] || 0) + 1;

        setIsRefining(true);
        try {
            const refined = await api.refineHypothesis(layerId, nextIteration);
            const updated = [...hypotheses];
            updated[currentIndex] = refined;
            setHypotheses(updated);
            setIterations(prev => ({ ...prev, [layerId]: nextIteration }));
        } catch (err) {
            console.error("Refinement failed:", err);
        } finally {
            setIsRefining(false);
        }
    };

    const { refreshProfile } = useAuth();

    const handleFinalize = async () => {
        setIsFinalizing(true);
        setFinalizeError(null);
        try {
            await api.completeAssessment(hypotheses);
            await refreshProfile();
            onComplete();
        } catch (err: any) {
            console.error("Finalization failed:", err);
            setFinalizeError(err.message || "Connection lost. Please try again.");
            setIsFinalizing(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-osia-teal-500 animate-spin mx-auto" />
                <h2 className="text-2xl font-bold text-white">Mapping your cognitive mirror...</h2>
                <p className="text-osia-neutral-400">Calibrating signals to your 5 core layers.</p>
            </div>
        );
    }

    if (!loading && hypotheses.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-in fade-in duration-700">
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-osia-teal-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-osia-teal-500/20">
                        <Sparkles className="w-10 h-10 text-osia-teal-500" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Origin Unmapped</h2>
                    <p className="text-osia-neutral-400 max-w-sm mx-auto">
                        Your foundational signals haven't been synchronized yet. We need your origin coordinates to generate your cognitive mirror.
                    </p>
                </div>

                <Card className="p-8 border-white/5 bg-white/[0.02] backdrop-blur-xl space-y-6">
                    <p className="text-sm text-osia-neutral-300">
                        This usually happens if the initial sync was interrupted. Initialization takes about 10 seconds.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full py-8 text-lg font-bold"
                        onClick={() => navigate('/welcome')}
                    >
                        Initialize Origin Sync
                    </Button>
                </Card>
            </div>
        );
    }

    const currentLayer = hypotheses[currentIndex];
    const progress = hypotheses.length > 0 ? ((currentIndex + 1) / hypotheses.length) * 100 : 0;

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
            {/* Progress Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-osia-teal-500">Hypothesis {currentIndex + 1} of {hypotheses.length}</span>
                    <span className="text-osia-neutral-600">{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-osia-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentLayer && (
                    <motion.div
                        key={currentLayer.layerId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-8 border-white/10 bg-osia-deep-800/50 space-y-8 relative overflow-hidden backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-osia-teal-500 uppercase tracking-widest">
                                    {currentLayer.traitId.split('_').slice(1).join(' ').replace(/([A-Z])/g, ' $1').trim()}
                                </h2>
                                {iterations[currentLayer.layerId] > 0 && (
                                    <span className="text-[10px] bg-osia-purple-500/20 text-osia-purple-400 px-2 py-1 rounded-full border border-osia-purple-500/30">
                                        Refinement v{iterations[currentLayer.layerId] + 1}
                                    </span>
                                )}
                            </div>

                            <div className="min-h-[200px] flex items-center">
                                <p className="text-xl text-white leading-relaxed font-light italic">
                                    "{currentLayer.description}"
                                </p>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <p className="text-sm text-osia-neutral-400 text-center">
                                    Does this resonance feel accurate to your foundation?
                                </p>

                                <div className="flex gap-4">
                                    <Button
                                        variant="primary"
                                        onClick={handleResonate}
                                        disabled={isRefining || isFinalizing}
                                        className="flex-1 py-4 flex items-center justify-center gap-2 group"
                                    >
                                        <ThumbsUp size={18} className="group-hover:scale-110 transition-transform" />
                                        It Resonates
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onClick={handleRefine}
                                        disabled={isRefining || isFinalizing}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border-white/10 flex items-center justify-center gap-2"
                                    >
                                        {isRefining ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <RefreshCcw size={18} />
                                        )}
                                        Refine This
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Exit */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-osia-neutral-600 uppercase tracking-widest">
                <Sparkles size={12} className="text-osia-teal-500" />
                <span>Synchronizing with your unique architectonics</span>
            </div>

            {isFinalizing && (
                <div className="fixed inset-0 bg-osia-deep-900/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-osia-teal-500 animate-spin" />
                    <p className="text-white font-bold tracking-widest uppercase">Saving Your Mirror...</p>
                </div>
            )}

            {finalizeError && (
                <div className="fixed inset-0 bg-osia-deep-900/90 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <RefreshCcw className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sync Interrupted</h3>
                    <p className="text-osia-neutral-400 max-w-xs mb-8">{finalizeError}</p>
                    <Button
                        variant="primary"
                        onClick={() => handleFinalize()}
                        className="w-full max-w-xs py-4"
                    >
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
}
