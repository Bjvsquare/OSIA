import { motion } from 'framer-motion';

interface RoleItem {
    archetype: string;
    count: number;
    color: string;
    icon: string;
    percentage: number;
}

interface RoleDistributionBarProps {
    roles: RoleItem[];
}

export function RoleDistributionBar({ roles }: RoleDistributionBarProps) {
    if (!roles || roles.length === 0) {
        return (
            <div className="text-center py-8 text-osia-neutral-500 text-sm">
                No role data available
            </div>
        );
    }

    const totalCount = roles.reduce((sum, r) => sum + r.count, 0);

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500">
                    Team Role Distribution
                </h4>
                <span className="text-[10px] text-osia-neutral-600">
                    {totalCount} members
                </span>
            </div>

            {/* Stacked bar */}
            <div className="h-10 rounded-xl overflow-hidden flex bg-white/5">
                {roles.map((role, index) => (
                    <motion.div
                        key={role.archetype}
                        initial={{ width: 0 }}
                        animate={{ width: `${role.percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                        className="h-full flex items-center justify-center relative group cursor-pointer"
                        style={{ backgroundColor: role.color }}
                    >
                        {role.percentage >= 15 && (
                            <span className="text-xs font-bold text-white/90">
                                {role.icon}
                            </span>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-osia-neutral-900 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                            <div className="text-xs font-bold text-white">{role.archetype}</div>
                            <div className="text-[10px] text-osia-neutral-400">
                                {role.count} member{role.count !== 1 ? 's' : ''} ({role.percentage}%)
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                    <div key={role.archetype} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                        />
                        <span className="text-[11px] text-osia-neutral-400">
                            <span className="mr-1">{role.icon}</span>
                            {role.archetype}
                            <span className="text-osia-neutral-600 ml-1">({role.count})</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
