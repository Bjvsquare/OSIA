import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRightLeft, Check, X, Loader2, Bell, ChevronDown,
    Heart, Users, Briefcase, Star, UserCheck, GraduationCap
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

/* ═══════════════════════════════════════════════════════════
   ConnectionTypeReview — Mutual approval for connection
   type changes (e.g. Friend → Spouse, Colleague → Mentor)
   ═══════════════════════════════════════════════════════════ */

interface TypeChangeRequest {
    requestId: string;
    fromUserId: string;
    fromUsername?: string;
    fromName?: string;
    fromAvatar?: string;
    toUserId: string;
    currentType: string;
    proposedType: string;
    proposedSubType?: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
    respondedAt?: string;
}

// ── Relationship type config ─────────────────────────────────
const TYPE_OPTIONS = [
    { value: 'family', label: 'Family', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
    { value: 'friends', label: 'Friends', icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
    { value: 'colleagues', label: 'Colleagues', icon: Briefcase, color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
    { value: 'team', label: 'Team', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
    { value: 'org', label: 'Organization', icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
];

const SUBTYPE_MAP: Record<string, { value: string; label: string }[]> = {
    family: [
        { value: 'spouse', label: 'Spouse' },
        { value: 'partner', label: 'Partner' },
        { value: 'parent', label: 'Parent' },
        { value: 'child', label: 'Child' },
        { value: 'sibling', label: 'Sibling' },
        { value: 'extended_family', label: 'Extended Family' },
    ],
    friends: [
        { value: 'best_friend', label: 'Best Friend' },
        { value: 'close_friend', label: 'Close Friend' },
        { value: 'acquaintance', label: 'Acquaintance' },
    ],
    colleagues: [
        { value: 'direct_team', label: 'Direct Team' },
        { value: 'cross_team', label: 'Cross Team' },
        { value: 'manager', label: 'Manager' },
        { value: 'mentor', label: 'Mentor' },
        { value: 'mentee', label: 'Mentee' },
    ],
    team: [
        { value: 'direct_team', label: 'Direct Team' },
        { value: 'manager', label: 'Manager' },
    ],
    org: [
        { value: 'mentor', label: 'Mentor' },
        { value: 'mentee', label: 'Mentee' },
    ],
};

function getTypeConfig(type: string) {
    return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[1];
}

/* ── Propose Type Change Modal ──────────────────────────────── */
interface ProposeModalProps {
    connection: { userId: string; username: string; name?: string; connectionType: string };
    onClose: () => void;
}

export function ProposeTypeChangeModal({ connection, onClose }: ProposeModalProps) {
    const { auth } = useAuth();
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState('');
    const [selectedSubType, setSelectedSubType] = useState('');

    const proposeMutation = useMutation({
        mutationFn: async () => {
            await axios.post('/api/connect/propose-type-change', {
                targetUserId: connection.userId,
                proposedType: selectedType,
                proposedSubType: selectedSubType || undefined,
            }, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['type-change-requests'] });
            onClose();
        },
    });

    const subtypes = selectedType ? (SUBTYPE_MAP[selectedType] || []) : [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-osia-teal-500/20 flex items-center justify-center">
                        <ArrowRightLeft className="w-5 h-5 text-osia-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Review Connection</h3>
                        <p className="text-osia-neutral-400 text-sm">
                            Change how you're connected with <strong className="text-white">{connection.name || connection.username}</strong>
                        </p>
                    </div>
                </div>

                {/* Current type */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-xs text-osia-neutral-500 uppercase tracking-wider">Current</span>
                    <div className="mt-1 text-white font-medium">{connection.connectionType}</div>
                </div>

                {/* Select new type */}
                <div className="mb-4">
                    <span className="text-xs text-osia-neutral-500 uppercase tracking-wider mb-2 block">Proposed Type</span>
                    <div className="grid grid-cols-2 gap-2">
                        {TYPE_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const isSelected = selectedType === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSelectedType(opt.value); setSelectedSubType(''); }}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${isSelected
                                        ? `${opt.bg} ${opt.border} ${opt.color}`
                                        : 'bg-white/5 border-white/10 text-osia-neutral-400 hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Select subtype */}
                <AnimatePresence>
                    {subtypes.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <span className="text-xs text-osia-neutral-500 uppercase tracking-wider mb-2 block">Specific Relationship</span>
                            <div className="flex flex-wrap gap-2">
                                {subtypes.map(sub => (
                                    <button
                                        key={sub.value}
                                        onClick={() => setSelectedSubType(sub.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSubType === sub.value
                                            ? 'bg-osia-teal-500/20 border-osia-teal-500/40 text-osia-teal-400'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-osia-neutral-300 hover:bg-white/10 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => proposeMutation.mutate()}
                        disabled={!selectedType || selectedType === connection.connectionType || proposeMutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-osia-teal-500 text-white font-bold hover:bg-osia-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {proposeMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <UserCheck className="w-4 h-4" />
                                Propose
                            </>
                        )}
                    </button>
                </div>

                {proposeMutation.isError && (
                    <p className="text-red-400 text-xs mt-3 text-center">
                        {(proposeMutation.error as any)?.response?.data?.error || 'Failed to propose change'}
                    </p>
                )}

                <p className="text-osia-neutral-500 text-xs mt-4 text-center">
                    Both users must approve for the change to take effect.
                </p>
            </motion.div>
        </motion.div>
    );
}

/* ── Pending Type Change Notifications ──────────────────────── */
export function TypeChangeNotifications() {
    const { auth } = useAuth();
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['type-change-requests'],
        queryFn: async () => {
            const res = await axios.get('/api/connect/type-change-requests', {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return res.data as { pending: TypeChangeRequest[]; all: TypeChangeRequest[] };
        },
        refetchInterval: 15000,
        enabled: !!auth.token,
    });

    const respondMutation = useMutation({
        mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) => {
            await axios.post('/api/connect/respond-type-change', { requestId, action }, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['type-change-requests'] });
            queryClient.invalidateQueries({ queryKey: ['connections'] });
        },
    });

    const pendingCount = data?.pending?.length || 0;

    if (isLoading || pendingCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-osia-teal-500/10 border border-osia-teal-500/20 text-osia-teal-400 hover:bg-osia-teal-500/15 transition-colors"
            >
                <Bell className="w-5 h-5" />
                <span className="flex-1 text-left font-medium text-sm">
                    {pendingCount} connection review{pendingCount !== 1 ? 's' : ''} pending
                </span>
                <span className="px-2 py-0.5 rounded-full bg-osia-teal-500/30 text-xs font-bold">
                    {pendingCount}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 mt-3">
                            {data!.pending.map(req => {
                                const fromConfig = getTypeConfig(req.currentType);
                                const toConfig = getTypeConfig(req.proposedType);
                                const FromIcon = fromConfig.icon;
                                const ToIcon = toConfig.icon;

                                return (
                                    <motion.div
                                        key={req.requestId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-osia-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                                                {req.fromAvatar ? (
                                                    <img src={req.fromAvatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-white">
                                                        {(req.fromName || req.fromUsername || '?').substring(0, 2).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-sm">
                                                    {req.fromName || req.fromUsername}
                                                </p>
                                                <p className="text-osia-neutral-500 text-xs">
                                                    wants to change connection type
                                                </p>
                                            </div>
                                        </div>

                                        {/* Type change visualization */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${fromConfig.bg} border ${fromConfig.border}`}>
                                                <FromIcon className={`w-3.5 h-3.5 ${fromConfig.color}`} />
                                                <span className={`text-xs font-medium ${fromConfig.color}`}>{req.currentType}</span>
                                            </div>
                                            <ArrowRightLeft className="w-4 h-4 text-osia-neutral-500" />
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${toConfig.bg} border ${toConfig.border}`}>
                                                <ToIcon className={`w-3.5 h-3.5 ${toConfig.color}`} />
                                                <span className={`text-xs font-medium ${toConfig.color}`}>
                                                    {req.proposedSubType || req.proposedType}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondMutation.mutate({ requestId: req.requestId, action: 'reject' })}
                                                disabled={respondMutation.isPending}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-osia-neutral-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors text-sm font-medium"
                                            >
                                                <X className="w-4 h-4" />
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => respondMutation.mutate({ requestId: req.requestId, action: 'approve' })}
                                                disabled={respondMutation.isPending}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-osia-teal-500/20 border border-osia-teal-500/30 text-osia-teal-400 hover:bg-osia-teal-500/30 transition-colors text-sm font-bold"
                                            >
                                                {respondMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
