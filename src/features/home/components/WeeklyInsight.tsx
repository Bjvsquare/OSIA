import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Lightbulb, Trophy, Lock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   WeeklyInsight — Contextual insight card

   Shows auto-generated weekly insights based on user activity.
   Gradient accent border with pulsing glow.
   ═══════════════════════════════════════════════════════════ */

interface WeeklyInsightProps {
    insights: string[];
    milestones: { icon: string; label: string; achieved: boolean }[];
}

export function WeeklyInsight({ insights, milestones }: WeeklyInsightProps) {
    const achieved = milestones.filter(m => m.achieved);
    const nextUp = milestones.find(m => !m.achieved);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Insights Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="p-5 border-white/[0.06] bg-[#0a1128]/60 backdrop-blur-xl h-full relative overflow-hidden">
                    {/* Gradient accent top border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-osia-teal-500/0 via-osia-teal-500/50 to-osia-teal-500/0" />

                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-osia-teal-500/10 flex items-center justify-center">
                            <Lightbulb className="w-3.5 h-3.5 text-osia-teal-400" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                            Weekly Insight
                        </h2>
                    </div>

                    {insights.length > 0 ? (
                        <div className="space-y-2.5">
                            {insights.slice(0, 3).map((insight, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="text-xs text-white/50 leading-relaxed font-medium"
                                >
                                    {insight}
                                </motion.p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-white/15 font-medium">
                            Complete some practices this week to see your personalized insights.
                        </p>
                    )}
                </Card>
            </motion.div>

            {/* Milestones Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card className="p-5 border-white/[0.06] bg-[#0a1128]/60 backdrop-blur-xl h-full relative overflow-hidden">
                    {/* Gradient accent top border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />

                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                            Milestones
                        </h2>
                    </div>

                    {achieved.length > 0 || nextUp ? (
                        <div className="space-y-2">
                            {/* Achieved milestones */}
                            {achieved.slice(-4).map((m, i) => (
                                <motion.div
                                    key={m.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03]"
                                >
                                    <span className="text-sm">{m.icon}</span>
                                    <span className="text-[10px] font-bold text-white/50">{m.label}</span>
                                    <span className="text-[8px] font-bold text-emerald-400/60 ml-auto">✓</span>
                                </motion.div>
                            ))}

                            {/* Next milestone */}
                            {nextUp && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01]"
                                >
                                    <div className="w-5 h-5 rounded-md bg-white/[0.03] flex items-center justify-center">
                                        <Lock className="w-2.5 h-2.5 text-white/15" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-white/25">{nextUp.label}</span>
                                        <span className="text-[8px] font-bold text-white/10 ml-2">Next</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-white/15 font-medium">
                            Start completing practices to unlock milestones.
                        </p>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
