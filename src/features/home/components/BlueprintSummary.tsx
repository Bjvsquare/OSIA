import { motion } from 'framer-motion';
import { Dna, TrendingUp, Sparkles } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   BlueprintSummary — Premium trait intelligence card
   Shows top strengths, growth areas, depth gauge, and snapshot count.
   ───────────────────────────────────────────────────────────── */

interface Trait {
    traitId: string;
    layerId: number;
    layerName: string;
    score: number;
    confidence?: number;
}

interface BlueprintSummaryProps {
    strengths: Trait[];
    developing: Trait[];
    depthScore: number;      // 0-100
    snapshotCount: number;
    totalTraits: number;
}

function ScoreBar({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
    const pct = Math.round(score * 100);
    return (
        <div className="relative group">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-white/60 truncate max-w-[160px]">{label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-[6px] rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: `0 0 8px ${color}44`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
        </div>
    );
}

function DepthGauge({ value }: { value: number }) {
    const R = 32;
    const circumference = 2 * Math.PI * R;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 70 ? '#2dd4bf' : value >= 40 ? '#fbbf24' : '#f87171';

    return (
        <div className="relative flex flex-col items-center">
            <svg width={80} height={80} viewBox="0 0 80 80" className="transform -rotate-90">
                <circle cx={40} cy={40} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
                <motion.circle
                    cx={40} cy={40} r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white tabular-nums">{value}%</span>
                <span className="text-[8px] text-white/30 font-medium uppercase tracking-wider">Depth</span>
            </div>
        </div>
    );
}

export default function BlueprintSummary({ strengths, developing, depthScore, snapshotCount, totalTraits }: BlueprintSummaryProps) {
    if (strengths.length === 0 && developing.length === 0) return null;

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl shadow-2xl p-5 transition-all duration-300 hover:border-teal-500/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                        <Dna className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Blueprint Intelligence</h3>
                        <p className="text-[10px] text-white/30">{totalTraits} traits across 15 layers</p>
                    </div>
                </div>
                {snapshotCount > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Refined {snapshotCount}×
                    </span>
                )}
            </div>

            <div className="flex gap-5">
                {/* Strengths + Developing */}
                <div className="flex-1 space-y-3">
                    {/* Top Strengths */}
                    {strengths.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingUp className="w-3 h-3 text-teal-400" />
                                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Strengths</span>
                            </div>
                            <div className="space-y-2.5">
                                {strengths.map((t, i) => (
                                    <ScoreBar
                                        key={t.traitId}
                                        label={t.layerName}
                                        score={t.score}
                                        color="#2dd4bf"
                                        delay={0.1 + i * 0.1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Developing Areas */}
                    {developing.length > 0 && (
                        <div className="mt-3">
                            <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Growth Areas</span>
                            <div className="space-y-2.5 mt-2">
                                {developing.map((t, i) => (
                                    <ScoreBar
                                        key={t.traitId}
                                        label={t.layerName}
                                        score={t.score}
                                        color="#fbbf24"
                                        delay={0.4 + i * 0.1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Depth Gauge */}
                <div className="flex flex-col items-center justify-center min-w-[90px]">
                    <DepthGauge value={depthScore} />
                    <span className="text-[9px] text-white/20 mt-1">Blueprint Depth</span>
                </div>
            </div>
        </div>
    );
}
