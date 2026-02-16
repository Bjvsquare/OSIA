import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';

/* ═══════════════════════════════════════════════════════════
   KYCStatusPage — Detailed verification status view
   
   Shows:
   - Current status with visual indicator
   - Countdown timer for deadline
   - Verification history timeline
   - Extension request button (if eligible)
   ═══════════════════════════════════════════════════════════ */

interface KYCRecord {
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
    };
    verificationHistory: { event: string; timestamp: string; details?: string }[];
    verifiedAt?: string;
    timeRemaining?: { days: number; hours: number; minutes: number };
    isOverdue: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    pending: { label: 'Pending', color: 'text-amber-400', icon: Clock, bg: 'bg-amber-500/10' },
    submitted: { label: 'Under Review', color: 'text-blue-400', icon: Shield, bg: 'bg-blue-500/10' },
    under_review: { label: 'Under Review', color: 'text-blue-400', icon: Shield, bg: 'bg-blue-500/10' },
    verified: { label: 'Verified', color: 'text-green-400', icon: CheckCircle, bg: 'bg-green-500/10' },
    rejected: { label: 'Rejected', color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10' },
    locked: { label: 'Locked', color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-500/10' },
    locked_final: { label: 'Permanently Locked', color: 'text-red-500', icon: AlertTriangle, bg: 'bg-red-600/10' }
};

export function KYCStatusPage() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [record, setRecord] = useState<KYCRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [extending, setExtending] = useState(false);
    const [extendError, setExtendError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/kyc/status', {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            setRecord(res.data);
        } catch (e) {
            console.error('[KYCStatus] Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, [auth.token]);

    const handleExtend = async () => {
        setExtending(true);
        setExtendError(null);
        try {
            await axios.post('/api/kyc/extend', {}, {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            await fetchStatus();
        } catch (err: any) {
            setExtendError(err.response?.data?.error || 'Failed to request extension');
        } finally {
            setExtending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-osia-teal-400 animate-spin" />
            </div>
        );
    }

    if (!record) {
        return (
            <div className="text-center py-24 text-osia-neutral-400">
                Unable to load verification status.
            </div>
        );
    }

    const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;

    const formatTime = (t?: { days: number; hours: number; minutes: number }) => {
        if (!t) return 'Deadline passed';
        if (t.days > 0) return `${t.days} days, ${t.hours} hours`;
        if (t.hours > 0) return `${t.hours} hours, ${t.minutes} minutes`;
        return `${t.minutes} minutes`;
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-osia-neutral-400 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <h1 className="text-2xl font-bold text-white mb-8">Verification Status</h1>

            {/* Status Card */}
            <div className={`${config.bg} border border-white/10 rounded-2xl p-6 mb-6`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} border border-white/10`}>
                        <StatusIcon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
                        <p className="text-sm text-osia-neutral-400">
                            {record.status === 'verified' && record.verifiedAt
                                ? `Verified on ${new Date(record.verifiedAt).toLocaleDateString()}`
                                : record.status === 'pending'
                                    ? `Time remaining: ${formatTime(record.timeRemaining)}`
                                    : record.status === 'rejected'
                                        ? record.portrait?.rejectionReason || 'Please resubmit your photo'
                                        : record.status === 'locked'
                                            ? 'Deadline has passed'
                                            : ''
                            }
                        </p>
                    </div>
                </div>

                {/* Action buttons based on status */}
                <div className="flex flex-wrap gap-3 mt-4">
                    {(record.status === 'pending' || record.status === 'rejected') && (
                        <button
                            onClick={() => navigate('/kyc')}
                            className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl transition-all shadow-lg shadow-osia-teal-500/20 hover:from-osia-teal-400"
                        >
                            {record.status === 'rejected' ? 'Resubmit Photo' : 'Complete Verification'}
                        </button>
                    )}

                    {(record.status === 'locked') && !record.unlockUsed && (
                        <button
                            onClick={handleExtend}
                            disabled={extending}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all disabled:opacity-50"
                        >
                            {extending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Request 3-Day Extension
                        </button>
                    )}
                </div>

                {extendError && (
                    <p className="text-xs text-red-400 mt-2">{extendError}</p>
                )}
            </div>

            {/* Submitted Portrait */}
            {record.portrait && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-6">
                    <h3 className="text-sm font-semibold text-osia-neutral-300 mb-3">Submitted Portrait</h3>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 max-w-[200px]">
                        <img
                            src={record.portrait.imageUrl}
                            alt="Submitted portrait"
                            className="w-full object-cover"
                        />
                    </div>
                    <p className="text-xs text-osia-neutral-500 mt-2">
                        Uploaded {new Date(record.portrait.uploadedAt).toLocaleString()}
                    </p>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-osia-neutral-300 mb-4">Verification Timeline</h3>
                <div className="space-y-4">
                    {record.verificationHistory.map((event, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-osia-teal-500 mt-1.5" />
                                {i < record.verificationHistory.length - 1 && (
                                    <div className="w-px h-full bg-white/10 mt-1" />
                                )}
                            </div>
                            <div className="pb-4">
                                <p className="text-xs font-medium text-white">
                                    {event.event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>
                                {event.details && (
                                    <p className="text-xs text-osia-neutral-500 mt-0.5">{event.details}</p>
                                )}
                                <p className="text-[10px] text-osia-neutral-600 mt-0.5">
                                    {new Date(event.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
