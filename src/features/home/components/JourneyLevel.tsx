import { motion } from 'framer-motion';
import { Crown, Star, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   JourneyLevel — Journey Progress & Level Card
   Shows current level, XP progress to next level,
   earned badges, and subscription credit discount.
   ───────────────────────────────────────────────────────────── */

interface Badge {
    name: string;
    badgeLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
    icon: string;
    unlockedAt: string;
}

interface JourneyLevelProps {
    level: number;
    title: string;
    totalPoints: number;
    pointsToNextLevel: number;
    nextLevelTitle?: string;
    badgesEarned: Badge[];
    creditDiscount: number;
    totalCredits: number;
}

const LEVEL_COLORS: Record<string, string> = {
    Explorer: '#60a5fa',
    Practitioner: '#34d399',
    Builder: '#fbbf24',
    Architect: '#f97316',
    Visionary: '#a78bfa',
    Master: '#ec4899',
    Luminary: '#f59e0b',
};

const BADGE_BORDER: Record<string, string> = {
    bronze: 'border-amber-700/50',
    silver: 'border-gray-400/50',
    gold: 'border-yellow-400/50',
    platinum: 'border-violet-400/50',
};

const BADGE_GLOW: Record<string, string> = {
    bronze: '0 0 4px rgba(180,83,9,0.3)',
    silver: '0 0 4px rgba(156,163,175,0.3)',
    gold: '0 0 6px rgba(250,204,21,0.4)',
    platinum: '0 0 8px rgba(167,139,250,0.4)',
};

export default function JourneyLevel({
    level,
    title,
    totalPoints,
    pointsToNextLevel,
    nextLevelTitle,
    badgesEarned,
    creditDiscount,
    totalCredits,
}: JourneyLevelProps) {
    const progress = pointsToNextLevel > 0
        ? Math.min(100, Math.round((totalPoints / (totalPoints + pointsToNextLevel)) * 100))
        : 100;
    const color = LEVEL_COLORS[title] || '#60a5fa';

    // Level ring
    const R = 30;
    const circumference = 2 * Math.PI * R;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl shadow-2xl p-5 transition-all duration-300 hover:border-amber-500/30">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Journey Progress</h3>
                    <p className="text-[10px] text-white/30">{totalCredits} credits earned</p>
                </div>
            </div>

            <div className="flex gap-4">
                {/* Level Ring */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <svg width={72} height={72} viewBox="0 0 72 72" className="transform -rotate-90">
                            <circle cx={36} cy={36} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
                            <motion.circle
                                cx={36} cy={36} r={R}
                                fill="none"
                                stroke={color}
                                strokeWidth={4}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black" style={{ color }}>{level}</span>
                            <span className="text-[7px] text-white/25 uppercase tracking-wider">Level</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold mt-1" style={{ color }}>{title}</span>
                </div>

                {/* Progress & Badges */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* XP Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40">Progress</span>
                            {nextLevelTitle && (
                                <span className="flex items-center gap-0.5 text-[9px] text-white/30">
                                    {nextLevelTitle} <ChevronRight className="w-2.5 h-2.5" />
                                </span>
                            )}
                        </div>
                        <div className="h-[5px] rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                                    boxShadow: `0 0 8px ${color}44`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                        <span className="text-[9px] text-white/20 mt-0.5 block">
                            {pointsToNextLevel > 0 ? `${pointsToNextLevel} XP to next level` : 'Max level reached!'}
                        </span>
                    </div>

                    {/* Badges Row */}
                    {badgesEarned.length > 0 && (
                        <div className="mt-2.5">
                            <span className="text-[9px] text-white/25 uppercase tracking-wider font-bold">Badges</span>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                                {badgesEarned.map((b, i) => (
                                    <motion.div
                                        key={b.name}
                                        className={`w-7 h-7 rounded-lg border ${BADGE_BORDER[b.badgeLevel]} bg-white/[0.03] flex items-center justify-center cursor-default group relative`}
                                        style={{ boxShadow: BADGE_GLOW[b.badgeLevel] }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                                        title={b.name}
                                    >
                                        <span className="text-xs">{b.icon}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Credit Discount */}
                    {creditDiscount > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{creditDiscount}% subscription discount</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
