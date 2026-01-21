import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Users, Target, Zap, Shield } from 'lucide-react';

interface CoachAction {
    priority: 1 | 2 | 3;
    type: 'intervention' | 'leverage' | 'development';
    title: string;
    description: string;
    involvedMembers?: string[];
    targetLayer?: number;
}

interface CoachActionPanelProps {
    actions: CoachAction[];
}

const TYPE_CONFIG = {
    intervention: {
        icon: AlertTriangle,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        label: 'Intervention Required'
    },
    leverage: {
        icon: TrendingUp,
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        label: 'Leverage Opportunity'
    },
    development: {
        icon: Users,
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        label: 'Development Focus'
    }
};

const PRIORITY_LABELS = {
    1: { text: 'URGENT', color: '#EF4444' },
    2: { text: 'HIGH', color: '#F59E0B' },
    3: { text: 'STANDARD', color: '#6B7280' }
};

export function CoachActionPanel({ actions }: CoachActionPanelProps) {
    if (!actions || actions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <Shield className="w-12 h-12 text-osia-teal-500/50 mb-3" />
                <div className="text-sm text-osia-neutral-500">
                    No immediate actions required
                </div>
                <div className="text-xs text-osia-neutral-600 mt-1">
                    Team is operating within normal parameters
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-osia-teal-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-osia-neutral-500">
                        Coach's Recommendations
                    </span>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-osia-neutral-400">
                    {actions.length} Action{actions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Actions list */}
            <div className="space-y-2">
                {actions.map((action, idx) => {
                    const config = TYPE_CONFIG[action.type];
                    const Icon = config.icon;
                    const priority = PRIORITY_LABELS[action.priority];

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group rounded-2xl border transition-all duration-300 hover:scale-[1.01]"
                            style={{
                                backgroundColor: config.bgColor,
                                borderColor: config.borderColor
                            }}
                        >
                            <div className="p-4">
                                {/* Top row: Priority + Type */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: `${priority.color}20`,
                                            color: priority.color
                                        }}
                                    >
                                        {priority.text}
                                    </span>
                                    <span
                                        className="text-[9px] font-semibold uppercase tracking-wider"
                                        style={{ color: config.color }}
                                    >
                                        {config.label}
                                    </span>
                                </div>

                                {/* Action content */}
                                <div className="flex gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${config.color}20` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white mb-1">
                                            {action.title}
                                        </div>
                                        <div className="text-xs text-osia-neutral-400 leading-relaxed">
                                            {action.description}
                                        </div>

                                        {/* Involved members */}
                                        {action.involvedMembers && action.involvedMembers.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                                                <Users className="w-3 h-3 text-osia-neutral-500" />
                                                <span className="text-[10px] text-osia-neutral-500">
                                                    {action.involvedMembers.length} team member{action.involvedMembers.length !== 1 ? 's' : ''} involved
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick summary */}
            <div className="flex items-center justify-between px-2 py-3 mt-4 rounded-xl bg-white/2 border border-white/5">
                <div className="flex items-center gap-4">
                    {Object.entries(
                        actions.reduce((acc, a) => {
                            acc[a.type] = (acc[a.type] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].color }}
                            />
                            <span className="text-[10px] text-osia-neutral-500">
                                {count} {type}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="text-[10px] text-osia-neutral-600">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Click to take action
                </div>
            </div>
        </div>
    );
}
