import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Award, TrendingUp, Lock, Check, Sparkles, Gift, Calendar, Zap, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';

const BADGE_COLORS = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-blue-300 to-purple-400'
};

const BADGE_GLOW = {
    bronze: 'shadow-[0_0_20px_rgba(217,119,6,0.3)]',
    silver: 'shadow-[0_0_20px_rgba(156,163,175,0.3)]',
    gold: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
    platinum: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]'
};

export function JourneyPage() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<any>(null);
    const [level, setLevel] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    // OSIA Evolution state
    const [evolution, setEvolution] = useState<any>(null);
    const [reflection, setReflection] = useState<any>(null);
    const [nextSteps, setNextSteps] = useState<string[]>([]);

    useEffect(() => {
        loadJourneyData();
    }, []);

    const loadJourneyData = async () => {
        try {
            const [progressData, levelData, badgesData, evolutionData, reflectionData, nextStepsData] = await Promise.all([
                api.getJourneyProgress(),
                api.getJourneyLevel(),
                api.getJourneyBadges(),
                api.getEvolutionTimeline().catch(() => null),
                api.getEvolutionReflection().catch(() => null),
                api.getEvolutionNextSteps().catch(() => ({ recommendations: [] }))
            ]);
            setProgress(progressData);
            setLevel(levelData);
            setBadges(badgesData);
            setEvolution(evolutionData);
            setReflection(reflectionData);
            setNextSteps(nextStepsData.recommendations || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load journey', error);
            setLoading(false);
        }
    };

    const getAvatarSrc = () => {
        if (userProfile?.avatarUrl) {
            return `${resolveAvatarUrl(userProfile.avatarUrl)}?t=${userProfile.refreshKey || 0}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'Explorer')}&background=0D1117&color=38A3A5`;
    };



    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-osia-neutral-400">Loading your journey...</div>
            </div>
        );
    }

    const credits = progress?.subscriptionCredits;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header with Level */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white">Growth Journey</h1>
                    <p className="text-osia-neutral-400">Your engagement rewards & growth milestones</p>
                </div>

                <Card className="p-6 bg-gradient-to-br from-osia-teal-500/10 to-purple-500/10 border-osia-teal-500/30 min-w-[280px]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-osia-neutral-200 overflow-hidden ring-2 ring-osia-teal-500">
                            <img src={getAvatarSrc()} alt={userProfile?.name || 'User'} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">Level {level?.level || 1}</span>
                                <TrendingUp className="w-5 h-5 text-osia-teal-400" />
                            </div>
                            <p className="text-sm text-osia-teal-300 font-medium">{level?.title || 'Explorer'}</p>
                            <p className="text-xs text-osia-neutral-500 mt-1">{level?.totalPoints || 0} points earned</p>
                        </div>
                    </div>
                    {level?.pointsToNextLevel > 0 && level?.nextLevelTitle && (
                        <div className="mt-4">
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-osia-teal-500 to-purple-500 transition-all"
                                    style={{ width: `${Math.min(100, ((level.totalPoints) / (level.totalPoints + level.pointsToNextLevel)) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-osia-neutral-600 mt-1">{level.pointsToNextLevel} pts to {level.nextLevelTitle}</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Subscription Credits - The Main Feature */}
            <Card data-tour="journey-credits" className="p-8 bg-gradient-to-br from-green-500/10 via-osia-teal-500/5 to-purple-500/10 border-green-500/30">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="w-32 h-32 relative">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="64" cy="64" r="56"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="12"
                            />
                            <circle
                                cx="64" cy="64" r="56"
                                fill="none"
                                stroke="url(#creditGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${(credits?.discountPercentage || 0) * 3.52} 352`}
                            />
                            <defs>
                                <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#34D399" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{credits?.discountPercentage || 0}%</span>
                            <span className="text-xs text-osia-neutral-400">OFF</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 text-center lg:text-left">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
                                <Gift className="w-6 h-6 text-green-400" />
                                Next Month's Discount
                            </h2>
                            <p className="text-osia-neutral-400 mt-1">
                                Earn credits through daily engagement to unlock your subscription discount
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                            {[25, 50, 75, 100].map(tier => (
                                <div
                                    key={tier}
                                    className={`px-4 py-2 rounded-xl border ${(credits?.discountPercentage || 0) >= tier
                                        ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                        : 'bg-white/5 border-white/10 text-osia-neutral-500'
                                        }`}
                                >
                                    <span className="font-bold">{tier}%</span>
                                    <span className="text-xs ml-1">({tier} credits)</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-osia-neutral-500">
                            <span className="text-osia-teal-400 font-bold">{credits?.totalCredits || 0}</span> credits earned this month
                        </p>
                    </div>
                </div>
            </Card>

            {/* How to Earn Credits */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">How to Earn Credits</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { action: 'Daily Check-in', credits: 2, icon: Calendar },
                        { action: 'Protocol Step', credits: 3, icon: Zap },
                        { action: 'Team Message', credits: 1, icon: Sparkles },
                        { action: 'Join Team', credits: 5, icon: TrendingUp },
                        { action: 'Create Team', credits: 10, icon: Star },
                        { action: 'Make Connection', credits: 8, icon: Award },
                        { action: 'Refine Blueprint', credits: 5, icon: TrendingUp },
                        { action: 'Daily Session', credits: 1, icon: Calendar },
                    ].map((item, i) => (
                        <Card key={i} className="p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                            <item.icon className="w-6 h-6 text-osia-teal-400 mb-2" />
                            <p className="text-sm font-medium text-white">{item.action}</p>
                            <p className="text-xs text-green-400">+{item.credits} credits</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Level Benefits */}
            {level?.perks && level.perks.length > 0 && (
                <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-400" />
                        Your Level {level.level} Perks
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {level.perks.map((perk: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-sm">
                                {perk}
                            </span>
                        ))}
                    </div>
                </Card>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-osia-neutral-500 uppercase tracking-wider">Current Phase</p>
                            <p className="text-2xl font-bold text-white mt-1">{progress?.phaseName || 'Foundation'}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-osia-teal-500/20 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-osia-teal-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-osia-neutral-500 uppercase tracking-wider">Milestones</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {progress?.completedMilestones?.length || 0} earned
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Award className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-osia-neutral-500 uppercase tracking-wider">Active Days</p>
                            <p className="text-2xl font-bold text-white mt-1">{progress?.activeDaysThisMonth || 0} this month</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* OSIA Evolution Section */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Pattern Evolution */}
                <Card className="p-6 bg-gradient-to-br from-osia-teal-500/5 to-transparent border-osia-teal-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-osia-teal-400" />
                        Pattern Evolution
                    </h3>
                    {evolution?.patternChanges && evolution.patternChanges.length > 0 ? (
                        <div className="space-y-3">
                            {evolution.patternChanges.slice(0, 4).map((change: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${change.direction === 'improving' ? 'bg-green-400' :
                                                change.direction === 'declining' ? 'bg-amber-400' : 'bg-osia-neutral-500'
                                            }`} />
                                        <span className="text-sm text-white">{change.patternName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${change.changePercent > 0 ? 'text-green-400' :
                                                change.changePercent < 0 ? 'text-amber-400' : 'text-osia-neutral-500'
                                            }`}>
                                            {change.changePercent > 0 ? '+' : ''}{change.changePercent}%
                                        </span>
                                        <span className="text-xs text-osia-neutral-500">{change.currentStability}% stable</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-osia-neutral-500">
                            Complete more Blueprint sessions to track your pattern evolution.
                        </p>
                    )}
                </Card>

                {/* Reflection Module */}
                <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Reflection: Past vs Present
                    </h3>
                    {reflection ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/[0.03] rounded-lg border-l-2 border-osia-neutral-600">
                                <p className="text-xs text-osia-neutral-500 uppercase tracking-wider mb-1">Then</p>
                                <p className="text-sm text-osia-neutral-300">{reflection.pastSelf}</p>
                            </div>
                            <div className="p-4 bg-osia-teal-500/10 rounded-lg border-l-2 border-osia-teal-500">
                                <p className="text-xs text-osia-teal-400 uppercase tracking-wider mb-1">Now</p>
                                <p className="text-sm text-white">{reflection.presentSelf}</p>
                            </div>
                            {reflection.keyEvolutions?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {reflection.keyEvolutions.map((evo: any, i: number) => (
                                        <span key={i} className={`px-2 py-1 rounded text-xs ${evo.significance === 'major'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'bg-white/10 text-osia-neutral-400'
                                            }`}>
                                            {evo.area}: {evo.fromState} → {evo.toState}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-osia-neutral-500">
                            Continue your journey to unlock reflection insights comparing your growth over time.
                        </p>
                    )}
                </Card>
            </div>

            {/* Next Steps Forward */}
            {nextSteps.length > 0 && (
                <Card className="p-6 bg-gradient-to-r from-green-500/5 to-osia-teal-500/5 border-green-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-400" />
                        Next Steps Forward
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {nextSteps.map((step: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-green-400">{i + 1}</span>
                                </div>
                                <p className="text-sm text-osia-neutral-300">{step}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Milestone Map */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Milestone Map</h2>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={async () => {
                            const result = await api.checkMilestones();
                            if (result.unlockedCount > 0) {
                                await loadJourneyData();
                            }
                        }}
                    >
                        Check for New Milestones
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-osia-teal-500/20 via-purple-500/20 to-transparent" />

                    <div className="space-y-6">
                        {/* Completed Milestones */}
                        {progress?.completedMilestones?.map((milestone: any, index: number) => (
                            <motion.div
                                key={milestone.milestoneId || milestone.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-20"
                            >
                                <div className={`absolute left-0 top-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${BADGE_COLORS[milestone.badgeLevel as keyof typeof BADGE_COLORS]} ${BADGE_GLOW[milestone.badgeLevel as keyof typeof BADGE_GLOW]} flex items-center justify-center border border-white/20`}>
                                    <Award className="w-8 h-8 text-white" />
                                </div>

                                <Card className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border-osia-teal-500/30">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">{milestone.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${milestone.badgeLevel === 'platinum' ? 'bg-purple-500/20 text-purple-300' :
                                                    milestone.badgeLevel === 'gold' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        milestone.badgeLevel === 'silver' ? 'bg-gray-500/20 text-gray-300' :
                                                            'bg-amber-500/20 text-amber-300'
                                                    }`}>
                                                    {milestone.badgeLevel}
                                                </span>
                                            </div>
                                            <p className="text-sm text-osia-neutral-400 mb-3">{milestone.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-osia-teal-400">
                                                <Check className="w-4 h-4" />
                                                <span>Unlocked {new Date(milestone.unlockedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Next Milestones (Locked) */}
                        {progress?.nextMilestones?.slice(0, 3).map((milestone: any, index: number) => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (progress?.completedMilestones?.length + index) * 0.1 }}
                                className="relative pl-20 opacity-50"
                            >
                                <div className="absolute left-0 top-0 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-osia-neutral-600" />
                                </div>

                                <Card className="p-6 bg-white/[0.02] border-white/10">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-osia-neutral-500">{milestone.name}</h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-osia-neutral-600">
                                                    {milestone.badgeLevel}
                                                </span>
                                            </div>
                                            <p className="text-sm text-osia-neutral-600">{milestone.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Earned Badges Gallery */}
            {badges.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Badge Collection</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {badges.map((badge) => (
                            <motion.div
                                key={badge.id}
                                whileHover={{ scale: 1.05 }}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${BADGE_COLORS[badge.badgeLevel as keyof typeof BADGE_COLORS]} ${BADGE_GLOW[badge.badgeLevel as keyof typeof BADGE_GLOW]} border border-white/20 text-center`}
                            >
                                <Award className="w-12 h-12 text-white mx-auto mb-3" />
                                <p className="text-xs font-bold text-white">{badge.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
