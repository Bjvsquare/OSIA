import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import axios from 'axios';

/* ═══════════════════════════════════════════════════════════
   KYCBanner — Persistent notification bar showing KYC status
   
   Renders at the top of the app (below header) showing:
   - Pending: countdown timer + "Complete Now" CTA
   - Submitted: "Under review" status
   - Verified: hidden (or brief success flash)
   - Locked: urgent lock warning + extension/support CTA
   ═══════════════════════════════════════════════════════════ */

interface KYCStatusData {
    status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'locked' | 'locked_final';
    timeRemaining?: { days: number; hours: number; minutes: number };
    isOverdue: boolean;
    unlockUsed: boolean;
    portrait?: { validationStatus: string; rejectionReason?: string };
}

export function KYCBanner() {
    const { auth } = useAuth();
    const [kycData, setKycData] = useState<KYCStatusData | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.token) return;

        const fetchStatus = async () => {
            try {
                const res = await axios.get('/api/kyc/status', {
                    headers: { Authorization: `Bearer ${auth.token}` }
                });
                setKycData(res.data);
            } catch (e) {
                // KYC endpoint may not exist yet for older users
                console.warn('[KYCBanner] Could not fetch KYC status');
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Refresh every 60 seconds to keep countdown accurate
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, [auth.token]);

    // Don't show banner while loading, if dismissed, or if verified
    if (loading || dismissed || !kycData) return null;
    if (kycData.status === 'verified') return null;

    const formatTime = (t?: { days: number; hours: number; minutes: number }) => {
        if (!t) return '';
        if (t.days > 0) return `${t.days}d ${t.hours}h remaining`;
        if (t.hours > 0) return `${t.hours}h ${t.minutes}m remaining`;
        return `${t.minutes}m remaining`;
    };

    // Status-specific banner configuration
    const bannerConfig = (() => {
        switch (kycData.status) {
            case 'pending':
                return {
                    icon: Clock,
                    bg: 'bg-amber-500/10 border-amber-500/20',
                    iconColor: 'text-amber-400',
                    textColor: 'text-amber-200',
                    message: `Complete your identity verification. ${formatTime(kycData.timeRemaining)}`,
                    cta: { text: 'Complete Now', to: '/kyc' },
                    dismissable: true
                };
            case 'submitted':
            case 'under_review':
                return {
                    icon: Shield,
                    bg: 'bg-blue-500/10 border-blue-500/20',
                    iconColor: 'text-blue-400',
                    textColor: 'text-blue-200',
                    message: 'Your verification is being reviewed. We\'ll notify you when complete.',
                    cta: { text: 'View Status', to: '/kyc/status' },
                    dismissable: true
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    bg: 'bg-red-500/10 border-red-500/20',
                    iconColor: 'text-red-400',
                    textColor: 'text-red-200',
                    message: `Verification rejected${kycData.portrait?.rejectionReason ? `: ${kycData.portrait.rejectionReason}` : ''}. Please resubmit.`,
                    cta: { text: 'Resubmit', to: '/kyc' },
                    dismissable: false
                };
            case 'locked':
                return {
                    icon: AlertTriangle,
                    bg: 'bg-red-500/15 border-red-500/30',
                    iconColor: 'text-red-400',
                    textColor: 'text-red-200',
                    message: 'Account locked — KYC verification overdue.',
                    cta: kycData.unlockUsed
                        ? { text: 'Contact Support', to: '/settings?tab=support' }
                        : { text: 'Request Extension', to: '/kyc/status' },
                    dismissable: false
                };
            case 'locked_final':
                return {
                    icon: AlertTriangle,
                    bg: 'bg-red-600/20 border-red-600/40',
                    iconColor: 'text-red-500',
                    textColor: 'text-red-300',
                    message: 'Account permanently locked. Please contact support to resolve.',
                    cta: { text: 'Contact Support', to: '/settings?tab=support' },
                    dismissable: false
                };
            default:
                return null;
        }
    })();

    if (!bannerConfig) return null;

    const Icon = bannerConfig.icon;

    return (
        <div className={`fixed top-20 left-0 right-0 z-40 ${bannerConfig.bg} border-b backdrop-blur-md`}>
            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${bannerConfig.iconColor}`} />
                    <p className={`text-sm ${bannerConfig.textColor} truncate`}>
                        {bannerConfig.message}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                        to={bannerConfig.cta.to}
                        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${kycData.status === 'locked' || kycData.status === 'locked_final' || kycData.status === 'rejected'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {bannerConfig.cta.text}
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                    {bannerConfig.dismissable && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-white/30 hover:text-white/60 transition-colors"
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
