import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Brain, Heart, Target, Shield, Lightbulb, Compass, Zap, Network,
    ArrowRight, Loader2, CheckCircle, Clock, RefreshCw, MessageSquare,
    Send, ChevronLeft, Sparkles, Activity
} from 'lucide-react';

interface LayerData {
    traitId: string;
    layerId: number;
    score: number;
    confidence: number;
    description: string;
    layerName: string;
    category: string;
}

interface FreshnessData {
    lastRefined: string | null;
    refinementCount: number;
}

type Phase = 'overview' | 'refining' | 'result';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Foundation: <Shield className="w-4 h-4" />,
    Cognitive: <Brain className="w-4 h-4" />,
    Expression: <Lightbulb className="w-4 h-4" />,
    Relational: <Heart className="w-4 h-4" />,
    Structural: <Target className="w-4 h-4" />,
    Social: <Network className="w-4 h-4" />,
    Integration: <Compass className="w-4 h-4" />,
    Evolution: <Zap className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
    Foundation: 'from-blue-500',
    Cognitive: 'from-purple-500',
    Expression: 'from-amber-500',
    Relational: 'from-rose-500',
    Structural: 'from-emerald-500',
    Social: 'from-cyan-500',
    Integration: 'from-indigo-500',
    Evolution: 'from-osia-teal-500',
};

