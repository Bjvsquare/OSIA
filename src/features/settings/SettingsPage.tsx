import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, ShieldCheck, Lock, Smartphone, RefreshCw, Camera, Check, X, CreditCard, Play, Building2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../services/api';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import { SubscriptionManagement } from '../subscription/SubscriptionManagement';
import { useTour } from '../tour/TourContext';

type TwoFactorState = 'idle' | 'setup' | 'verifying' | 'enabled';

export function SettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { auth, userProfile, refreshProfile } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const { startTour, tourCompleted } = useTour();
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'data' | 'commercial'>('profile');
    interface OrgMembership {
        id: string;
        orgId: string;
        orgName?: string;
        organization?: { name: string; slug: string; logo?: string; role: string };
        role: string;
        status: string;
        department?: string;
    }

    const [orgMemberships, setOrgMemberships] = useState<OrgMembership[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['profile', 'notifications', 'security', 'data', 'commercial'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [location.search]);

    useEffect(() => {
        if (userProfile?.twoFactorEnabled) {
            setTwoFactorState('enabled');
        } else if (twoFactorState === 'enabled') {
            // If it was enabled but now the profile says it's not, reset to idle
            setTwoFactorState('idle');
        }
    }, [userProfile?.twoFactorEnabled]);
    useEffect(() => {
        if (activeTab === 'profile') {
            fetchMemberships();
        }
    }, [activeTab]);

    const fetchMemberships = async () => {
        try {
            const token = auth.token;
            if (!token) return;

            const response = await api.getMyMemberships();

            if (response.ok) {
                const data = await response.json();
                setOrgMemberships(data);
            }
        } catch (error) {
            console.error('Failed to fetch memberships', error);
        }
    };

    // 2FA State
    const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>('idle');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');

    const handle2FASetup = async () => {
        setIsLoading(true);
        try {
            const data = await api.setup2FA();
            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret);
            setTwoFactorState('setup');
            showToast('Scan the QR code with your authenticator app', 'success');
        } catch (error) {
            showToast('Failed to setup 2FA. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (verificationCode.length !== 6) {
            showToast('Please enter a 6-digit code', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.verify2FA(secret, verificationCode);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Invalid code');
            }

            setTwoFactorState('enabled');
            showToast('2FA enabled successfully!', 'success');
            setVerificationCode('');
        } catch (error: any) {
            showToast(error.message || 'Verification failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setIsLoading(true);
        try {
            const response = await api.disable2FA();

            if (!response.ok) throw new Error('Failed to disable 2FA');

            setTwoFactorState('idle');
            setQrCodeUrl('');
            setSecret('');
            showToast('2FA disabled successfully', 'info');
        } catch (error) {
            showToast('Failed to disable 2FA', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const cancelSetup = () => {
        setTwoFactorState('idle');
        setQrCodeUrl('');
        setSecret('');
        setVerificationCode('');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            showToast('Image size must be less than 15MB', 'error');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await api.uploadAvatar(formData);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload avatar');
            }

            await response.json();
            showToast('Identity signature updated successfully', 'success');
            await refreshProfile();
        } catch (error: any) {
            showToast(error.message || 'Failed to upload avatar', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            showToast('Name cannot be empty', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.updateProfile({ name: editName });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update profile');
            }

            showToast('Identity updated successfully', 'success');
            await refreshProfile();
            setIsEditingProfile(false);
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRequest = async () => {
        if (!confirm('Are you sure you want to request account deletion? This will notify the administrators to purge your identity and all associated data. This action cannot be undone once executed.')) return;

        setIsLoading(true);
        try {
            const response = await api.requestDeletion();

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit request');
            }

            showToast('Deletion request submitted to administrators.', 'info');
            await refreshProfile();
        } catch (error: any) {
            showToast(error.message || 'Failed to submit request', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <div className="grid md:grid-cols-[240px_1fr] gap-16">
                    {/* Navigation */}
                    <aside className="space-y-2">
                        {[
                            { id: 'profile', label: 'Identity & Profile', icon: User },
                            { id: 'notifications', label: 'Insights & Nudges', icon: Bell },
                            { id: 'security', label: 'Security (2FA)', icon: Lock },
                            { id: 'commercial', label: 'Commercial Status', icon: CreditCard },
                            { id: 'data', label: 'Data Sovereignty', icon: ShieldCheck }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-osia-teal-500/10 text-osia-teal-400 border border-osia-teal-500/20'
                                    : 'text-osia-neutral-500 hover:text-osia-neutral-300'}`}
                            >
                                <tab.icon size={16} />
                                <span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Content */}
                    <div className="space-y-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-8">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-osia-teal-500/20 to-osia-purple-500/20 border border-white/10 flex items-center justify-center text-osia-neutral-500 overflow-hidden shadow-2xl">
                                                    {userProfile?.avatarUrl ? (
                                                        <img
                                                            src={`${resolveAvatarUrl(userProfile.avatarUrl)}?t=${userProfile.refreshKey || 0}`}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-2xl font-black text-osia-teal-400">
                                                            {userProfile?.name?.[0] || userProfile?.username?.[0] || 'E'}
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-2 -right-2 p-2 bg-[#0a1128] border border-white/10 rounded-full text-osia-neutral-400 hover:text-white transition-all hover:scale-110 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <Camera size={14} />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleAvatarUpload}
                                                        disabled={isLoading}
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                                    {userProfile?.name || 'Explorer'}
                                                </h2>
                                                <p className="text-sm text-osia-neutral-500 uppercase tracking-widest font-black mt-1">
                                                    Status: {userProfile?.twoFactorEnabled ? 'Fortified' : 'Stable Calibration'}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6 backdrop-blur-xl">
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-600">Cognitive Display Name</div>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-osia-teal-500/50"
                                                    placeholder="Enter display name"
                                                    autoFocus
                                                />
                                            ) : (
                                                <p className="text-white font-medium">{userProfile?.name || 'Unset'}</p>
                                            )}
                                            <div className="h-px bg-white/5" />
                                            <div className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-600">Verifiable Email</div>
                                            <p className="text-white font-medium">{userProfile?.username}</p>
                                        </div>

                                        {isEditingProfile ? (
                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    variant="secondary"
                                                    className="flex-1 text-[10px]"
                                                    onClick={() => setIsEditingProfile(false)}
                                                    disabled={isLoading}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="flex-1 text-[10px]"
                                                    onClick={handleSaveProfile}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                className="text-[10px]"
                                                onClick={() => {
                                                    setEditName(userProfile?.name || '');
                                                    setIsEditingProfile(true);
                                                }}
                                            >
                                                Edit Profile
                                            </Button>
                                        )}
                                    </Card>
                                    <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6 backdrop-blur-xl">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Professional Affiliations</h3>
                                                <p className="text-[10px] text-osia-neutral-500 font-black uppercase tracking-widest">Organisational Memberships</p>
                                            </div>
                                        </div>

                                        {orgMemberships.length > 0 ? (
                                            <div className="space-y-4">
                                                {orgMemberships.map((membership) => (
                                                    <div key={membership.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-osia-deep-900 border border-white/10 flex items-center justify-center text-lg font-bold">
                                                                {membership.organization?.logo ? (
                                                                    <img src={membership.organization.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                ) : (
                                                                    (membership.organization?.name?.[0] || 'O').toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-white text-sm">{membership.organization?.name}</h4>
                                                                <div className="flex items-center gap-2 text-xs text-osia-neutral-400">
                                                                    <span className="capitalize text-purple-400 font-medium">{membership.role}</span>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{membership.department || 'General'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.origin}/org/${membership.organization?.slug}`);
                                                                showToast('Profile link copied', 'success');
                                                            }}
                                                        >
                                                            Share
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-6 border border-dashed border-white/10 rounded-xl">
                                                <p className="text-sm text-osia-neutral-500 mb-4">You are not a member of any organization.</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate('/signup/organization')}
                                                >
                                                    Find or Create Organization
                                                </Button>
                                            </div>
                                        )}
                                    </Card>

                                </motion.div>
                            )}

                            {activeTab === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Access Control</h2>
                                        <p className="text-sm text-osia-neutral-400">Secure your digital twin with industrial-grade authentication.</p>
                                    </div>

                                    <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-8 backdrop-blur-xl">
                                        {/* 2FA Status Display */}
                                        {twoFactorState === 'idle' && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-osia-teal-500">
                                                        <Smartphone size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-white">2-Factor Authentication</div>
                                                        <p className="text-xs text-osia-neutral-500">Use an authenticator app (Authy, Google) for secure login.</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-[10px] uppercase font-bold"
                                                    onClick={handle2FASetup}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Loading...' : 'Configure'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* 2FA Setup Flow */}
                                        {twoFactorState === 'setup' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-400">
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white">Scan QR Code</h3>
                                                        <p className="text-xs text-osia-neutral-500">Use Google Authenticator or Authy</p>
                                                    </div>
                                                </div>

                                                {qrCodeUrl && (
                                                    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl">
                                                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-600 font-mono">{secret}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">Manual entry code</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-osia-neutral-400 uppercase tracking-wider">
                                                        Enter 6-digit code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={verificationCode}
                                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="000000"
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-osia-teal-500/50"
                                                    />
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="secondary"
                                                        className="flex-1"
                                                        onClick={cancelSetup}
                                                        disabled={isLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="flex-1"
                                                        onClick={handleVerify2FA}
                                                        disabled={isLoading || verificationCode.length !== 6}
                                                    >
                                                        {isLoading ? 'Verifying...' : 'Verify & Enable'}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 2FA Enabled State */}
                                        {twoFactorState === 'enabled' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                                                            <Check size={24} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-bold text-white">2FA is Active</div>
                                                            <p className="text-xs text-osia-neutral-500">Your account is protected with 2-factor authentication</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-[10px] uppercase font-bold text-red-400 border-red-500/20 hover:bg-red-500/10"
                                                        onClick={handleDisable2FA}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? 'Disabling...' : 'Disable'}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="h-px bg-white/5" />

                                        <div className="flex items-center justify-between opacity-60 grayscale cursor-not-allowed">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-osia-teal-500">
                                                    <ShieldCheck size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold text-white">Security Keys (WebAuthn)</div>
                                                    <p className="text-xs text-osia-neutral-500">Yubikey and biometrics. Coming later.</p>
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-osia-neutral-600 px-2 py-1 border border-white/5 rounded">Beta</span>
                                        </div>
                                    </Card>

                                    <section className="pt-6">
                                        <Button variant="secondary" className="w-full text-red-400 border-red-500/10 hover:bg-red-500/5 py-4" onClick={() => window.location.href = '/'}>
                                            Sign out of all sessions
                                        </Button>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'data' && (
                                <motion.div
                                    key="data"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Data Sovereignty</h2>
                                        <p className="text-sm text-osia-neutral-400">Manage your digital twin's footprint and identity persistence.</p>
                                    </div>

                                    <div className="grid gap-6">
                                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-4 backdrop-blur-xl">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-400">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">Persistence Guard</h3>
                                                    <p className="text-[10px] text-osia-neutral-500 font-black uppercase tracking-widest">Active State Monitoring</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-osia-neutral-400 leading-relaxed">
                                                Your data is captured periodically and on exit to ensure your digital twin remains in sync with your latest cognitive state.
                                            </p>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-osia-teal-500 uppercase tracking-widest bg-osia-teal-500/5 px-3 py-1.5 rounded-lg border border-osia-teal-500/10 w-fit">
                                                <Check size={10} /> Continuous Persistence Enabled
                                            </div>
                                        </Card>

                                        <Card className="p-8 border-red-500/10 bg-red-500/5 space-y-4 backdrop-blur-xl">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                                    <X size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">Purge Identity</h3>
                                                    <p className="text-[10px] text-red-500/50 font-black uppercase tracking-widest">Permanent Data Removal</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-osia-neutral-400 leading-relaxed">
                                                Requesting deletion will notify our administrators to permanently remove your account, biometric signals, and all 15 layers of your digital twin.
                                            </p>

                                            {userProfile?.status === 'deletion_pending' ? (
                                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                                    <div className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Status: Deletion Pending</div>
                                                    <p className="text-[10px] text-red-300 opacity-60">An administrator is reviewing your request.</p>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    className="text-[10px] text-red-400 border-red-500/20 hover:bg-red-500/10 w-full"
                                                    onClick={handleDeleteRequest}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Processing Request...' : 'Request Account Deletion'}
                                                </Button>
                                            )}
                                        </Card>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'commercial' && (
                                <motion.div
                                    key="commercial"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <SubscriptionManagement />
                                </motion.div>
                            )}

                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="pending"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    {/* Platform Tour Section */}
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Platform Tour</h2>
                                        <p className="text-sm text-osia-neutral-400">Guided walkthrough of all platform features.</p>
                                    </div>

                                    <Card className="p-8 border-white/5 bg-[#0a1128]/40 backdrop-blur-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-osia-teal-500/20 flex items-center justify-center text-osia-teal-400">
                                                    <Play size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold text-white">Guided Platform Tour</div>
                                                    <p className="text-xs text-osia-neutral-500">
                                                        {tourCompleted
                                                            ? 'You\'ve completed the tour. Restart anytime to refresh your knowledge.'
                                                            : 'Take a guided tour through all platform features.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[10px] uppercase font-bold"
                                                onClick={() => {
                                                    localStorage.removeItem('osia_tour_completed');
                                                    startTour();
                                                    navigate('/home');
                                                }}
                                            >
                                                {tourCompleted ? 'Restart Tour' : 'Start Tour'}
                                            </Button>
                                        </div>
                                    </Card>

                                    <Card className="p-20 flex flex-col items-center justify-center text-center space-y-6 backdrop-blur-xl">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-osia-neutral-600 shadow-inner">
                                            <RefreshCw size={32} className="animate-spin duration-[4s]" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
                                            <p className="text-sm text-osia-neutral-500 max-w-sm">We are standardising these preferences based on your Founding Circle profile.</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <ToastComponent />
            </main>
        </div>
    );
}
