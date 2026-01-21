import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
    Shield, Eye, BarChart3, TrendingUp, Users, Building2,
    AlertTriangle, CheckCircle, ArrowLeft, RefreshCw
} from 'lucide-react';

interface Membership {
    id: string;
    orgId: string;
    role: string;
    status: string;
    dataConsent: {
        shareBlueprint: boolean;
        shareProtocolStats: boolean;
        shareGrowthTrends: boolean;
        recruitmentVisible: boolean;
        lastUpdated: string;
    };
    organization?: {
        id: string;
        name: string;
        type: string;
    };
}

export function ConsentManagementScreen() {
    const navigate = useNavigate();
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadMemberships();
    }, []);

    const loadMemberships = async () => {
        setIsLoading(true);
        try {
            const res = await api.getMyMemberships();

            if (res.ok) {
                const data = await res.json();
                setMemberships(data);
            }
        } catch (err) {
            console.error('Failed to load memberships', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConsent = async (membership: Membership, updates: Partial<Membership['dataConsent']>) => {
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const res = await api.updateMemberConsent(membership.orgId, membership.id, updates);

            if (res.ok) {
                const updated = await res.json();
                setMemberships(prev =>
                    prev.map(m => m.id === membership.id ? { ...m, dataConsent: updated.dataConsent } : m)
                );
                setSaveStatus('success');
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const revokeAllConsent = async (membership: Membership) => {
        await updateConsent(membership, {
            shareBlueprint: false,
            shareProtocolStats: false,
            shareGrowthTrends: false,
            recruitmentVisible: false
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-osia-teal-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" onClick={() => navigate(-1)} className="p-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-osia-teal-400" />
                        Data Sharing & Consent
                    </h1>
                    <p className="text-osia-neutral-400">
                        Control what data your organizations can access
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <Card className="p-4 bg-osia-teal-500/10 border-osia-teal-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-osia-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-osia-teal-300 font-medium">Your data, your control</p>
                    <p className="text-sm text-osia-teal-400/70">
                        You can revoke data sharing at any time. Organizations will only see data you've
                        explicitly consented to share. Changes take effect immediately.
                    </p>
                </div>
            </Card>

            {/* Save Status */}
            {saveStatus !== 'idle' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl flex items-center gap-2 ${saveStatus === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}
                >
                    {saveStatus === 'success' ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Settings saved successfully</span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            <span>Failed to save changes</span>
                        </>
                    )}
                </motion.div>
            )}

            {/* Memberships */}
            {memberships.length === 0 ? (
                <Card className="p-12 text-center border-white/5">
                    <Building2 className="w-12 h-12 text-osia-neutral-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No Organization Memberships</h2>
                    <p className="text-osia-neutral-400 mb-6">
                        You haven't joined any organizations yet.
                    </p>
                    <Button onClick={() => navigate('/signup/join-organization')} className="bg-osia-teal-600">
                        <Users className="w-4 h-4 mr-2" /> Join an Organization
                    </Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    {memberships.map(membership => (
                        <MembershipConsentCard
                            key={membership.id}
                            membership={membership}
                            onUpdate={(updates) => updateConsent(membership, updates)}
                            onRevokeAll={() => revokeAllConsent(membership)}
                            isSaving={isSaving}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function MembershipConsentCard({
    membership,
    onUpdate,
    onRevokeAll,
    isSaving
}: {
    membership: Membership;
    onUpdate: (updates: Partial<Membership['dataConsent']>) => void;
    onRevokeAll: () => void;
    isSaving: boolean;
}) {
    const consent = membership.dataConsent;
    const anyConsentEnabled = consent.shareBlueprint || consent.shareProtocolStats ||
        consent.shareGrowthTrends || consent.recruitmentVisible;

    const toggles = [
        {
            key: 'shareBlueprint',
            icon: Eye,
            label: 'Share Blueprint',
            description: 'Allow organization to view your trait profile and scores',
            enabled: consent.shareBlueprint
        },
        {
            key: 'shareProtocolStats',
            icon: BarChart3,
            label: 'Share Protocol Statistics',
            description: 'Allow viewing your protocol completion rates and activity',
            enabled: consent.shareProtocolStats
        },
        {
            key: 'shareGrowthTrends',
            icon: TrendingUp,
            label: 'Share Growth Trends',
            description: 'Allow viewing how your traits have changed over time',
            enabled: consent.shareGrowthTrends
        },
        {
            key: 'recruitmentVisible',
            icon: Users,
            label: 'Recruitment Visibility',
            description: 'Appear in organization recruitment searches and matching',
            enabled: consent.recruitmentVisible
        }
    ];

    return (
        <Card className="border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                {membership.organization?.name || 'Organization'}
                            </h3>
                            <p className="text-sm text-osia-neutral-500">
                                {membership.role} • {membership.status}
                            </p>
                        </div>
                    </div>

                    {anyConsentEnabled && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRevokeAll}
                            disabled={isSaving}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Revoke All
                        </Button>
                    )}
                </div>
            </div>

            {/* Toggles */}
            <div className="p-6 space-y-4">
                {toggles.map(toggle => (
                    <button
                        key={toggle.key}
                        onClick={() => onUpdate({ [toggle.key]: !toggle.enabled })}
                        disabled={isSaving}
                        className={`w-full p-4 rounded-xl border text-left transition-colors flex items-center gap-4 ${toggle.enabled
                            ? 'bg-osia-teal-500/10 border-osia-teal-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${toggle.enabled ? 'bg-osia-teal-500/20' : 'bg-white/10'
                            }`}>
                            <toggle.icon className={`w-6 h-6 ${toggle.enabled ? 'text-osia-teal-400' : 'text-osia-neutral-500'
                                }`} />
                        </div>
                        <div className="flex-1">
                            <p className={`font-medium ${toggle.enabled ? 'text-white' : 'text-osia-neutral-300'}`}>
                                {toggle.label}
                            </p>
                            <p className="text-sm text-osia-neutral-500">{toggle.description}</p>
                        </div>
                        <div className={`w-12 h-7 rounded-full transition-colors flex items-center ${toggle.enabled ? 'bg-osia-teal-500 justify-end' : 'bg-white/20 justify-start'
                            }`}>
                            <div className="w-5 h-5 mx-1 rounded-full bg-white shadow-sm" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
                <p className="text-xs text-osia-neutral-600">
                    Last updated: {new Date(consent.lastUpdated || consent.consentedAt).toLocaleDateString()}
                </p>
            </div>
        </Card>
    );
}
