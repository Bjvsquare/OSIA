import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock,
    Eye, UserCheck, UserX, RefreshCw, Search, Filter,
    Image as ImageIcon, FileText, Loader2, ChevronDown
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../services/api';

/* ═══════════════════════════════════════════════════════════
   KYCReviewPanel — Admin panel for managing KYC submissions

   Shows:
   - Stats overview (pending, verified, locked, etc.)
   - Pending review queue with portrait preview
   - Approve/Reject actions with reason
   - All records table with status filter
   ═══════════════════════════════════════════════════════════ */

interface KYCRecord {
    userId: string;
    accountType: 'individual' | 'organization';
    status: string;
    registeredAt: string;
    kycDeadline: string;
    extendedDeadline?: string;
    unlockUsed: boolean;
    portrait?: {
        imageUrl: string;
        uploadedAt: string;
        validationStatus: string;
        rejectionReason?: string;
        metadata?: { width: number; height: number; format: string; fileSizeBytes: number };
    };
    idDocument?: { documentUrl: string; uploadedAt: string };
    orgVerification?: {
        logoUrl?: string;
        businessName?: string;
        businessRegDocUrl?: string;
        taxId?: string;
        contactEmail?: string;
        logoValidation?: string;
    };
    verificationHistory: { event: string; timestamp: string; details?: string }[];
    verifiedAt?: string;
    verifiedBy?: string;
}

interface QueueStats {
    total: number;
    pendingCount: number;
    submittedCount: number;
    underReviewCount: number;
    verifiedCount: number;
    lockedCount: number;
    rejectedCount: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
    submitted: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
    under_review: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-500' },
    verified: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
    locked: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-600' },
    locked_final: { bg: 'bg-red-600/20', text: 'text-red-500', dot: 'bg-red-700' },
};

