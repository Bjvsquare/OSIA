import { motion } from 'framer-motion';
import { GitBranch, TrendingUp, TrendingDown, Minus, Layers, Zap } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   EvolutionTimeline — OSIA Pattern Evolution Card
   Shows growth progress, pattern stability changes,
   and discovered patterns in a compact timeline.
   ───────────────────────────────────────────────────────────── */

interface PatternChange {
    name: string;
    direction: 'improving' | 'declining' | 'stable';
    changePercent: number;
}

interface EvolutionTimelineProps {
    overallGrowth: number;
    stabilityGrowth: number;
    patternsDiscovered: number;
    improvementAreas: string[];
    attentionAreas: string[];
    patternChanges: PatternChange[];
    snapshotCount: number;
}

function GrowthRing({ value }: { value: number }) {
    const R = 28;
    const circumference = 2 * Math.PI * R;
    const clamped = Math.max(0, Math.min(100, value));
    const offset = circumference - (clamped / 100) * circumference;
    const color = value >= 50 ? '#2dd4bf' : value >= 20 ? '#fbbf24' : '#f87171';

    return (
        <div className="relative">
            <svg width={68} height={68} viewBox="0 0 68 68" className="transform -rotate-90">
                <circle cx={34} cy={34} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
                <motion.circle
                    cx={34} cy={34} r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-white tabular-nums">{clamped}%</span>
                <span className="text-[7px] text-white/25 uppercase tracking-wider">Growth</span>
            </div>
        </div>
    );
}

function DirectionIcon({ direction }: { direction: string }) {
    if (direction === 'improving') return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (direction === 'declining') return <TrendingDown className="w-3 h-3 text-rose-400" />;
    return <Minus className="w-3 h-3 text-white/30" />;
}

function DirectionColor(direction: string) {
    if (direction === 'improving') return 'text-emerald-400';
    if (direction === 'declining') return 'text-rose-400';
    return 'text-white/40';
}

export default function EvolutionTimeline({
    overallGrowth,
    patternsDiscovered,
    patternChanges,
    snapshotCount,
}: EvolutionTimelineProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl shadow-2xl p-5 transition-all duration-300 hover:border-cyan-500/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-600/20 flex items-center justify-center">
                        <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Pattern Evolution</h3>
                        <p className="text-[10px] text-white/30">{snapshotCount} snapshots analyzed</p>
                    </div>
                </div>
                {patternsDiscovered > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        <Zap className="w-2.5 h-2.5" />
                        {patternsDiscovered} new
                    </span>
                )}
            </div>

            <div className="flex gap-4">
                {/* Growth Ring */}
                <div className="flex flex-col items-center justify-start pt-1">
                    <GrowthRing value={overallGrowth} />
                </div>

                {/* Pattern Changes */}
                <div className="flex-1 min-w-0">
                    {patternChanges.length > 0 ? (
                        <div className="space-y-2">
                            {patternChanges.map((p, i) => (
                                <motion.div
                                    key={p.name}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                >
                                    <DirectionIcon direction={p.direction} />
                                    <span className="text-[11px] text-white/70 truncate flex-1">{p.name}</span>
                                    <span className={`text-[10px] font-bold tabular-nums ${DirectionColor(p.direction)}`}>
                                        {p.direction === 'improving' ? '+' : p.direction === 'declining' ? '' : ''}
                                        {p.changePercent}%
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-4">
                            <Layers className="w-6 h-6 text-white/10 mb-2" />
                            <p className="text-[11px] text-white/25">Patterns emerge with more data.</p>
                            <p className="text-[9px] text-white/15">Complete more protocols to unlock insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
