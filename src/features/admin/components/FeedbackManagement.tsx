import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Lightbulb, AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle, ChevronDown, ExternalLink, Image } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';

type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

interface Feedback {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    category: FeedbackCategory;
    priority: FeedbackPriority;
    title: string;
    description: string;
    pageUrl: string;
    screenshotPath: string | null;
    status: FeedbackStatus;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

interface FeedbackStats {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: typeof Clock }> = {
    new: { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
    resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle }
};

const CATEGORY_ICONS: Record<FeedbackCategory, typeof Bug> = {
    bug: Bug,
    feature: Lightbulb,
    improvement: AlertTriangle,
    other: MessageSquare
};

const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    critical: 'text-red-400'
};

export function FeedbackManagement() {
    const { auth } = useAuth();
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [filters, setFilters] = useState({
        status: '' as '' | FeedbackStatus,
        category: '' as '' | FeedbackCategory,
        priority: '' as '' | FeedbackPriority
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.category) params.append('category', filters.category);
            if (filters.priority) params.append('priority', filters.priority);

            const [feedbackRes, statsRes] = await Promise.all([
                fetch(`/api/feedback?${params}`, {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                }),
                fetch('/api/feedback/stats', {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                })
            ]);

            if (feedbackRes.ok) {
                const data = await feedbackRes.json();
                setFeedback(data.feedback || []);
            }
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: FeedbackStatus) => {
        try {
            const res = await fetch(`/api/feedback/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                await loadData();
                if (selectedFeedback?.id === id) {
                    setSelectedFeedback(prev => prev ? { ...prev, status } : null);
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-white/[0.02]">
                        <div className="text-sm text-osia-neutral-500">Total Feedback</div>
                        <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
                    </Card>
                    <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                        <div className="text-sm text-blue-400">New</div>
                        <div className="text-2xl font-bold text-blue-300 mt-1">{stats.byStatus.new || 0}</div>
                    </Card>
                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                        <div className="text-sm text-yellow-400">In Progress</div>
                        <div className="text-2xl font-bold text-yellow-300 mt-1">{stats.byStatus.inProgress || 0}</div>
                    </Card>
                    <Card className="p-4 bg-green-500/10 border-green-500/20">
                        <div className="text-sm text-green-400">Resolved</div>
                        <div className="text-2xl font-bold text-green-300 mt-1">{stats.byStatus.resolved || 0}</div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={filters.category}
                    onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                    <option value="">All Categories</option>
                    <option value="bug">Bugs</option>
                    <option value="feature">Features</option>
                    <option value="improvement">Improvements</option>
                    <option value="other">Other</option>
                </select>
                <select
                    value={filters.priority}
                    onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <Button variant="outline" size="sm" onClick={loadData}>
                    Refresh
                </Button>
            </div>

            {/* Feedback List */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* List Panel */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="text-center py-8 text-osia-neutral-500">Loading...</div>
                    ) : feedback.length === 0 ? (
                        <Card className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-osia-neutral-600 mx-auto mb-3" />
                            <p className="text-osia-neutral-500">No feedback yet</p>
                        </Card>
                    ) : (
                        feedback.map(item => {
                            const CategoryIcon = CATEGORY_ICONS[item.category];
                            const statusConfig = STATUS_CONFIG[item.status];

                            return (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    onClick={() => setSelectedFeedback(item)}
                                    className={`cursor-pointer transition-all ${selectedFeedback?.id === item.id ? 'ring-2 ring-osia-teal-500' : ''}`}
                                >
                                    <Card className="p-4 hover:bg-white/[0.03] transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${item.category === 'bug' ? 'bg-red-500/20' : item.category === 'feature' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                                                <CategoryIcon className={`w-4 h-4 ${item.category === 'bug' ? 'text-red-400' : item.category === 'feature' ? 'text-yellow-400' : 'text-blue-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                                                    <span className={`px-2 py-0.5 text-[10px] rounded-full border ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-osia-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-osia-neutral-600">
                                                    <span>{item.userName}</span>
                                                    <span>•</span>
                                                    <span className={PRIORITY_COLORS[item.priority]}>{item.priority}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                <AnimatePresence mode="wait">
                    {selectedFeedback && (
                        <motion.div
                            key={selectedFeedback.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="p-6 sticky top-0">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{selectedFeedback.title}</h3>
                                        <p className="text-sm text-osia-neutral-500 mt-1">
                                            by {selectedFeedback.userName} ({selectedFeedback.userEmail})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFeedback(null)}
                                        className="p-1 hover:bg-white/10 rounded"
                                    >
                                        <XCircle className="w-5 h-5 text-osia-neutral-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-lg border ${STATUS_CONFIG[selectedFeedback.status].color}`}>
                                            {STATUS_CONFIG[selectedFeedback.status].label}
                                        </span>
                                        <span className="px-2 py-1 text-xs rounded-lg bg-white/10 text-white capitalize">
                                            {selectedFeedback.category}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-lg bg-white/10 ${PRIORITY_COLORS[selectedFeedback.priority]}`}>
                                            {selectedFeedback.priority} priority
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h4 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-wider mb-2">Description</h4>
                                        <p className="text-sm text-osia-neutral-300 whitespace-pre-wrap">{selectedFeedback.description}</p>
                                    </div>

                                    {/* Page URL */}
                                    {selectedFeedback.pageUrl && (
                                        <div>
                                            <h4 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-wider mb-2">Page</h4>
                                            <a
                                                href={selectedFeedback.pageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-osia-teal-400 hover:underline flex items-center gap-1"
                                            >
                                                {selectedFeedback.pageUrl}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Screenshot */}
                                    {selectedFeedback.screenshotPath && (
                                        <div>
                                            <h4 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-wider mb-2">Screenshot</h4>
                                            <a
                                                href={selectedFeedback.screenshotPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-osia-teal-400 hover:underline"
                                            >
                                                <Image className="w-4 h-4" />
                                                View Screenshot
                                            </a>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-white/10">
                                        <h4 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-wider mb-3">Update Status</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(['new', 'in_progress', 'resolved', 'closed'] as FeedbackStatus[]).map(status => (
                                                <Button
                                                    key={status}
                                                    variant={selectedFeedback.status === status ? 'primary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => updateStatus(selectedFeedback.id, status)}
                                                >
                                                    {STATUS_CONFIG[status].label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timestamps */}
                                    <div className="text-xs text-osia-neutral-600 pt-4 border-t border-white/10">
                                        <p>Created: {formatDate(selectedFeedback.createdAt)}</p>
                                        <p>Updated: {formatDate(selectedFeedback.updatedAt)}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
