import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

interface SynergyZone {
    area: string;
    strength: number;
    description: string;
    layers: number[];
}

interface FrictionZone {
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    layers: number[];
    improvementTip: string;
}

interface SynergyFrictionCardsProps {
    synergyZones: SynergyZone[];
    frictionZones: FrictionZone[];
    onFocusArea?: (zone: FrictionZone) => void;
}

export function SynergyFrictionCards({ synergyZones, frictionZones, onFocusArea }: SynergyFrictionCardsProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'border-red-500/30 bg-red-500/5';
            case 'medium': return 'border-orange-500/30 bg-orange-500/5';
            default: return 'border-yellow-500/30 bg-yellow-500/5';
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-500/20 text-red-400';
            case 'medium': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Synergy Zones */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em]">
                        Synergy Zones — What's Working
                    </h3>
                </div>

                {synergyZones.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-sm text-osia-neutral-400">No strong synergy zones detected yet.</p>
                    </div>
                ) : (
                    synergyZones.map((zone, index) => (
                        <motion.div
                            key={zone.area}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-white">{zone.area}</h4>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">
                                    {Math.round(zone.strength * 100)}% strong
                                </span>
                            </div>
                            <p className="text-sm text-osia-neutral-300 mb-3">{zone.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {zone.layers.map(l => (
                                    <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                                        L{l}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Friction Zones */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em]">
                        Growth Areas — Room to Improve
                    </h3>
                </div>

                {frictionZones.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-sm text-osia-neutral-400">No significant friction zones detected.</p>
                    </div>
                ) : (
                    frictionZones.map((zone, index) => (
                        <motion.div
                            key={zone.area}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-5 rounded-xl border transition-colors ${getSeverityColor(zone.severity)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-white">{zone.area}</h4>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getSeverityBadge(zone.severity)}`}>
                                    {zone.severity}
                                </span>
                            </div>
                            <p className="text-sm text-osia-neutral-300 mb-3">{zone.description}</p>

                            {/* Improvement tip */}
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5 mb-3">
                                <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-osia-neutral-200 italic">{zone.improvementTip}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {zone.layers.map(l => (
                                        <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-osia-neutral-400 border border-white/10">
                                            L{l}
                                        </span>
                                    ))}
                                </div>
                                {onFocusArea && (
                                    <button
                                        onClick={() => onFocusArea(zone)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-osia-teal-400 hover:text-osia-teal-300 uppercase tracking-wider"
                                    >
                                        Focus on this
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
