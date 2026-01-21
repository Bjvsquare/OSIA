import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Zap, GraduationCap, Brain } from 'lucide-react';

interface CoachAction {
    priority: 1 | 2 | 3;
    type: 'intervention' | 'leverage' | 'development';
    title: string;
    description: string;
    involvedMembers?: string[];
    targetLayer?: number;
}

interface PriorityActionSpotlightProps {
    action: CoachAction | null;
    onViewIntelligence?: () => void;
}

export function PriorityActionSpotlight({ action, onViewIntelligence }: PriorityActionSpotlightProps) {
    if (!action) {
        return (
            <div className="bg-gradient-to-br from-osia-neutral-900/80 to-osia-neutral-950 rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">No Actions Required</h4>
                        <p className="text-[10px] text-osia-neutral-500">Your team is in great shape!</p>
                    </div>
                </div>
            </div>
        );
    }

    const getTypeConfig = () => {
        switch (action.type) {
            case 'intervention':
                return {
                    icon: AlertCircle,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/20',
                    label: 'Intervention Needed',
                };
            case 'leverage':
                return {
                    icon: Zap,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/20',
                    label: 'Leverage Opportunity',
                };
            case 'development':
                return {
                    icon: GraduationCap,
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                    label: 'Development Focus',
                };
            default:
                return {
                    icon: Brain,
                    color: 'text-osia-teal-400',
                    bgColor: 'bg-osia-teal-500/10',
                    borderColor: 'border-osia-teal-500/20',
                    label: 'Recommendation',
                };
        }
    };

    const config = getTypeConfig();
    const Icon = config.icon;

    const getPriorityLabel = () => {
        if (action.priority === 1) return 'Urgent';
        if (action.priority === 2) return 'High';
        return 'Standard';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`bg-gradient-to-br from-osia-neutral-900/80 to-osia-neutral-950 rounded-2xl p-6 border ${config.borderColor} relative overflow-hidden`}
        >
            {/* Background glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: config.bgColor.replace('/10', '') }}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                                {config.label}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${action.priority === 1
                                    ? 'bg-red-500/20 text-red-400'
                                    : action.priority === 2
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-white/10 text-osia-neutral-400'
                                }`}>
                                {getPriorityLabel()}
                            </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{action.title}</h4>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-osia-neutral-400 leading-relaxed mb-4 relative">
                {action.description}
            </p>

            {/* CTA */}
            {onViewIntelligence && (
                <button
                    onClick={onViewIntelligence}
                    className="flex items-center gap-2 text-xs font-bold text-osia-teal-400 hover:text-osia-teal-300 transition-colors group"
                >
                    <span>View full analysis in Team Intelligence</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </motion.div>
    );
}
