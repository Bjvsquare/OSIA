import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { api } from '../../../services/api';
import {
    Brain, Heart, Target, Shield, Lightbulb, Compass, Zap, Network,
    Loader2, CheckCircle, Clock, ChevronLeft, Activity,
    TrendingUp, TrendingDown, Minus, Flame, Send, PartyPopper, RotateCcw
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   BlueprintRefine — Click-Based Calibration (Card Grid)

   • Per-layer unique questions — no duplicates
   • Session tracking — calibrated cards show ✓
   • Submit Refinement button → cascade data → clear → fresh round
   ═══════════════════════════════════════════════════════════ */

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

interface CalibrationCard {
    id: string;
    layerId: number;
    traitLabel: string;
    category: string;
    type: 'agreement' | 'scenario' | 'frequency';
    statement: string;
    options: { label: string; emoji?: string }[];
    currentScore: number;
    currentConfidence: number;
}

type Phase = 'browse' | 'calibrating' | 'result' | 'submitted';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    Foundation: { icon: <Shield className="w-3.5 h-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    Cognitive: { icon: <Brain className="w-3.5 h-3.5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    Expression: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    Relational: { icon: <Heart className="w-3.5 h-3.5" />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    Structural: { icon: <Target className="w-3.5 h-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    Social: { icon: <Network className="w-3.5 h-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    Integration: { icon: <Compass className="w-3.5 h-3.5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    Evolution: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-osia-teal-400', bg: 'bg-osia-teal-500/10' },
};

function getFreshnessLabel(lastRefined: string | null): { label: string; color: string } {
    if (!lastRefined) return { label: 'New', color: 'text-white/20' };
    const hours = (Date.now() - new Date(lastRefined).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return { label: 'Fresh', color: 'text-green-400' };
    if (hours < 168) return { label: 'Recent', color: 'text-osia-teal-400' };
    if (hours < 720) return { label: 'Aging', color: 'text-amber-400' };
    return { label: 'Stale', color: 'text-red-400' };
}

export function BlueprintRefine() {
    const [layers, setLayers] = useState<LayerData[]>([]);
    const [freshness, setFreshness] = useState<Record<number, FreshnessData>>({});
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<Phase>('browse');
    const [selectedLayer, setSelectedLayer] = useState<LayerData | null>(null);
    const [calibration, setCalibration] = useState<CalibrationCard | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    // ── Session tracking ──────────────────────
    const [calibratedInSession, setCalibratedInSession] = useState<Set<number>>(new Set());
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getRefinementBlueprint();
            const seen = new Set<number>();
            const uniqueTraits = (data.traits || []).filter((t: LayerData) => {
                if (seen.has(t.layerId)) return false;
                seen.add(t.layerId);
                return true;
            });
            setLayers(uniqueTraits);
            setFreshness(data.layerFreshness || {});
        } catch (err) {
            console.error('[Refine] Failed to load blueprint:', err);
        } finally {
            setLoading(false);
        }
    };

    const overallConfidence = useMemo(() => {
        if (!layers.length) return 0;
        return layers.reduce((sum, l) => sum + l.confidence, 0) / layers.length;
    }, [layers]);

    const stalestLayer = useMemo(() => {
        // Find a layer that hasn't been calibrated this session
        let stalest: LayerData | null = null;
        let oldestTime = Infinity;
        for (const layer of layers) {
            if (calibratedInSession.has(layer.layerId)) continue;
            const f = freshness[layer.layerId];
            if (!f?.lastRefined) return layer;
            const time = new Date(f.lastRefined).getTime();
            if (time < oldestTime) { oldestTime = time; stalest = layer; }
        }
        return stalest;
    }, [layers, freshness, calibratedInSession]);

    const startCalibration = async (layer: LayerData) => {
        setSelectedLayer(layer);
        setPhase('calibrating');
        setResult(null);
        try {
            const card = await api.getCalibrationCard(layer.layerId);
            setCalibration(card);
        } catch (err) {
            console.error('Failed to load calibration:', err);
            setPhase('browse');
        }
    };

    const submitOption = async (optionIndex: number) => {
        if (!calibration || submitting) return;
        setSubmitting(true);
        try {
            const res = await api.submitCalibration(calibration.id, optionIndex);
            setResult(res);
            setPhase('result');
            // Track this layer as calibrated in session
            setCalibratedInSession(prev => new Set(prev).add(calibration.layerId));
            await loadData();
        } catch (err) {
            console.error('Calibration failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const backToBrowse = () => {
        setPhase('browse');
        setSelectedLayer(null);
        setCalibration(null);
        setResult(null);
    };

    // ── Submit Refinement Session ─────────────
    const handleSubmitRefinement = async () => {
        setSubmitLoading(true);
        try {
            await api.completeRefinementSession();
            setPhase('submitted');
        } catch (err) {
            console.error('[Refine] Submit failed:', err);
        } finally {
            setSubmitLoading(false);
        }
    };

    const startNewRound = () => {
        setCalibratedInSession(new Set());
        setPhase('browse');
        loadData();
    };

    // ─── Loading ──────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-osia-teal-500" />
            </div>
        );
    }

    // ─── Submitted View ───────────────────────

    if (phase === 'submitted') {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-sm mx-auto text-center"
            >
                <Card className="p-8 bg-gradient-to-br from-osia-teal-500/10 to-purple-500/10 border-osia-teal-500/20">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center mx-auto mb-5"
                    >
                        <PartyPopper className="w-8 h-8 text-white" />
                    </motion.div>

                    <h2 className="text-lg font-bold text-white mb-2">Refinement Captured</h2>
                    <p className="text-xs text-white/40 mb-2">
                        {calibratedInSession.size} layer{calibratedInSession.size !== 1 ? 's' : ''} calibrated
                    </p>
                    <p className="text-[10px] text-white/25 mb-6">
                        Your data has been cascaded to your Blueprint, Insights, Thesis, and Patterns.
                        Each refinement deepens OSIA's understanding of you.
                    </p>

                    <div className="space-y-2">
                        <button
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            onClick={startNewRound}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Start New Round
                        </button>
                        <p className="text-[8px] text-white/15">
                            New questions will be generated · no repeats until all answered
                        </p>
                    </div>
                </Card>
            </motion.div>
        );
    }

    // ─── Result View ──────────────────────────

    if (phase === 'result' && result) {
        const dirIcon = result.direction === 'strengthened'
            ? <TrendingUp className="w-4 h-4" />
            : result.direction === 'softened'
                ? <TrendingDown className="w-4 h-4" />
                : <Minus className="w-4 h-4" />;
        const dirColor = result.direction === 'strengthened' ? 'text-green-400' : result.direction === 'softened' ? 'text-amber-400' : 'text-white/40';

        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-sm mx-auto"
            >
                <Card className="p-6 bg-gradient-to-br from-osia-teal-500/10 to-purple-500/10 border-osia-teal-500/20">
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center mx-auto"
                        >
                            <CheckCircle className="w-6 h-6 text-white" />
                        </motion.div>

                        <div>
                            <h2 className="text-sm font-bold text-white">{selectedLayer?.layerName}</h2>
                            <div className={`flex items-center justify-center gap-1.5 mt-1.5 ${dirColor}`}>
                                {dirIcon}
                                <span className="text-xs font-semibold">
                                    {(result.previousScore * 100).toFixed(0)}% → {(result.newScore * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        <p className="text-[8px] text-white/20 bg-white/5 rounded-lg px-2.5 py-1.5">
                            ✓ Blueprint · OSIA · Connections · Teams
                        </p>

                        <div className="text-[9px] text-white/30">
                            {calibratedInSession.size} of {layers.length} calibrated this session
                        </div>

                        <div className="space-y-2">
                            <button
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                                onClick={backToBrowse}
                            >
                                Continue Calibrating
                            </button>
                            <button
                                className="w-full py-2 rounded-xl border border-white/10 text-white/30 text-[9px] font-bold uppercase tracking-widest hover:text-white/50 transition-all"
                                onClick={backToBrowse}
                            >
                                Back to Overview
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    }

    // ─── Calibration Card View ────────────────

    if (phase === 'calibrating' && calibration) {
        const catConfig = CATEGORY_CONFIG[calibration.category] || CATEGORY_CONFIG.Foundation;

        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto"
            >
                <button
                    onClick={backToBrowse}
                    className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors mb-4"
                >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                {/* Layer context */}
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${catConfig.bg} flex items-center justify-center ${catConfig.color}`}>
                        {catConfig.icon}
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white">{calibration.traitLabel}</h3>
                        <p className="text-[9px] text-white/25">{(calibration.currentScore * 100).toFixed(0)}% · {(calibration.currentConfidence * 100).toFixed(0)}% confidence</p>
                    </div>
                </div>

                {/* Statement */}
                <Card className={`p-4 mb-4 ${catConfig.bg} border-white/5`}>
                    <p className="text-xs text-white/80 leading-relaxed">{calibration.statement}</p>
                </Card>

                {/* Options */}
                {calibration.type === 'scenario' ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {calibration.options.map((opt, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                disabled={submitting}
                                onClick={() => submitOption(i)}
                                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-osia-teal-500/30 transition-all text-center disabled:opacity-30"
                            >
                                <span className="text-xl block mb-2">{opt.emoji}</span>
                                <span className="text-[10px] font-semibold text-white leading-snug">{opt.label}</span>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-1.5">
                        {calibration.options.map((opt, i) => {
                            const isPositive = i < 2;
                            const isNeutral = i === 2;
                            const chipColor = isPositive
                                ? 'hover:border-green-500/40 hover:bg-green-500/10'
                                : isNeutral
                                    ? 'hover:border-white/20 hover:bg-white/[0.04]'
                                    : 'hover:border-amber-500/40 hover:bg-amber-500/10';

                            return (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.93 }}
                                    disabled={submitting}
                                    onClick={() => submitOption(i)}
                                    className={`flex-1 p-2.5 rounded-xl border border-white/10 bg-white/[0.02] ${chipColor} transition-all text-center disabled:opacity-30`}
                                >
                                    <span className="text-base block mb-0.5">{opt.emoji}</span>
                                    <span className="text-[8px] font-semibold text-white/50 leading-tight block">{opt.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}

                {submitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-osia-teal-400"
                    >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Calibrating...
                    </motion.div>
                )}

                <p className="text-[8px] text-white/10 text-center mt-3">
                    Tap to calibrate · Submit when done to save
                </p>
            </motion.div>
        );
    }

    // ─── Browse View — Flat Card Grid ─────────

    const uncalibratedLayers = layers.filter(l => !calibratedInSession.has(l.layerId));
    const calibratedLayers = layers.filter(l => calibratedInSession.has(l.layerId));

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <Card className="p-2.5 flex items-center justify-between bg-white/[0.02] border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-osia-teal-400" />
                        <span className="text-[9px] text-white/35">Confidence <span className="font-bold text-white">{(overallConfidence * 100).toFixed(0)}%</span></span>
                    </div>
                    {calibratedInSession.size > 0 && (
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-400/60" />
                            <span className="text-[9px] text-white/35">
                                <span className="font-bold text-green-400">{calibratedInSession.size}</span> calibrated
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400/60" />
                        <span className="text-[9px] text-white/35">{Object.values(freshness).filter(f => !f.lastRefined).length} new</span>
                    </div>
                </div>
                {stalestLayer && (
                    <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-osia-teal-500/15 to-purple-500/15 border border-osia-teal-500/25 text-[8px] font-bold text-osia-teal-400 hover:from-osia-teal-500/25 transition-all"
                        onClick={() => startCalibration(stalestLayer)}
                    >
                        <Flame className="w-2.5 h-2.5" /> Quick Calibrate
                    </button>
                )}
            </Card>

            {/* Submit Refinement button — visible when at least 1 calibrated */}
            <AnimatePresence>
                {calibratedInSession.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <button
                            onClick={handleSubmitRefinement}
                            disabled={submitLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitLoading ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                            ) : (
                                <><Send className="w-3.5 h-3.5" /> Submit Refinement ({calibratedInSession.size} layers)</>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uncalibrated cards */}
            {uncalibratedLayers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uncalibratedLayers.map((layer, i) => {
                        const config = CATEGORY_CONFIG[layer.category] || CATEGORY_CONFIG.Foundation;
                        const f = freshness[layer.layerId] || { lastRefined: null, refinementCount: 0 };
                        const fresh = getFreshnessLabel(f.lastRefined);

                        return (
                            <motion.div
                                key={layer.layerId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card
                                    className="p-3.5 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-osia-teal-500/15 transition-all cursor-pointer"
                                    onClick={() => startCalibration(layer)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center ${config.color}`}>
                                                {config.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">{layer.layerName}</h4>
                                                <span className="text-[8px] text-white/20">{layer.category}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[7px] font-black uppercase tracking-wider ${fresh.color}`}>{fresh.label}</span>
                                    </div>

                                    {/* Score bar */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-osia-teal-500 to-purple-500"
                                                style={{ width: `${layer.score * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-osia-teal-400">{(layer.score * 100).toFixed(0)}%</span>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Calibrated cards — completed this session */}
            {calibratedLayers.length > 0 && (
                <>
                    <div className="flex items-center gap-2 pt-2">
                        <CheckCircle className="w-3 h-3 text-green-400/50" />
                        <span className="text-[9px] text-white/25 font-bold uppercase tracking-widest">Calibrated This Session</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {calibratedLayers.map((layer) => {
                            const config = CATEGORY_CONFIG[layer.category] || CATEGORY_CONFIG.Foundation;

                            return (
                                <motion.div key={layer.layerId} layout>
                                    <Card className="p-3.5 border-green-500/10 bg-green-500/[0.03] relative overflow-hidden">
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle className="w-4 h-4 text-green-400/50" />
                                        </div>
                                        <div className="flex items-center gap-2 mb-2 opacity-60">
                                            <div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center ${config.color}`}>
                                                {config.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">{layer.layerName}</h4>
                                                <span className="text-[8px] text-white/20">{layer.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-osia-teal-500"
                                                    style={{ width: `${layer.score * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-bold text-green-400">{(layer.score * 100).toFixed(0)}%</span>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
