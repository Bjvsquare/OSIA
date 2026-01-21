import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Flame, Zap, Brain, Heart, Target, Sparkles, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react';

interface ProtocolCardProps {
    protocol: any;
    variant: 'active' | 'recommended' | 'history';
    onAction: (action: 'execute' | 'setup' | 'log') => void;
    index?: number;
}

const COMPLEXITY_LEVELS = {
    beginner: { label: 'Beginner', color: 'text-green-400 bg-green-500/20', description: 'Great for starting out' },
    intermediate: { label: 'Intermediate', color: 'text-yellow-400 bg-yellow-500/20', description: 'Builds on foundations' },
    advanced: { label: 'Advanced', color: 'text-orange-400 bg-orange-500/20', description: 'Deeper exploration' },
    master: { label: 'Master', color: 'text-purple-400 bg-purple-500/20', description: 'Peak performance' }
};

const TYPE_CONFIG = {
    reflection: {
        icon: Sparkles,
        gradient: 'from-purple-500/20 to-pink-500/20',
        border: 'border-purple-500/30',
        description: 'Strategic clarity and decision quality'
    },
    energy: {
        icon: Heart,
        gradient: 'from-red-500/20 to-orange-500/20',
        border: 'border-red-500/30',
        description: 'Peak performance and capacity optimization'
    },
    connection: {
        icon: Target,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        description: 'Stakeholder relationships and network capital'
    },
    focus: {
        icon: Brain,
        gradient: 'from-green-500/20 to-teal-500/20',
        border: 'border-green-500/30',
        description: 'Priority execution and high-leverage focus'
    }
};

export function ProtocolCard({ protocol, variant, onAction, index = 0 }: ProtocolCardProps) {
    const config = TYPE_CONFIG[protocol.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.reflection;
    const complexity = COMPLEXITY_LEVELS[protocol.complexity as keyof typeof COMPLEXITY_LEVELS] || COMPLEXITY_LEVELS.beginner;
    const Icon = config.icon;

    const getCompletionRate = () => {
        if (!protocol.completions?.length) return 0;
        // Calculate completion rate based on expected frequency
        const days = 7; // Last week
        const expected = protocol.frequency === 'Daily' ? days : protocol.frequency === 'Weekly' ? 1 : 3;
        return Math.min(100, Math.round((protocol.completions.length / expected) * 100));
    };

    const getStreak = () => {
        if (!protocol.completions?.length) return 0;
        // Simple streak calculation
        const dates = protocol.completions
            .map((c: any) => new Date(c.completedAt).toDateString())
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
        return dates.length;
    };

    if (variant === 'active') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
            >
                <Card className={`p-0 overflow-hidden bg-gradient-to-br ${config.gradient} ${config.border} hover:border-white/30 transition-all group`}>
                    {/* Header with type icon */}
                    <div className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${complexity.color}`}>
                                            {complexity.label}
                                        </span>
                                        <span className="text-xs text-osia-neutral-500">{protocol.duration}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{protocol.title}</h3>
                                    <p className="text-sm text-osia-neutral-400 line-clamp-2">{protocol.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="px-6 py-4 bg-black/20 border-t border-white/5">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-osia-teal-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-bold">{protocol.completions?.length || 0}</span>
                                </div>
                                <p className="text-[10px] text-osia-neutral-500 mt-0.5">Completions</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-orange-400">
                                    <Flame className="w-4 h-4" />
                                    <span className="font-bold">{getStreak()}</span>
                                </div>
                                <p className="text-[10px] text-osia-neutral-500 mt-0.5">Day Streak</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-green-400">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="font-bold">{getCompletionRate()}%</span>
                                </div>
                                <p className="text-[10px] text-osia-neutral-500 mt-0.5">Consistency</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-black/30 flex gap-3">
                        <Button
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                            onClick={() => onAction('log')}
                        >
                            Quick Log
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-osia-teal-600 to-purple-600"
                            onClick={() => onAction('execute')}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Execute
                        </Button>
                    </div>
                </Card>
            </motion.div>
        );
    }

    if (variant === 'recommended') {
        const relevanceScore = protocol.relevanceScore || 50;
        const reasons = protocol.reasons || [];

        // Color based on relevance
        const getRelevanceColor = (score: number) => {
            if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
            if (score >= 60) return 'bg-osia-teal-500/20 text-osia-teal-400 border-osia-teal-500/30';
            return 'bg-white/10 text-osia-neutral-400 border-white/10';
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
            >
                <Card className="p-5 hover:border-osia-teal-500/40 transition-all group cursor-pointer" onClick={() => onAction('setup')}>
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${complexity.color}`}>
                                    {protocol.type}
                                </span>
                                <span className="text-xs text-osia-neutral-600">{protocol.duration}</span>
                                {/* Relevance Score Badge */}
                                {relevanceScore > 50 && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRelevanceColor(relevanceScore)}`}>
                                        {relevanceScore}% Match
                                    </span>
                                )}
                            </div>
                            <h3 className="text-base font-bold text-white group-hover:text-osia-teal-300 transition-colors truncate">
                                {protocol.title}
                            </h3>
                            <p className="text-sm text-osia-neutral-500 line-clamp-1">{protocol.description || config.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-osia-neutral-600 group-hover:text-osia-teal-400 transition-colors shrink-0" />
                    </div>

                    {/* OSIA Personalization Reason */}
                    {reasons.length > 0 && reasons[0] !== 'Complete your Blueprint for personalized recommendations' && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-osia-neutral-400">
                                <Sparkles className="w-3 h-3 text-osia-teal-400 shrink-0" />
                                <span className="line-clamp-1">{reasons[0]}</span>
                            </div>
                        </div>
                    )}

                    {/* Blueprint Impact Preview */}
                    {protocol.blueprintImpact && !reasons.length && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-osia-neutral-500">
                                <Sparkles className="w-3 h-3 text-osia-teal-400" />
                                <span>Strengthens: <span className="text-osia-teal-400">{protocol.blueprintImpact.join(', ')}</span></span>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        );
    }

    // History variant
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="p-4 bg-white/[0.02] border-white/5">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 opacity-60`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-osia-neutral-300 truncate">{protocol.title}</h4>
                        <p className="text-xs text-osia-neutral-600">
                            Completed {protocol.completions?.length || 0} times • Archived {new Date(protocol.completedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
