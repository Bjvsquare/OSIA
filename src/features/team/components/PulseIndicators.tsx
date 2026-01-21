import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Sparkles, Database } from 'lucide-react';

interface PulseIndicatorsProps {
    dataCoverage: number; // 0-1
    syncedCount: number;
    totalCount: number;
    frictionCount: number;
    synergyCount: number;
}

export function PulseIndicators({
    dataCoverage,
    syncedCount,
    totalCount,
    frictionCount,
    synergyCount
}: PulseIndicatorsProps) {
    const coveragePercent = Math.round(dataCoverage * 100);

    const indicators = [
        {
            label: 'Data Coverage',
            value: `${syncedCount}/${totalCount}`,
            subtext: `${coveragePercent}% synced`,
            icon: Database,
            color: coveragePercent >= 80 ? 'text-emerald-400' : coveragePercent >= 50 ? 'text-amber-400' : 'text-red-400',
            bgColor: coveragePercent >= 80 ? 'bg-emerald-500/10' : coveragePercent >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10',
        },
        {
            label: 'Friction Points',
            value: frictionCount.toString(),
            subtext: frictionCount === 0 ? 'None detected' : frictionCount === 1 ? 'area' : 'areas',
            icon: AlertTriangle,
            color: frictionCount === 0 ? 'text-emerald-400' : frictionCount <= 2 ? 'text-amber-400' : 'text-red-400',
            bgColor: frictionCount === 0 ? 'bg-emerald-500/10' : frictionCount <= 2 ? 'bg-amber-500/10' : 'bg-red-500/10',
        },
        {
            label: 'Synergy Hotspots',
            value: synergyCount.toString(),
            subtext: synergyCount === 0 ? 'Developing' : synergyCount === 1 ? 'strength' : 'strengths',
            icon: Sparkles,
            color: synergyCount >= 3 ? 'text-emerald-400' : synergyCount >= 1 ? 'text-teal-400' : 'text-osia-neutral-400',
            bgColor: synergyCount >= 3 ? 'bg-emerald-500/10' : synergyCount >= 1 ? 'bg-teal-500/10' : 'bg-white/5',
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {indicators.map((indicator, index) => {
                const Icon = indicator.icon;
                return (
                    <motion.div
                        key={indicator.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={`${indicator.bgColor} rounded-xl p-4 border border-white/5`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${indicator.color}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-osia-neutral-500">
                                {indicator.label}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black ${indicator.color}`}>
                                {indicator.value}
                            </span>
                            {indicator.subtext && indicator.subtext !== 'None detected' && indicator.subtext !== 'Developing' && (
                                <span className="text-xs text-osia-neutral-500">
                                    {indicator.subtext}
                                </span>
                            )}
                        </div>
                        {(indicator.subtext === 'None detected' || indicator.subtext === 'Developing') && (
                            <span className="text-[10px] text-osia-neutral-500">
                                {indicator.subtext}
                            </span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
