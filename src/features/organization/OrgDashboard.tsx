import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShieldCheck,
    Building2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { OrgCulturePage } from '../organizations/OrgCulturePage';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { OrgHub } from './components/OrgHub';
import { UserPlus, Globe, Info } from 'lucide-react';

type TabType = 'culture' | 'admin';

export function OrgDashboard() {
    const { orgId } = useParams<{ orgId: string }>();
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('culture');
    const [orgName, setOrgName] = useState<string>('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publicOrg, setPublicOrg] = useState<any | null>(null);

    const isAdmin = userRole === 'owner' || userRole === 'admin' || auth.isAdmin;

    useEffect(() => {
        fetchOrgContext();
    }, [orgId]);

    const fetchOrgContext = async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.getOrganization(orgId);

            if (!res.ok) {
                if (res.status === 403) {
                    // Try to fetch public information for the "Join" screen
                    const publicRes = await api.getOrganizationPublic(orgId);
                    if (publicRes.ok) {
                        setPublicOrg(await publicRes.json());
                        throw new Error('403_JOIN');
                    }
                    throw new Error('Access denied: You are not a member of this organization.');
                }
                throw new Error('Failed to load organization details.');
            }

            const data = await res.ok ? await res.json() : null;
            if (data) {
                setOrgName(data.name);
                // The API doesn't return member role directly in the org object usually, 
                // but let's check the memberships endpoint if needed.
                // For now, let's try to get it from a specific endpoint or assume if they can access it they might have a role.
                fetchUserRole();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRole = async () => {
        try {
            const res = await api.getMyMemberships();
            if (res.ok) {
                const memberships = await res.json();
                const current = memberships.find((m: any) => m.orgId === orgId);
                if (current) {
                    setUserRole(current.role);
                }
            }
        } catch (e) {
            console.error('Failed to fetch user role', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-osia-deep-950 text-white">
                <RefreshCw className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                <p className="text-osia-neutral-400">Attuning to organization...</p>
            </div>
        );
    }

    if (error) {
        if (error === '403_JOIN' && publicOrg) {
            return (
                <div className="min-h-screen bg-osia-deep-950 flex items-center justify-center p-6">
                    <Card className="max-w-xl w-full border-white/5 bg-white/[0.02] overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center border-b border-white/5">
                            <Building2 className="w-12 h-12 text-purple-400" />
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-white tracking-tight">{publicOrg.name}</h2>
                                <p className="text-osia-neutral-400 text-sm max-w-md mx-auto">
                                    {publicOrg.industry} • {publicOrg.size} employees
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 text-left border border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-osia-neutral-500 mb-2 flex items-center gap-2">
                                    <Info className="w-3 h-3" />
                                    About this Organization
                                </h3>
                                <p className="text-sm text-osia-neutral-300 leading-relaxed">
                                    {publicOrg.description || "No description provided for this organization."}
                                </p>
                            </div>

                            <div className="pt-4 space-y-4">
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="text-xs text-osia-neutral-300">
                                        Join this organization to access its culture analysis, recruitment features, and administrative tools.
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => navigate('/organizations')}>
                                        Browse Others
                                    </Button>
                                    <Button
                                        className="flex-1 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20"
                                        onClick={() => navigate(`/signup/organization/join/${orgId}`)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Request Access
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-osia-deep-950 p-6">
                <Card className="max-w-md w-full p-8 text-center border-red-500/20 bg-red-500/5">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Access Issue</h2>
                    <p className="text-osia-neutral-300 mb-6">{error}</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/home')}>
                            Back Home
                        </Button>
                        <Button className="flex-1 bg-purple-600" onClick={fetchOrgContext}>
                            Retry
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!orgId) {
        return <OrgHub />;
    }

    return (
        <div className="min-h-screen bg-osia-deep-950">
            {/* Unified Header */}
            <div className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight">{orgName || 'Organization Dashboard'}</h1>
                                <div className="flex items-center gap-2 text-xs text-osia-neutral-400">
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                        {userRole?.toUpperCase() || 'MEMBER'}
                                    </span>
                                    {auth.isAdmin && (
                                        <span className="px-2 py-0.5 rounded-full bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/20">
                                            SYSTEM ADMIN
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex bg-osia-deep-900 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('culture')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'culture'
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Culture Analysis
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('admin')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin'
                                        ? 'bg-osia-teal-600 text-white shadow-lg shadow-teal-500/20'
                                        : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Admin Panel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {activeTab === 'culture' && <OrgCulturePage hideHeader={true} />}
                        {activeTab === 'admin' && <OrgAdminDashboard hideHeader={true} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
