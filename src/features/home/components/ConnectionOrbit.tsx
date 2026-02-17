import { motion } from 'framer-motion';
import { Users, UserPlus, ArrowRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   ConnectionOrbit — Connection Network Mini Card
   Shows connection count, avatar stack, pending requests,
   and connection type breakdown.
   ───────────────────────────────────────────────────────────── */

interface ConnectionAvatar {
    name: string;
    avatar?: string;
}

interface TypeBreakdown {
    type: string;
    count: number;
}

interface ConnectionOrbitProps {
    totalCount: number;
    pendingCount: number;
    typeBreakdown: TypeBreakdown[];
    recentAvatars: ConnectionAvatar[];
}

const TYPE_COLORS: Record<string, string> = {
    friend: '#34d399',
    family: '#f97316',
    colleague: '#60a5fa',
    partner: '#ec4899',
    mentor: '#a78bfa',
    mentee: '#fbbf24',
};

const TYPE_LABELS: Record<string, string> = {
    friend: 'Friends',
    family: 'Family',
    colleague: 'Colleagues',
    partner: 'Partners',
    mentor: 'Mentors',
    mentee: 'Mentees',
};

function AvatarStack({ avatars }: { avatars: ConnectionAvatar[] }) {
    const shown = avatars.slice(0, 4);
    return (
        <div className="flex -space-x-2">
            {shown.map((a, i) => (
                <motion.div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0a1128] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden"
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300 }}
                    title={a.name}
                >
                    {a.avatar ? (
                        <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-white/50">
                            {a.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    )}
                </motion.div>
            ))}
            {avatars.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-[#0a1128] bg-white/5 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white/40">+{avatars.length - 4}</span>
                </div>
            )}
        </div>
    );
}

export default function ConnectionOrbit({ totalCount, pendingCount, typeBreakdown, recentAvatars }: ConnectionOrbitProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl shadow-2xl p-5 transition-all duration-300 hover:border-blue-500/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Connection Network</h3>
                        <p className="text-[10px] text-white/30">{totalCount} connection{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {pendingCount > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full animate-pulse">
                        <UserPlus className="w-2.5 h-2.5" />
                        {pendingCount} pending
                    </span>
                )}
            </div>

            {totalCount > 0 ? (
                <div className="space-y-3">
                    {/* Avatar Stack */}
                    {recentAvatars.length > 0 && (
                        <AvatarStack avatars={recentAvatars} />
                    )}

                    {/* Type Breakdown Pills */}
                    {typeBreakdown.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {typeBreakdown.map((tb) => (
                                <motion.span
                                    key={tb.type}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: `${TYPE_COLORS[tb.type] || '#64748b'}15`,
                                        color: TYPE_COLORS[tb.type] || '#94a3b8',
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[tb.type] || '#64748b' }} />
                                    {TYPE_LABELS[tb.type] || tb.type} ({tb.count})
                                </motion.span>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <button className="flex items-center gap-1 text-[10px] font-medium text-blue-400/60 hover:text-blue-400 transition-colors mt-1">
                        View all connections <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center py-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-blue-400/30" />
                    </div>
                    <p className="text-[11px] text-white/25">No connections yet</p>
                    <p className="text-[9px] text-white/15">Connect with others to unlock compatibility insights</p>
                </div>
            )}
        </div>
    );
}
