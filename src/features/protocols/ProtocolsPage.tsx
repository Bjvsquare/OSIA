import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
    Brain, Heart, Target, Sparkles, Compass, Zap, Eye,
    Network, Shield, Lightbulb, ArrowRight, Loader2,
    CheckCircle, ChevronDown, MessageSquare, RefreshCw
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

type ThoughtExperiment = {
    id: string;
    layerId: number;
    traitId: string;
    traitLabel: string;
    type: 'mirror' | 'edge' | 'depth';
    question: string;
    context: string;
    currentScore: number;
    currentConfidence: number;
};

type ExperimentPhase = 'browse' | 'question' | 'answering' | 'result';

// Layer category groupings & icons
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
    Foundation: { icon: <Shield className="w-5 h-5" />, color: 'text-blue-400', gradient: 'from-blue-500/10 to-blue-600/5' },
    Cognitive: { icon: <Brain className="w-5 h-5" />, color: 'text-purple-400', gradient: 'from-purple-500/10 to-purple-600/5' },
    Expression: { icon: <Lightbulb className="w-5 h-5" />, color: 'text-amber-400', gradient: 'from-amber-500/10 to-amber-600/5' },
    Relational: { icon: <Heart className="w-5 h-5" />, color: 'text-rose-400', gradient: 'from-rose-500/10 to-rose-600/5' },
    Structural: { icon: <Target className="w-5 h-5" />, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-emerald-600/5' },
    Social: { icon: <Network className="w-5 h-5" />, color: 'text-cyan-400', gradient: 'from-cyan-500/10 to-cyan-600/5' },
    Integration: { icon: <Compass className="w-5 h-5" />, color: 'text-indigo-400', gradient: 'from-indigo-500/10 to-indigo-600/5' },
    Evolution: { icon: <Zap className="w-5 h-5" />, color: 'text-osia-teal-400', gradient: 'from-osia-teal-500/10 to-osia-teal-600/5' },
};

const TYPE_LABELS: Record<string, { label: string; description: string }> = {
    mirror: { label: 'Mirror', description: 'Reflect on what your twin sees' },
    edge: { label: 'Edge', description: 'Explore your growth frontier' },
    depth: { label: 'Depth', description: 'Probe the driver beneath' },
};

