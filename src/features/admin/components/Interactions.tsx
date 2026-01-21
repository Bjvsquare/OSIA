import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Activity, MessageSquare, Heart, Share2, Zap, Search, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';

type InteractionType = 'signal' | 'reflection' | 'connection' | 'delegation' | 'all';

interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    userId?: string;
    username?: string;
    details?: string;
    metadata?: Record<string, any>;
}

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; category: InteractionType }> = {
    'login': { icon: Activity, color: 'text-osia-teal-500', category: 'signal' },
    'signup': { icon: Zap, color: 'text-amber-500', category: 'signal' },
    'blueprint_update': { icon: Activity, color: 'text-osia-teal-500', category: 'signal' },
    'pattern_feedback': { icon: MessageSquare, color: 'text-osia-purple-500', category: 'reflection' },
    'refinement_complete': { icon: MessageSquare, color: 'text-osia-purple-500', category: 'reflection' },
    'connection_request': { icon: Heart, color: 'text-red-400', category: 'connection' },
    'connection_accepted': { icon: Heart, color: 'text-red-400', category: 'connection' },
    'team_join': { icon: Share2, color: 'text-blue-400', category: 'connection' },
    'team_sync': { icon: Share2, color: 'text-blue-400', category: 'connection' },
    'consent_update': { icon: Zap, color: 'text-amber-500', category: 'delegation' },
    'data_export': { icon: Zap, color: 'text-amber-500', category: 'delegation' },
};

const DEFAULT_CONFIG = { icon: Activity, color: 'text-osia-neutral-400', category: 'signal' as InteractionType };

function getTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export function Interactions() {
    const { auth } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<InteractionType>('all');
    const [showMetadata, setShowMetadata] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const token = auth.token;
            const res = await fetch('/api/admin/interactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Failed to fetch logs (${res.status})`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data.slice(0, 50) : []);
        } catch (err: any) {
            setError(err.message || 'Failed to load interaction logs');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const enrichedLogs = logs.map(log => {
        const config = ACTION_CONFIG[log.action] || DEFAULT_CONFIG;
        return {
            ...log,
            icon: config.icon,
            color: config.color,
            category: config.category,
            displayUser: log.username || log.userId?.slice(0, 8) || 'System',
            displayAction: log.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Activity',
            timeAgo: getTimeAgo(log.timestamp),
        };
    });

    const filteredLogs = enrichedLogs.filter(item => {
        const matchesSearch = searchQuery === '' ||
            item.displayUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.displayAction.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || item.category === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Interaction Logs</h3>
                    <p className="text-sm text-osia-neutral-500">{filteredLogs.length} of {logs.length} interactions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                        <RefreshCw className={`w-4 h-4 text-osia-neutral-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-osia-teal-500 bg-osia-teal-500/10 px-3 py-1.5 rounded-full border border-osia-teal-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-osia-teal-500 animate-pulse" />
                        Audit Log
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-red-400 font-bold">{error}</p>
                        <p className="text-xs text-osia-neutral-500 mt-1">Check that the audit logs API endpoint is available.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchLogs} className="ml-auto">Retry</Button>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-osia-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search users or actions..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-osia-neutral-500 focus:border-osia-teal-500/50 focus:outline-none text-sm"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as InteractionType)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                    <option value="all">All Types</option>
                    <option value="signal">Signals</option>
                    <option value="reflection">Reflections</option>
                    <option value="connection">Connections</option>
                    <option value="delegation">Delegations</option>
                </select>
            </div>

            {/* Loading State */}
            {loading && logs.length === 0 && (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-4 border-white/5 bg-[#0a1128]/40 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-24 bg-white/5 rounded" />
                                    <div className="h-2 w-48 bg-white/5 rounded" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredLogs.length === 0 && !error && (
                <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
                    <Activity className="w-8 h-8 text-osia-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-osia-neutral-400 font-bold">No interactions recorded yet</p>
                    <p className="text-xs text-osia-neutral-600 mt-1">Activity will appear here as users interact with the platform.</p>
                </Card>
            )}

            {/* Interactions Grid */}
            <div className="grid gap-3">
                <AnimatePresence>
                    {filteredLogs.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="p-4 border-white/5 bg-[#0a1128]/40 group hover:border-white/10 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{item.displayUser}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-osia-neutral-500 uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-600">{item.displayAction}</div>
                                            {item.details && <div className="text-sm text-osia-neutral-400">{item.details}</div>}

                                            {/* Expandable Metadata */}
                                            {showMetadata === item.id && item.metadata && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-2 p-2 rounded-lg bg-white/5 text-xs text-osia-neutral-500 space-y-1"
                                                >
                                                    {Object.entries(item.metadata).map(([key, value]) => (
                                                        <p key={key}>{key}: <span className="text-osia-neutral-400">{String(value)}</span></p>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                                            <button
                                                onClick={() => setShowMetadata(showMetadata === item.id ? null : item.id)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4 text-osia-neutral-600 hover:text-white" />
                                            </button>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-osia-neutral-600 whitespace-nowrap">{item.timeAgo}</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {filteredLogs.length > 0 && (
                <Card className="p-8 text-center border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-osia-neutral-600">
                        <Share2 size={20} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-osia-neutral-400">Showing latest {filteredLogs.length} interactions</h4>
                        <p className="text-[10px] text-osia-neutral-600 uppercase tracking-widest">Sourced from platform audit logs</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
