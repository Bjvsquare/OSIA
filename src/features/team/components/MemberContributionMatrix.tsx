import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MemberContribution {
    userId: string;
    name: string;
    topStrengths: { layerId: number; name: string; score: number }[];
    developmentAreas: { layerId: number; name: string; score: number }[];
    overallImpact: number;
    roleArchetype: string;
    roleFit: number;
}

interface MemberContributionMatrixProps {
    contributions: MemberContribution[];
}

const ROLE_COLORS: Record<string, string> = {
    'Strategist': '#8B5CF6',
    'Executor': '#F59E0B',
    'Connector': '#10B981',
    'Innovator': '#EC4899',
    'Anchor': '#6366F1'
};

const ROLE_ICONS: Record<string, string> = {
    'Strategist': '🧠',
    'Executor': '⚡',
    'Connector': '🤝',
    'Innovator': '💡',
    'Anchor': '⚓'
};

export function MemberContributionMatrix({ contributions }: MemberContributionMatrixProps) {
    const [sortBy, setSortBy] = useState<'impact' | 'fit' | 'name'>('impact');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    if (!contributions || contributions.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-osia-neutral-500 text-sm">
                No member data available
            </div>
        );
    }

    const sortedContributions = [...contributions].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'impact') comparison = a.overallImpact - b.overallImpact;
        else if (sortBy === 'fit') comparison = a.roleFit - b.roleFit;
        else comparison = a.name.localeCompare(b.name);
        return sortDir === 'desc' ? -comparison : comparison;
    });

    const toggleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const getImpactColor = (impact: number) => {
        if (impact > 0.05) return 'text-emerald-500';
        if (impact < -0.05) return 'text-red-500';
        return 'text-osia-neutral-400';
    };

    const getImpactIcon = (impact: number) => {
        if (impact > 0.05) return <TrendingUp className="w-3 h-3" />;
        if (impact < -0.05) return <TrendingDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-osia-neutral-500 font-bold px-4">
                <button
                    onClick={() => toggleSort('name')}
                    className={`flex-1 text-left flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'name' ? 'text-white' : ''}`}
                >
                    Member
                    {sortBy === 'name' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
                <button
                    onClick={() => toggleSort('fit')}
                    className={`w-24 text-center flex items-center justify-center gap-1 hover:text-white transition-colors ${sortBy === 'fit' ? 'text-white' : ''}`}
                >
                    Role Fit
                    {sortBy === 'fit' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
                <button
                    onClick={() => toggleSort('impact')}
                    className={`w-20 text-right flex items-center justify-end gap-1 hover:text-white transition-colors ${sortBy === 'impact' ? 'text-white' : ''}`}
                >
                    Impact
                    {sortBy === 'impact' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
            </div>

            {/* Members list */}
            <div className="space-y-2">
                {sortedContributions.map((member, idx) => (
                    <motion.div
                        key={member.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl border transition-all duration-300 cursor-pointer ${expandedMember === member.userId
                                ? 'bg-white/5 border-white/15'
                                : 'bg-white/2 border-white/5 hover:bg-white/4 hover:border-white/10'
                            }`}
                        onClick={() => setExpandedMember(expandedMember === member.userId ? null : member.userId)}
                    >
                        {/* Main row */}
                        <div className="flex items-center gap-2 p-4">
                            {/* Avatar placeholder with role icon */}
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                style={{ backgroundColor: `${ROLE_COLORS[member.roleArchetype]}20` }}
                            >
                                {ROLE_ICONS[member.roleArchetype] || '👤'}
                            </div>

                            {/* Name and role */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">
                                    {member.name || 'Unknown Member'}
                                </div>
                                <div
                                    className="text-[10px] uppercase tracking-wider font-semibold"
                                    style={{ color: ROLE_COLORS[member.roleArchetype] }}
                                >
                                    {member.roleArchetype}
                                </div>
                            </div>

                            {/* Role Fit Badge */}
                            <div className="w-24 flex justify-center">
                                <div
                                    className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                                    style={{
                                        backgroundColor: `${ROLE_COLORS[member.roleArchetype]}15`,
                                        color: ROLE_COLORS[member.roleArchetype]
                                    }}
                                >
                                    {Math.round(member.roleFit)}% Fit
                                </div>
                            </div>

                            {/* Impact indicator */}
                            <div className={`w-20 flex items-center justify-end gap-1 font-mono text-xs font-bold ${getImpactColor(member.overallImpact)}`}>
                                {getImpactIcon(member.overallImpact)}
                                {member.overallImpact > 0 ? '+' : ''}{(member.overallImpact * 100).toFixed(1)}%
                            </div>
                        </div>

                        {/* Expanded details */}
                        {expandedMember === member.userId && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4 pt-0 border-t border-white/5"
                            >
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    {/* Strengths */}
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-osia-neutral-500 font-bold mb-2">
                                            Top Strengths
                                        </div>
                                        <div className="space-y-1.5">
                                            {member.topStrengths.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${s.score * 100}%` }}
                                                            transition={{ delay: 0.2 + i * 0.1 }}
                                                            className="h-full bg-emerald-500 rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] text-osia-neutral-300 truncate flex-1">
                                                        {s.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-emerald-500">
                                                        {Math.round(s.score * 100)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Development Areas */}
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-osia-neutral-500 font-bold mb-2">
                                            Growth Areas
                                        </div>
                                        <div className="space-y-1.5">
                                            {member.developmentAreas.map((d, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${d.score * 100}%` }}
                                                            transition={{ delay: 0.2 + i * 0.1 }}
                                                            className="h-full bg-amber-500 rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] text-osia-neutral-300 truncate flex-1">
                                                        {d.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-amber-500">
                                                        {Math.round(d.score * 100)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