export function ProtocolsPage() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [layers, setLayers] = useState<LayerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<LayerData | null>(null);
    const [experiment, setExperiment] = useState<ThoughtExperiment | null>(null);
    const [answer, setAnswer] = useState('');
    const [phase, setPhase] = useState<ExperimentPhase>('browse');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Load blueprint data
    useEffect(() => {
        loadBlueprint();
    }, []);

    const loadBlueprint = async () => {
        setLoading(true);
        try {
            const data = await api.getRefinementBlueprint();
            setLayers(data.traits || []);
        } catch (err) {
            // Fallback to origin_seed_profile
            const traits = userProfile?.origin_seed_profile?.traits || [];
            const LAYER_NAMES: Record<number, { name: string; category: string }> = {
                1: { name: 'Core Disposition', category: 'Foundation' },
                2: { name: 'Energy Orientation', category: 'Foundation' },
                3: { name: 'Cognitive Method', category: 'Cognitive' },
                4: { name: 'Internal Foundation', category: 'Cognitive' },
                5: { name: 'Creative Expression', category: 'Expression' },
                6: { name: 'Operational Rhythm', category: 'Expression' },
                7: { name: 'Relational Stance', category: 'Relational' },
                8: { name: 'Transformative Potential', category: 'Relational' },
                9: { name: 'Expansive Orientation', category: 'Structural' },
                10: { name: 'Architectural Focus', category: 'Structural' },
                11: { name: 'Social Resonance', category: 'Social' },
                12: { name: 'Integrative Depth', category: 'Integration' },
                13: { name: 'Navigational Interface', category: 'Integration' },
                14: { name: 'Evolutionary Trajectory', category: 'Evolution' },
                15: { name: 'Systemic Integration', category: 'Evolution' },
            };
            setLayers(traits.map((t: any) => ({
                ...t,
                layerName: LAYER_NAMES[t.layerId]?.name || `Layer ${t.layerId}`,
                category: LAYER_NAMES[t.layerId]?.category || 'Unknown',
            })));
        } finally {
            setLoading(false);
        }
    };

    // Group layers by category
    const categories = useMemo(() => {
        const grouped: Record<string, LayerData[]> = {};
        layers.forEach(l => {
            if (!grouped[l.category]) grouped[l.category] = [];
            grouped[l.category].push(l);
        });
        return grouped;
    }, [layers]);

    // Begin a thought experiment
    const startExperiment = async (layer: LayerData) => {
        setSelectedLayer(layer);
        setPhase('question');
        setAnswer('');
        setResult(null);

        try {
            const exp = await api.getRefinementQuestion(layer.layerId);
            setExperiment(exp);
        } catch (err) {
            console.error('Failed to generate question:', err);
            setPhase('browse');
        }
    };

    // Submit answer
    const submitAnswer = async () => {
        if (!experiment || !answer.trim() || submitting) return;

        setSubmitting(true);
        setPhase('answering');

        try {
            const res = await api.submitRefinementResponse(experiment.id, answer);
            setResult(res);
            setPhase('result');
            // Refresh blueprint data
            await loadBlueprint();
        } catch (err) {
            console.error('Failed to submit:', err);
            setPhase('question');
        } finally {
            setSubmitting(false);
        }
    };

    const backToBrowse = () => {
        setPhase('browse');
        setSelectedLayer(null);
        setExperiment(null);
        setAnswer('');
        setResult(null);
    };

    // ──────────────────────────────────────────────────────────────────────
    // RENDER: Thought Experiment Result
    // ──────────────────────────────────────────────────────────────────────
    if (phase === 'result' && result) {
        return (
            <div className="min-h-full text-white flex items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="p-10 bg-gradient-to-br from-osia-teal-500/10 to-purple-500/10 border-osia-teal-500/30">
                        <div className="text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center mx-auto"
                            >
                                <CheckCircle className="w-10 h-10 text-white" />
                            </motion.div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Blueprint Updated</h2>
                                <p className="text-osia-neutral-400 text-sm">
                                    Your response has refined <span className="text-osia-teal-400 font-semibold">{selectedLayer?.layerName}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-4">
                                <div className="text-center bg-white/5 rounded-xl p-4">
                                    <p className="text-lg font-bold text-osia-neutral-400">{(result.previousScore * 100).toFixed(0)}%</p>
                                    <p className="text-[10px] text-osia-neutral-600 uppercase tracking-wider mt-1">Previous</p>
                                </div>
                                <div className="text-center bg-white/5 rounded-xl p-4">
                                    <p className="text-lg font-bold text-osia-teal-400">
                                        {result.direction === 'strengthened' ? '↑' : result.direction === 'softened' ? '↓' : '→'}
                                    </p>
                                    <p className="text-[10px] text-osia-neutral-600 uppercase tracking-wider mt-1 capitalize">{result.direction}</p>
                                </div>
                                <div className="text-center bg-white/5 rounded-xl p-4">
                                    <p className="text-lg font-bold text-white">{(result.newScore * 100).toFixed(0)}%</p>
                                    <p className="text-[10px] text-osia-neutral-600 uppercase tracking-wider mt-1">Current</p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => startExperiment(selectedLayer!)}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Another Question
                                </Button>
                                <Button
                                    className="flex-1 bg-gradient-to-r from-osia-teal-600 to-purple-600"
                                    onClick={backToBrowse}
                                >
                                    Explore More Layers
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // RENDER: Thought Experiment Question
    // ──────────────────────────────────────────────────────────────────────
    if ((phase === 'question' || phase === 'answering') && experiment) {
        const typeConfig = TYPE_LABELS[experiment.type] || TYPE_LABELS.mirror;
        const catConfig = CATEGORY_CONFIG[selectedLayer?.category || 'Foundation'];

        return (
            <div className="min-h-full text-white flex flex-col p-4 lg:p-8">
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-3xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${catConfig?.color || 'text-osia-teal-400'}`}>
                                    {catConfig?.icon || <Eye className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{selectedLayer?.layerName}</h3>
                                    <p className="text-xs text-osia-neutral-500">{typeConfig.label} Experiment · {typeConfig.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={backToBrowse}
                                className="text-xs text-osia-neutral-500 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Back
                            </button>
                        </div>

                        {/* Current State Context */}
                        <Card className="p-5 mb-6 bg-white/[0.02] border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-wider">What your twin currently sees</span>
                                <span className="text-xs font-bold text-osia-teal-400">{(experiment.currentScore * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-sm text-osia-neutral-300 leading-relaxed italic">
                                "{experiment.context}"
                            </p>
                        </Card>

                        {/* Question */}
                        <Card className={`p-8 mb-6 bg-gradient-to-br ${catConfig?.gradient || 'from-osia-teal-500/10 to-osia-teal-600/5'} border-white/10`}>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                                    <MessageSquare className="w-4 h-4 text-osia-teal-400" />
                                </div>
                                <p className="text-lg text-white leading-relaxed font-medium">
                                    {experiment.question}
                                </p>
                            </div>
                        </Card>

                        {/* Answer Area */}
                        <div className="space-y-4">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Take a moment to reflect, then write your honest response..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white placeholder:text-osia-neutral-600 min-h-[160px] resize-none focus:border-osia-teal-500/50 focus:outline-none focus:ring-1 focus:ring-osia-teal-500/20 text-sm leading-relaxed transition-all"
                                disabled={submitting}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-osia-neutral-600">
                                    {answer.trim().split(/\s+/).filter(Boolean).length} words · More detail = more precise calibration
                                </p>
                                <Button
                                    className="bg-gradient-to-r from-osia-teal-600 to-purple-600 px-8"
                                    onClick={submitAnswer}
                                    disabled={!answer.trim() || answer.trim().length < 10 || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Calibrating...
                                        </>
                                    ) : (
                                        <>
                                            Submit & Refine
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // RENDER: Layer Browser
    // ──────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-full text-white relative pb-12">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/3 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-osia-teal-500/3 rounded-full blur-[100px] pointer-events-none" />

            {/* Cross-navigation tabs */}
            <div className="relative z-10 flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit mb-4">
                <span className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]">
                    Protocols
                </span>
                <button
                    onClick={() => navigate('/refinement')}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    Refine
                </button>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-8 relative z-10">
                <span className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.6em] text-glow mb-1 block">Protocols</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Refine your digital twin<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-xs font-medium max-w-lg mx-auto opacity-70">
                    Select a layer to begin a thought experiment. Your reflections recalibrate your blueprint in real-time.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-osia-teal-500" />
                </div>
            ) : (
                <div className="space-y-4 relative z-10 max-w-4xl mx-auto px-2">
                    {Object.entries(categories).map(([category, categoryLayers]) => {
                        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Foundation;
                        const isExpanded = expandedCategory === category;
                        const avgScore = categoryLayers.reduce((sum, l) => sum + l.score, 0) / categoryLayers.length;

                        return (
                            <Card
                                key={category}
                                className="overflow-hidden border-white/5 hover:border-white/10 transition-all duration-300"
                            >
                                {/* Category Header */}
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                    className={`w-full p-5 flex items-center justify-between bg-gradient-to-r ${config.gradient} hover:bg-white/[0.02] transition-all`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-bold text-white">{category}</h3>
                                            <p className="text-[10px] text-osia-neutral-500">
                                                {categoryLayers.length} layer{categoryLayers.length > 1 ? 's' : ''} · Avg {(avgScore * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Mini score bar */}
                                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-osia-teal-500 to-purple-500"
                                                style={{ width: `${avgScore * 100}%` }}
                                            />
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-osia-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {/* Expanded Layers */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 space-y-3 border-t border-white/5">
                                                {categoryLayers.map(layer => {
                                                    const firstLine = layer.description
                                                        ? layer.description.split('\n\n')[0].substring(0, 120)
                                                        : 'Awaiting initial data...';

                                                    return (
                                                        <motion.div
                                                            key={layer.layerId}
                                                            initial={{ x: -10, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-osia-teal-500/20 transition-all cursor-pointer group"
                                                            onClick={() => startExperiment(layer)}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-bold text-osia-neutral-600 w-6">L{layer.layerId.toString().padStart(2, '0')}</span>
                                                                    <span className="text-sm font-semibold text-white">{layer.layerName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs font-bold text-osia-teal-400">{(layer.score * 100).toFixed(0)}%</span>
                                                                    <ArrowRight className="w-4 h-4 text-osia-neutral-600 group-hover:text-osia-teal-400 transition-colors" />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-osia-neutral-500 pl-9 leading-relaxed line-clamp-2">
                                                                {firstLine}...
                                                            </p>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