export function KYCReviewPanel() {
    const [pending, setPending] = useState<KYCRecord[]>([]);
    const [allRecords, setAllRecords] = useState<KYCRecord[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'queue' | 'all'>('queue');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [queueData, allData] = await Promise.all([
                api.getKYCAdminQueue(),
                api.getKYCAllRecords()
            ]);
            setPending(queueData.pending || []);
            setStats(queueData.stats || null);
            setAllRecords(allData.records || []);
        } catch (error) {
            console.error('[KYC Admin] Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleReview = async (userId: string, decision: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            await api.adminReviewKYC(userId, decision, decision === 'reject' ? rejectReason : undefined);
            setRejectReason('');
            setExpandedRecord(null);
            await fetchData();
        } catch (error) {
            console.error('[KYC Admin] Review failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckDeadlines = async () => {
        try {
            const result = await api.checkKYCDeadlines();
            console.log('[KYC Admin] Deadline check result:', result);
            await fetchData();
        } catch (error) {
            console.error('[KYC Admin] Deadline check failed:', error);
        }
    };

    const filteredRecords = allRecords
        .filter(r => statusFilter === 'all' || r.status === statusFilter)
        .filter(r => !searchQuery || r.userId.toLowerCase().includes(searchQuery.toLowerCase()));

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch { return dateStr; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-osia-teal-500 animate-spin" />
                <span className="ml-3 text-white/50 text-sm">Loading KYC data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-white' },
                        { label: 'Pending', value: stats.pendingCount, color: 'text-amber-400' },
                        { label: 'Submitted', value: stats.submittedCount, color: 'text-blue-400' },
                        { label: 'Under Review', value: stats.underReviewCount, color: 'text-indigo-400' },
                        { label: 'Verified', value: stats.verifiedCount, color: 'text-green-400' },
                        { label: 'Rejected', value: stats.rejectedCount, color: 'text-red-400' },
                        { label: 'Locked', value: stats.lockedCount, color: 'text-red-500' },
                    ].map(stat => (
                        <Card key={stat.label} className="p-4 border-white/5 bg-white/[0.02] text-center">
                            <p className="text-[9px] font-bold text-osia-neutral-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Toggle + Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setView('queue')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'queue' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        Review Queue {pending.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px]">{pending.length}</span>}
                    </button>
                    <button
                        onClick={() => setView('all')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'all' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        All Records
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="text-[10px] uppercase tracking-wider"
                        onClick={handleCheckDeadlines}
                    >
                        <Clock className="w-3 h-3 mr-1.5" />
                        Check Deadlines
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="text-[10px] uppercase tracking-wider"
                        onClick={fetchData}
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Review Queue View */}
            {view === 'queue' && (
                <div className="space-y-4">
                    {pending.length === 0 ? (
                        <Card className="p-12 border-white/5 bg-white/[0.02] text-center">
                            <CheckCircle className="w-10 h-10 text-green-500/30 mx-auto mb-3" />
                            <p className="text-white/40 font-medium">No pending reviews</p>
                            <p className="text-white/20 text-sm mt-1">All KYC submissions have been reviewed.</p>
                        </Card>
                    ) : (
                        pending.map(record => (
                            <Card
                                key={record.userId}
                                className="border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors"
                            >
                                <div className="p-5 flex items-start gap-5">
                                    {/* Portrait Preview */}
                                    <div
                                        className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 cursor-pointer hover:border-osia-teal-500/50 transition-colors"
                                        onClick={() => {
                                            const imgUrl = record.portrait?.imageUrl || record.orgVerification?.logoUrl;
                                            if (imgUrl) setPreviewImage(imgUrl);
                                        }}
                                    >
                                        {(record.portrait?.imageUrl || record.orgVerification?.logoUrl) ? (
                                            <img
                                                src={record.portrait?.imageUrl || record.orgVerification?.logoUrl}
                                                alt="KYC portrait"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-white/20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Record Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-white font-bold text-sm truncate">{record.userId}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${STATUS_COLORS[record.status]?.bg || 'bg-white/10'} ${STATUS_COLORS[record.status]?.text || 'text-white/50'}`}>
                                                {record.status.replace('_', ' ')}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-white/40 uppercase">
                                                {record.accountType}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] text-white/30">
                                            <span>Registered: {formatDate(record.registeredAt)}</span>
                                            {record.portrait?.metadata && (
                                                <span>
                                                    {record.portrait.metadata.width}×{record.portrait.metadata.height} •{' '}
                                                    {(record.portrait.metadata.fileSizeBytes / 1024).toFixed(0)}KB
                                                </span>
                                            )}
                                            {record.orgVerification?.businessName && (
                                                <span className="text-blue-400/60">{record.orgVerification.businessName}</span>
                                            )}
                                        </div>

                                        {/* Document links */}
                                        <div className="flex items-center gap-3 mt-2">
                                            {record.portrait?.imageUrl && (
                                                <a
                                                    href={record.portrait.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[9px] text-osia-teal-500/80 hover:text-osia-teal-500 transition-colors"
                                                >
                                                    <ImageIcon className="w-3 h-3" /> Portrait
                                                </a>
                                            )}
                                            {record.idDocument?.documentUrl && (
                                                <a
                                                    href={record.idDocument.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[9px] text-osia-teal-500/80 hover:text-osia-teal-500 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3" /> ID Document
                                                </a>
                                            )}
                                            {record.orgVerification?.businessRegDocUrl && (
                                                <a
                                                    href={record.orgVerification.businessRegDocUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[9px] text-osia-teal-500/80 hover:text-osia-teal-500 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3" /> Business Doc
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setExpandedRecord(expandedRecord === record.userId ? null : record.userId)}
                                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                            title="Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="text-[10px]"
                                            onClick={() => handleReview(record.userId, 'approve')}
                                            disabled={actionLoading === record.userId}
                                        >
                                            {actionLoading === record.userId ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <><UserCheck className="w-3 h-3 mr-1" /> Approve</>
                                            )}
                                        </Button>
                                        <button
                                            onClick={() => setExpandedRecord(record.userId)}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"
                                        >
                                            <UserX className="w-3 h-3 inline mr-1" /> Reject
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details + Reject Reason */}
                                <AnimatePresence>
                                    {expandedRecord === record.userId && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-3">
                                                {/* Verification History */}
                                                {record.verificationHistory?.length > 0 && (
                                                    <div>
                                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">History</p>
                                                        <div className="space-y-1">
                                                            {record.verificationHistory.map((event, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-[10px] text-white/30">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                    <span>{event.event}</span>
                                                                    <span className="text-white/15">{formatDate(event.timestamp)}</span>
                                                                    {event.details && <span className="text-white/20">— {event.details}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Reject with reason */}
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        value={rejectReason}
                                                        onChange={e => setRejectReason(e.target.value)}
                                                        placeholder="Rejection reason (optional)..."
                                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/50"
                                                    />
                                                    <button
                                                        onClick={() => handleReview(record.userId, 'reject')}
                                                        disabled={actionLoading === record.userId}
                                                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === record.userId ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            'Confirm Reject'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* All Records View */}
            {view === 'all' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by user ID..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-osia-teal-500/50"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none focus:outline-none focus:border-osia-teal-500/50 cursor-pointer"
                            >
                                <option value="all" className="bg-gray-900">All Statuses</option>
                                <option value="pending" className="bg-gray-900">Pending</option>
                                <option value="submitted" className="bg-gray-900">Submitted</option>
                                <option value="under_review" className="bg-gray-900">Under Review</option>
                                <option value="verified" className="bg-gray-900">Verified</option>
                                <option value="rejected" className="bg-gray-900">Rejected</option>
                                <option value="locked" className="bg-gray-900">Locked</option>
                                <option value="locked_final" className="bg-gray-900">Permanently Locked</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Records Table */}
                    <Card className="border-white/5 bg-white/[0.02] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">User ID</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Type</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Registered</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Deadline</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">Verified</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-white/20">
                                                No records match the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(record => (
                                            <tr
                                                key={record.userId}
                                                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="text-white/70 font-mono text-xs">{record.userId.slice(0, 12)}...</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[9px] font-bold text-white/40 uppercase">{record.accountType}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${STATUS_COLORS[record.status]?.bg || 'bg-white/10'} ${STATUS_COLORS[record.status]?.text || 'text-white/50'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[record.status]?.dot || 'bg-white/30'}`} />
                                                        {record.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-white/30 text-xs">{formatDate(record.registeredAt)}</td>
                                                <td className="px-4 py-3 text-white/30 text-xs">
                                                    {record.extendedDeadline
                                                        ? formatDate(record.extendedDeadline)
                                                        : formatDate(record.kycDeadline)}
                                                </td>
                                                <td className="px-4 py-3 text-white/30 text-xs">
                                                    {record.verifiedAt ? formatDate(record.verifiedAt) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={previewImage}
                            alt="KYC Preview"
                            className="max-w-[80vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