function getFreshnessLabel(lastRefined: string | null): { label: string; color: string } {
    if (!lastRefined) return { label: 'Never refined', color: 'text-osia-neutral-600' };

    const hours = (Date.now() - new Date(lastRefined).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return { label: 'Fresh', color: 'text-green-400' };
    if (hours < 168) return { label: 'Recent', color: 'text-osia-teal-400' };
    if (hours < 720) return { label: 'Aging', color: 'text-amber-400' };
    return { label: 'Stale', color: 'text-red-400' };
}

export function BlueprintRefinementPage() {
    const navigate = useNavigate();
    const [layers, setLayers] = useState<LayerData[]>([]);
    const [freshness, setFreshness] = useState<Record<number, FreshnessData>>({});
    const [loading, setLoading] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<LayerData | null>(null);
    const [experiment, setExperiment] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [phase, setPhase] = useState<Phase>('overview');
    const [cascading, setCascading] = useState(false);
    const [refinedCount, setRefinedCount] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getRefinementBlueprint();
            setLayers(data.traits || []);
            setFreshness(data.layerFreshness || {});
        } catch (err) {
            console.error('Failed to load blueprint:', err);
        } finally {
            setLoading(false);
        }
    };

    const overallConfidence = useMemo(() => {
        if (!layers.length) return 0;
        return layers.reduce((sum, l) => sum + l.confidence, 0) / layers.length;
    }, [layers]);

    const staleCount = useMemo(() => {
        return Object.values(freshness).filter(f => !f.lastRefined).length;
    }, [freshness]);

    const startRefining = async (layer: LayerData) => {
        setSelectedLayer(layer);
        setPhase('refining');
        setAnswer('');
        setResult(null);

        try {
            const exp = await api.getRefinementQuestion(layer.layerId);
            setExperiment(exp);
        } catch (err) {
            console.error('Failed to load question:', err);
            setPhase('overview');
        }
    };

    const submitResponse = async () => {
        if (!experiment || !answer.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await api.submitRefinementResponse(experiment.id, answer);
            setResult(res);
            setPhase('result');
            setRefinedCount(prev => prev + 1);
            await loadData();
        } catch (err) {
            console.error('Failed to submit:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const completeCascade = async () => {
        setCascading(true);
        try {
            await api.completeRefinementSession();
        } catch (err) {
            console.error('Cascade failed:', err);
        } finally {
            setCascading(false);
        }
    };

    // ──────────────────────────────────────────────────────────────────
    // RESULT VIEW
    // ──────────────────────────────────────────────────────────────────
    if (phase === 'result' && result) {
        return (
            <div className="min-h-full text-white flex items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-xl"
                >
                    <Card className="p-8 bg-gradient-to-br from-osia-teal-500/10 to-purple-500/10 border-osia-teal-500/20">
                        <div className="text-center space-y-5">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center mx-auto"
                            >
                                <CheckCircle className="w-8 h-8 text-white" />
                            </motion.div>

                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedLayer?.layerName} Updated</h2>
                                <p className="text-sm text-osia-neutral-400 mt-1">
                                    {result.direction === 'strengthened' ? 'Score strengthened' : result.direction === 'softened' ? 'Score softened' : 'Score stable'} — {(result.previousScore * 100).toFixed(0)}% → {(result.newScore * 100).toFixed(0)}%
                                </p>
                            </div>

                            <div className="text-[10px] text-osia-neutral-500 bg-white/5 rounded-lg px-3 py-2">
                                {refinedCount} layer{refinedCount > 1 ? 's' : ''} refined this session
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-osia-teal-600 to-purple-600"
                                    onClick={() => setPhase('overview')}
                                >
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Refine Another Layer
                                </Button>
                                {refinedCount > 0 && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            await completeCascade();
                                            setPhase('overview');
                                        }}
                                        disabled={cascading}
                                    >
                                        {cascading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Propagating...</>
                                        ) : (
                                            <><Sparkles className="w-4 h-4 mr-2" /> Finish & Cascade to Team/Org</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────
    // REFINING VIEW
    // ──────────────────────────────────────────────────────────────────
    if (phase === 'refining' && experiment) {
        return (
            <div className="min-h-full text-white flex flex-col p-4 lg:p-8">
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-3xl"
                    >
                        <button
                            onClick={() => setPhase('overview')}
                            className="flex items-center gap-2 text-xs text-osia-neutral-500 hover:text-white transition-colors mb-6"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to layers
                        </button>

                        {/* Context Card */}
                        <Card className="p-5 mb-5 bg-white/[0.02] border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    {CATEGORY_ICONS[selectedLayer?.category || 'Foundation']}
                                    {selectedLayer?.layerName}
                                </span>
                                <span className="text-xs font-bold text-osia-teal-400">{(experiment.currentScore * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed italic">"{experiment.context}"</p>
                        </Card>

                        {/* Question */}
                        <Card className="p-8 mb-5 bg-gradient-to-br from-osia-teal-500/[0.06] to-purple-500/[0.04] border-osia-teal-500/15">
                            <div className="flex gap-4">
                                <MessageSquare className="w-5 h-5 text-osia-teal-400 shrink-0 mt-1" />
                                <p className="text-lg text-white leading-relaxed">{experiment.question}</p>
                            </div>
                        </Card>

                        {/* Answer */}
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Reflect honestly..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white placeholder:text-osia-neutral-600 min-h-[140px] resize-none focus:border-osia-teal-500/50 focus:outline-none text-sm leading-relaxed mb-4"
                            disabled={submitting}
                        />

                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-osia-neutral-600">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                            <Button
                                className="bg-gradient-to-r from-osia-teal-600 to-purple-600"
                                onClick={submitResponse}
                                disabled={!answer.trim() || answer.trim().length < 10 || submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                {submitting ? 'Calibrating...' : 'Submit'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────
    // OVERVIEW: All 15 Layers
    // ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-full text-white relative pb-12">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-osia-teal-500/3 rounded-full blur-[120px] pointer-events-none" />

            {/* Cross-navigation tabs */}
            <div className="relative z-10 flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit mb-4">
                <button
                    onClick={() => navigate('/protocols')}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    Protocols
                </button>
                <span className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]">
                    Refine
                </span>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-8 relative z-10">
                <span className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.6em] text-glow mb-1 block">Refinement Centre</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Your Blueprint<span className="text-osia-teal-500">,</span> Layer by Layer<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-xs font-medium max-w-lg mx-auto opacity-70">
                    Review and refine each dimension of your digital twin. The fresher the data, the more accurate your reflections.
                </p>
            </div>

            {/* Stats Bar */}
            <div className="max-w-4xl mx-auto mb-6 relative z-10 px-2">
                <Card className="p-4 flex items-center justify-between bg-white/[0.02] border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-osia-teal-400" />
                            <span className="text-xs text-osia-neutral-400">Overall Confidence: <span className="font-bold text-white">{(overallConfidence * 100).toFixed(0)}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-osia-neutral-400">{staleCount} layer{staleCount !== 1 ? 's' : ''} never refined</span>
                        </div>
                    </div>
                    {refinedCount > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px]"
                            onClick={completeCascade}
                            disabled={cascading}
                        >
                            {cascading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Cascade Updates
                        </Button>
                    )}
                </Card>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-osia-teal-500" />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10 px-2">
                    {layers.map(layer => {
                        const f = freshness[layer.layerId] || { lastRefined: null, refinementCount: 0 };
                        const fresh = getFreshnessLabel(f.lastRefined);
                        const catColor = CATEGORY_COLORS[layer.category] || 'from-osia-teal-500';
                        const firstLine = layer.description
                            ? layer.description.split('\n\n')[0].substring(0, 80)
                            : 'Awaiting data...';

                        return (
                            <motion.div
                                key={layer.layerId}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    className="p-5 cursor-pointer hover:border-osia-teal-500/20 transition-all h-full flex flex-col justify-between group"
                                    onClick={() => startRefining(layer)}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-osia-neutral-500 ${layer.category}`}>
                                                    {CATEGORY_ICONS[layer.category]}
                                                </span>
                                                <span className="text-xs font-bold text-white">{layer.layerName}</span>
                                            </div>
                                            <span className={`text-[9px] font-bold ${fresh.color}`}>{fresh.label}</span>
                                        </div>

                                        {/* Score bar */}
                                        <div className="mb-3">
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full bg-gradient-to-r ${catColor} to-transparent`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${layer.score * 100}%` }}
                                                    transition={{ duration: 0.8, delay: layer.layerId * 0.05 }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[10px] text-osia-neutral-600">L{layer.layerId.toString().padStart(2, '0')}</span>
                                                <span className="text-[10px] font-bold text-osia-teal-400">{(layer.score * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-osia-neutral-500 leading-relaxed line-clamp-2 mb-3">
                                            {firstLine}...
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <span className="text-[9px] text-osia-neutral-600">
                                            {f.refinementCount > 0 ? `${f.refinementCount} refinement${f.refinementCount > 1 ? 's' : ''}` : 'Not yet refined'}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-osia-neutral-600 group-hover:text-osia-teal-400 transition-colors" />
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
