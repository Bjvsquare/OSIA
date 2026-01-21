import { motion } from 'framer-motion';
import { Flame, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FrictionPoint {
    layerId: number;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
}

interface SynergyPoint {
    layerId: number;
    name: string;
    strength: 'strong' | 'moderate';
    description: string;
    leverage: string;
}

interface FrictionSynergyMapProps {
    frictionPoints: FrictionPoint[];
    synergyPoints: SynergyPoint[];
}

const SEVERITY_CONFIG = {
    high: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    medium: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    low: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' }
};

const SYNERGY_CONFIG = {
    strong: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
    moderate: { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.2)' }
};

export function FrictionSynergyMap({ frictionPoints, synergyPoints }: FrictionSynergyMapProps) {
    const hasFriction = frictionPoints && frictionPoints.length > 0;
    const hasSynergy = synergyPoints && synergyPoints.length > 0;

    if (!hasFriction && !hasSynergy) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <CheckCircle2 className="w-12 h-12 text-osia-teal-500/50 mb-3" />
                <div className="text-sm text-osia-neutral-500">
                    Team dynamics are balanced
                </div>
                <div className="text-xs text-osia-neutral-600 mt-1">
                    No significant friction or synergy detected
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Synergy Section */}
            {hasSynergy && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                            Team Synergies
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                            {synergyPoints.length}
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {synergyPoints.map((synergy, idx) => {
                            const config = SYNERGY_CONFIG[synergy.strength];
                            return (
                                <motion.div
                                    key={synergy.layerId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="rounded-xl p-4 border"
                                    style={{
                                        backgroundColor: config.bg,
                                        borderColor: config.border
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <Sparkles className="w-4 h-4" style={{ color: config.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-white">
                                                    {synergy.name}
                                                </span>
                                                <span
                                                    className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: `${config.color}20`,
                                                        color: config.color
                                                    }}
                                                >
                                                    {synergy.strength}
                                                </span>
                                            </div>
                                            <p className="text-xs text-osia-neutral-400 mb-2">
                                                {synergy.description}
                                            </p>
                                            <div className="text-[10px] text-osia-neutral-500 italic">
                                                💡 {synergy.leverage}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Friction Section */}
            {hasFriction && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                            Friction Points
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                            {frictionPoints.length}
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {frictionPoints.map((friction, idx) => {
                            const config = SEVERITY_CONFIG[friction.severity];
                            return (
                                <motion.div
                                    key={friction.layerId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="rounded-xl p-4 border"
                                    style={{
                                        backgroundColor: config.bg,
                                        borderColor: config.border
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <AlertCircle className="w-4 h-4" style={{ color: config.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-white">
                                                    {friction.name}
                                                </span>
                                                <span
                                                    className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: `${config.color}20`,
                                                        color: config.color
                                                    }}
                                                >
                                                    {friction.severity}
                                                </span>
                                            </div>
                                            <p className="text-xs text-osia-neutral-400 mb-2">
                                                {friction.description}
                                            </p>
                                            <div className="text-[10px] text-osia-neutral-500 italic">
                                                🔧 {friction.recommendation}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                <div className="flex items-center gap-4">
                    {hasSynergy && (
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-osia-neutral-400">
                                {synergyPoints.filter(s => s.strength === 'strong').length} strong synergies
                            </span>
                        </div>
                    )}
                    {hasFriction && (
                        <div className="flex items-center gap-1.5">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] text-osia-neutral-400">
                                {frictionPoints.filter(f => f.severity === 'high').length} high-priority areas
                            </span>
                        </div>
                    )}
                </div>
                <div className="text-[10px] text-osia-neutral-600">
                    Updated now
                </div>
            </div>
        </div>
    );
}
