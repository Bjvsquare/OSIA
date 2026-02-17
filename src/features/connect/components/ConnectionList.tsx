import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Users, MoreHorizontal, Activity, ChevronRight, ChevronDown, Zap, ArrowRightLeft, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { useAuth } from '../../../features/auth/AuthContext';
import { ConnectionDeepDive } from './ConnectionDeepDive';
import { TypeChangeNotifications, ProposeTypeChangeModal } from '../ConnectionTypeReview';

interface Connection {
    userId: string;
    username: string;
    name?: string;
    avatarUrl?: string;
    connectionType: string;
    connectedSince: string;
}

interface CompatibilityScore {
    overallScore: number;
    patternAlignment: number;
    themeResonance: number;
    claimComplementarity: number;
}

export function ConnectionList() {
    const { auth } = useAuth();
    const token = auth.token;
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [synastryCache, setSynastryCache] = useState<Record<string, any>>({});
    const [reviewConnection, setReviewConnection] = useState<Connection | null>(null);
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<Connection | null>(null);
    const queryClient = useQueryClient();

    const removeMutation = useMutation({
        mutationFn: async (targetUserId: string) => {
            await axios.delete(`/api/connect/remove/${targetUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            setConfirmRemove(null);
            setSelectedConnection(null);
            setMenuOpenFor(null);
        }
    });

    const { data: connections = [], isLoading } = useQuery({
        queryKey: ['connections'],
        queryFn: async () => {
            const res = await axios.get('/api/connect/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data as Connection[];
        }
    });

    // Fetch synastry for selected connection
    const { data: selectedSynastry, isLoading: isSynastryLoading } = useQuery({
        queryKey: ['synastry-deep', selectedConnection?.userId],
        queryFn: async () => {
            if (!selectedConnection) return null;
            const res = await axios.get(`/api/connect/synastry/${selectedConnection.userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Cache the result
            setSynastryCache(prev => ({ ...prev, [selectedConnection.userId]: res.data }));
            return res.data;
        },
        enabled: !!selectedConnection,
        staleTime: 1000 * 60 * 5
    });

    const handleSelectConnection = (conn: Connection) => {
        if (selectedConnection?.userId === conn.userId) {
            setSelectedConnection(null);
        } else {
            setSelectedConnection(conn);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-osia-teal-500" /></div>;
    }

    if (connections.length === 0) {
        return (
            <div className="text-center py-20 text-osia-neutral-500">
                <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Build Your Circle</h3>
                <p className="max-w-md mx-auto mb-6">
                    You don't have any connections yet. Go to the <strong>Discover</strong> tab to find your team or friends.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Type change notifications banner */}
            <TypeChangeNotifications />

            {/* Connection Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map((conn) => {
                    const isSelected = selectedConnection?.userId === conn.userId;
                    return (
                        <motion.div
                            key={conn.userId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white/5 border rounded-xl p-5 transition-all group relative cursor-pointer ${isSelected
                                ? 'border-osia-teal-500/50 ring-2 ring-osia-teal-500/20'
                                : 'border-white/10 hover:border-osia-teal-500/30'
                                }`}
                            onClick={() => handleSelectConnection(conn)}
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="text-osia-neutral-400 hover:text-osia-teal-400 p-1 rounded transition-colors"
                                    title="Review connection type"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewConnection(conn);
                                    }}
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                </button>
                                <div className="relative">
                                    <button
                                        className="text-osia-neutral-400 hover:text-white p-1 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenFor(menuOpenFor === conn.userId ? null : conn.userId);
                                        }}
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    <AnimatePresence>
                                        {menuOpenFor === conn.userId && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                                            >
                                                <button
                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmRemove(conn);
                                                        setMenuOpenFor(null);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove Connection
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-osia-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                                    {conn.avatarUrl ? (
                                        <img src={conn.avatarUrl} alt={conn.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-medium text-white">{conn.username.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg">{conn.name || conn.username}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-osia-neutral-300 border border-white/5">
                                            {conn.connectionType}
                                        </span>
                                        <CompatibilityBadge targetUserId={conn.userId} token={token || ''} />
                                    </div>
                                </div>
                            </div>

                            <SynastrySummary
                                targetUserId={conn.userId}
                                token={token || ''}
                                isExpanded={isSelected}
                                cachedSynastry={synastryCache[conn.userId]}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Deep Dive Section (replaces modal) */}
            <AnimatePresence>
                {selectedConnection && (
                    <ConnectionDeepDive
                        connection={selectedConnection}
                        synastryData={selectedSynastry || synastryCache[selectedConnection.userId] || { score: 0, summary: 'Loading...' }}
                        onClose={() => setSelectedConnection(null)}
                        currentUserName={'You'}
                    />
                )}
            </AnimatePresence>

            {/* Loading indicator for deep dive */}
            {selectedConnection && isSynastryLoading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-osia-teal-500 animate-spin" />
                </div>
            )}

            {/* Propose Type Change Modal */}
            <AnimatePresence>
                {reviewConnection && (
                    <ProposeTypeChangeModal
                        connection={reviewConnection}
                        onClose={() => setReviewConnection(null)}
                    />
                )}
            </AnimatePresence>

            {/* Remove Confirmation Dialog */}
            <AnimatePresence>
                {confirmRemove && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setConfirmRemove(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#12121f] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-white">Remove Connection</h3>
                                <button onClick={() => setConfirmRemove(null)} className="text-osia-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-osia-neutral-300 text-sm mb-6">
                                Are you sure you want to remove <strong className="text-white">{confirmRemove.name || confirmRemove.username}</strong> from your circle? This will disconnect you both.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-osia-neutral-300 hover:bg-white/10 transition-colors text-sm font-medium"
                                    onClick={() => setConfirmRemove(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                                    disabled={removeMutation.isPending}
                                    onClick={() => removeMutation.mutate(confirmRemove.userId)}
                                >
                                    {removeMutation.isPending ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface SynastrySummaryProps {
    targetUserId: string;
    token: string;
    isExpanded?: boolean;
    cachedSynastry?: any;
}

function SynastrySummary({ targetUserId, token, isExpanded, cachedSynastry }: SynastrySummaryProps) {
    const { data: synastry, isLoading, isError } = useQuery({
        queryKey: ['synastry', targetUserId],
        queryFn: async () => {
            const res = await axios.get(`/api/connect/synastry/${targetUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
        enabled: !cachedSynastry
    });

    const data = cachedSynastry || synastry;

    return (
        <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-osia-teal-400 text-sm font-medium mb-1">
                <Activity className="w-4 h-4" />
                <span>Synastry Active</span>
            </div>
            {isLoading && !cachedSynastry ? (
                <div className="h-8 flex items-center">
                    <div className="w-4 h-4 border-2 border-osia-teal-500/30 border-t-osia-teal-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <p className="text-xs text-osia-neutral-300 line-clamp-2 mb-2">
                        {isError ? "Dynamics unavailable" : (data?.summary || "Initializing deep field...")}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                        {data?.highlights && data.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {data.highlights.slice(0, 1).map((h: string, i: number) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-osia-teal-500/10 text-osia-teal-400 border border-osia-teal-500/20">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        )}
                        {data && (
                            <div className="flex items-center gap-1 text-[10px] text-osia-teal-500 font-bold">
                                {isExpanded ? (
                                    <>
                                        <span>VIEWING</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </>
                                ) : (
                                    <>
                                        <span>DEEP DIVE</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ========== OSIA Compatibility Badge ==========
interface CompatibilityBadgeProps {
    targetUserId: string;
    token: string;
}

function CompatibilityBadge({ targetUserId, token }: CompatibilityBadgeProps) {
    const { data: compatibility, isLoading } = useQuery({
        queryKey: ['compatibility', targetUserId],
        queryFn: async () => {
            const res = await axios.get(`/api/compatibility/${targetUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data as CompatibilityScore;
        },
        staleTime: 1000 * 60 * 30, // Cache for 30 min
        retry: 1
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-8 h-3 rounded bg-white/20" />
            </div>
        );
    }

    if (!compatibility) return null;

    const score = compatibility.overallScore;
    const getScoreColor = (s: number) => {
        if (s >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
        if (s >= 60) return { bg: 'bg-osia-teal-500/20', text: 'text-osia-teal-400', border: 'border-osia-teal-500/30' };
        if (s >= 40) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
        return { bg: 'bg-white/10', text: 'text-osia-neutral-400', border: 'border-white/10' };
    };

    const colors = getScoreColor(score);

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bg} border ${colors.border}`}>
            <Zap className={`w-3 h-3 ${colors.text}`} />
            <span className={`text-[10px] font-bold ${colors.text}`}>
                {Math.round(score)}%
            </span>
        </div>
    );
}
