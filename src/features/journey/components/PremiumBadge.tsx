import { motion } from 'framer-motion';
import { Award, Crown, Diamond, Shield, Star, Zap } from 'lucide-react';

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface PremiumBadgeProps {
    tier: BadgeTier;
    title: string;
    description?: string;
    earned?: boolean;
    earnedAt?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    onClick?: () => void;
}

const TIER_CONFIG: Record<BadgeTier, {
    gradient: string;
    glow: string;
    border: string;
    icon: typeof Award;
    shimmer: string;
    label: string;
}> = {
    bronze: {
        gradient: 'from-amber-700 via-amber-500 to-amber-800',
        glow: 'shadow-[0_0_30px_rgba(217,119,6,0.4)]',
        border: 'border-amber-500/50',
        icon: Shield,
        shimmer: 'from-amber-300/0 via-amber-300/50 to-amber-300/0',
        label: 'Bronze'
    },
    silver: {
        gradient: 'from-gray-400 via-gray-200 to-gray-500',
        glow: 'shadow-[0_0_30px_rgba(156,163,175,0.5)]',
        border: 'border-gray-300/50',
        icon: Star,
        shimmer: 'from-white/0 via-white/80 to-white/0',
        label: 'Silver'
    },
    gold: {
        gradient: 'from-yellow-500 via-yellow-300 to-yellow-600',
        glow: 'shadow-[0_0_40px_rgba(234,179,8,0.5)]',
        border: 'border-yellow-400/60',
        icon: Crown,
        shimmer: 'from-yellow-100/0 via-yellow-100/90 to-yellow-100/0',
        label: 'Gold'
    },
    platinum: {
        gradient: 'from-purple-400 via-blue-300 to-purple-500',
        glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]',
        border: 'border-purple-400/60',
        icon: Zap,
        shimmer: 'from-purple-100/0 via-white/80 to-purple-100/0',
        label: 'Platinum'
    },
    diamond: {
        gradient: 'from-cyan-400 via-white to-cyan-500',
        glow: 'shadow-[0_0_60px_rgba(34,211,238,0.6)]',
        border: 'border-cyan-300/70',
        icon: Diamond,
        shimmer: 'from-cyan-100/0 via-white to-cyan-100/0',
        label: 'Diamond'
    }
};

const SIZE_CONFIG = {
    sm: { container: 'w-16 h-16', icon: 20, ring: 'w-20 h-20' },
    md: { container: 'w-24 h-24', icon: 32, ring: 'w-28 h-28' },
    lg: { container: 'w-32 h-32', icon: 44, ring: 'w-36 h-36' }
};

export function PremiumBadge({
    tier,
    title,
    description,
    earned = true,
    earnedAt,
    size = 'md',
    showLabel = true,
    onClick
}: PremiumBadgeProps) {
    const config = TIER_CONFIG[tier];
    const sizeConfig = SIZE_CONFIG[size];
    const IconComponent = config.icon;

    return (
        <motion.div
            className={`relative flex flex-col items-center gap-3 ${onClick ? 'cursor-pointer' : ''}`}
            whileHover={onClick ? { scale: 1.05 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
        >
            {/* Outer Glow Ring */}
            <div className="relative">
                {earned && (
                    <motion.div
                        className={`absolute inset-0 ${sizeConfig.ring} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-gradient-to-r ${config.gradient} opacity-20 blur-xl`}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Badge Container */}
                <motion.div
                    className={`relative ${sizeConfig.container} rounded-2xl overflow-hidden ${earned ? config.glow : ''} ${earned ? '' : 'grayscale opacity-50'}`}
                    initial={{ rotateY: 0 }}
                    animate={earned ? { rotateY: [0, 5, -5, 0] } : undefined}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {/* Metallic Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

                    {/* 3D Depth Layer */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/30" />

                    {/* Inner Border */}
                    <div className={`absolute inset-1 rounded-xl border ${config.border} bg-gradient-to-br from-black/20 to-transparent`} />

                    {/* Shimmer Effect */}
                    {earned && (
                        <motion.div
                            className={`absolute inset-0 bg-gradient-to-r ${config.shimmer}`}
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: 'easeInOut'
                            }}
                        />
                    )}

                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={earned ? {
                                filter: ['drop-shadow(0 0 8px rgba(255,255,255,0.5))', 'drop-shadow(0 0 16px rgba(255,255,255,0.8))', 'drop-shadow(0 0 8px rgba(255,255,255,0.5))']
                            } : undefined}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <IconComponent
                                size={sizeConfig.icon}
                                className="text-white drop-shadow-lg"
                                strokeWidth={1.5}
                            />
                        </motion.div>
                    </div>

                    {/* Lock Overlay for Unearned */}
                    {!earned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <div className="w-3 h-3 border-2 border-white/50 rounded-sm" />
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Label */}
            {showLabel && (
                <div className="text-center">
                    <h4 className={`text-sm font-bold ${earned ? 'text-white' : 'text-osia-neutral-500'}`}>
                        {title}
                    </h4>
                    {earned && earnedAt && (
                        <p className="text-[10px] text-osia-neutral-500 mt-0.5">
                            Earned {new Date(earnedAt).toLocaleDateString()}
                        </p>
                    )}
                    {!earned && description && (
                        <p className="text-[10px] text-osia-neutral-600 mt-0.5 max-w-[120px]">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* Tier Badge */}
            <motion.span
                className={`absolute -top-1 -right-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg ${earned ? '' : 'grayscale'}`}
                animate={earned ? { scale: [1, 1.05, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {config.label}
            </motion.span>
        </motion.div>
    );
}

// Badge Grid for displaying multiple badges
interface BadgeGridProps {
    badges: Array<{
        id: string;
        tier: BadgeTier;
        title: string;
        description?: string;
        earned: boolean;
        earnedAt?: string;
    }>;
    onBadgeClick?: (badgeId: string) => void;
}

export function BadgeGrid({ badges, onBadgeClick }: BadgeGridProps) {
    return (
        <div data-tour="journey-badges" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {badges.map((badge, index) => (
                <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <PremiumBadge
                        tier={badge.tier}
                        title={badge.title}
                        description={badge.description}
                        earned={badge.earned}
                        earnedAt={badge.earnedAt}
                        onClick={onBadgeClick ? () => onBadgeClick(badge.id) : undefined}
                    />
                </motion.div>
            ))}
        </div>
    );
}
