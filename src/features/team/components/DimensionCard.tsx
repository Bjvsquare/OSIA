import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DimensionCardProps {
    title: string;
    score: number; // 0-100
    icon: React.ReactNode;
    description: string;
    index?: number; // For staggered animation
}

export function DimensionCard({ title, score, icon, description, index = 0 }: DimensionCardProps) {
    // Determine trend (compared to 50% baseline)
    const getTrend = () => {
        if (score >= 65) return { icon: TrendingUp, color: 'text-emerald-400', label: 'Strong' };
        if (score >= 45) return { icon: Minus, color: 'text-osia-neutral-400', label: 'Stable' };
        return { icon: TrendingDown, color: 'text-amber-400', label: 'Focus Area' };
    };

    const trend = getTrend();
    const TrendIcon = trend.icon;

    // Color for the progress bar
    const getBarColor = () => {
        if (score >= 75) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
        if (score >= 50) return 'bg-gradient-to-r from-teal-500 to-cyan-400';
        if (score >= 35) return 'bg-gradient-to-r from-amber-500 to-orange-400';
        return 'bg-gradient-to-r from-red-500 to-rose-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="bg-osia-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 text-osia-teal-400">
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">{title}</h4>
                        <p className="text-[10px] text-osia-neutral-500 mt-0.5">{description}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trend.color}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span className="uppercase tracking-wider">{trend.label}</span>
                </div>
            </div>

            {/* Score */}
            <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-black text-white">{score}</span>
                <span className="text-sm text-osia-neutral-500 mb-1">/ 100</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${getBarColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </motion.div>
    );
}
