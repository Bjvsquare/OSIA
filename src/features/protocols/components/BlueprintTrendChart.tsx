import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../services/api';
import { TrendingUp, TrendingDown, Minus, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface BlueprintTrendChartProps {
    limit?: number;
}

interface TraitTrend {
    current: number;
    change7d: number;
    change30d: number;
}

// Human-readable labels for trait IDs
const TRAIT_LABELS: Record<string, string> = {
    'L01_CORE_DISPOSITION': 'Core Disposition',
    'L02_ENERGY_ORIENTATION': 'Energy Orientation',
    'L03_COGNITIVE_METHOD': 'Cognitive Method',
    'L04_INTERNAL_FOUNDATION': 'Internal Foundation',
    'L05_CREATIVE_EXPRESSION': 'Creative Expression',
    'L06_OPERATIONAL_RHYTHM': 'Operational Rhythm',
    'L07_RELATIONAL_STANCE': 'Relational Stance',
    'L08_TRANSFORMATIVE_POTENTIAL': 'Transformative Potential',
    'L09_EXPANSIVE_ORIENTATION': 'Expansive Orientation',
    'L10_ARCHITECTURAL_FOCUS': 'Architectural Focus',
    'L11_SOCIAL_RESONANCE': 'Social Resonance',
    'L12_INTEGRATIVE_DEPTH': 'Integrative Depth',
    'L13_NAVIGATIONAL_INTERFACE': 'Navigational Interface',
    'L14_EVOLUTIONARY_TRAJECTORY': 'Evolutionary Trajectory',
    'L15_SYSTEMIC_INTEGRATION': 'Systemic Integration'
};

export function BlueprintTrendChart({ limit = 10 }: BlueprintTrendChartProps) {
    const [trends, setTrends] = useState<Record<string, TraitTrend>>({});
    const [loading, setLoading] = useState(true);
    const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchTrends();
    }, []);

    const fetchTrends = async () => {
        try {
            const data = await api.getBlueprintTrends();
            setTrends(data);
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTrait = (traitId: string) => {
        setExpandedTraits(prev => {
            const next = new Set(prev);
            if (next.has(traitId)) {
                next.delete(traitId);
            } else {
                next.add(traitId);
            }
            return next;
        });
    };

    const getChangeIndicator = (change: number) => {
        if (Math.abs(change) < 0.01) {
            return { icon: Minus, color: 'text-osia-neutral-500', bg: 'bg-osia-neutral-500/10' };
        }
        if (change > 0) {
            return { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' };
        }
        return { icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10' };
    };

    const formatChange = (change: number) => {
        if (Math.abs(change) < 0.001) return '0%';
        const sign = change > 0 ? '+' : '';
        return `${sign}${(change * 100).toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl" />
                ))}
            </div>
        );
    }

    const traitIds = Object.keys(trends);

    if (traitIds.length === 0) {
        return (
            <div className="text-center py-12 text-osia-neutral-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete recalibration sessions to see your Blueprint trends</p>
            </div>
        );
    }

    // Sort by absolute change (most activity first)
    const sortedTraits = traitIds.sort((a, b) => {
        const changeA = Math.abs(trends[a].change7d);
        const changeB = Math.abs(trends[b].change7d);
        return changeB - changeA;
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Blueprint Trends</h3>
                <span className="text-xs text-osia-neutral-500">{traitIds.length} traits tracked</span>
            </div>

            {sortedTraits.slice(0, limit).map((traitId, index) => {
                const trend = trends[traitId];
                const label = TRAIT_LABELS[traitId] || traitId;
                const change7d = getChangeIndicator(trend.change7d);
                const change30d = getChangeIndicator(trend.change30d);
                const isExpanded = expandedTraits.has(traitId);
                const Icon7d = change7d.icon;
                const Icon30d = change30d.icon;

                return (
                    <motion.div
                        key={traitId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-osia-teal-500/30 transition-colors"
                    >
                        <button
                            onClick={() => toggleTrait(traitId)}
                            className="w-full p-4 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-4">
                                {/* Score Bar */}
                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-osia-teal-500 to-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${trend.current * 100}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{label}</p>
                                    <p className="text-xs text-osia-neutral-500">{(trend.current * 100).toFixed(0)}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* 7-day change badge */}
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${change7d.bg}`}>
                                    <Icon7d className={`w-3.5 h-3.5 ${change7d.color}`} />
                                    <span className={`text-xs font-medium ${change7d.color}`}>
                                        {formatChange(trend.change7d)}
                                    </span>
                                </div>

                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-osia-neutral-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-osia-neutral-500" />
                                )}
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4 border-t border-white/10"
                            >
                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-xs text-osia-neutral-500 mb-1">7-Day Change</p>
                                        <div className="flex items-center gap-2">
                                            <Icon7d className={`w-5 h-5 ${change7d.color}`} />
                                            <span className={`text-lg font-bold ${change7d.color}`}>
                                                {formatChange(trend.change7d)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-xs text-osia-neutral-500 mb-1">30-Day Change</p>
                                        <div className="flex items-center gap-2">
                                            <Icon30d className={`w-5 h-5 ${change30d.color}`} />
                                            <span className={`text-lg font-bold ${change30d.color}`}>
                                                {formatChange(trend.change30d)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
