import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    BarChart3,
    AlertCircle,
    Settings as SettingsIcon,
    Shield,
    RefreshCw,
    Activity,
    Server,
    Globe,
    Zap,
    ArrowUpRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserManagement } from './components/UserManagement';
import { Analytics } from './components/Analytics';
import { ErrorLog } from './components/ErrorLog';
import { Interactions } from './components/Interactions';
import { FoundingCircle } from './components/FoundingCircle';
import { FeedbackManagement } from './components/FeedbackManagement';
import { PlatformPlanning } from './components/PlatformPlanning';
import { KYCReviewPanel } from './components/KYCReviewPanel';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'errors' | 'interactions' | 'system' | 'founding' | 'feedback' | 'planning' | 'kyc'>('analytics');
    const [analytics, setAnalytics] = useState<any>(null);
    const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
    const [pendingKYCCount, setPendingKYCCount] = useState(0);
    const { showToast, ToastComponent } = useToast();

    const fetchAnalytics = async () => {
        try {
            const data = await api.getAdminAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const fetchUnreadFeedback = async () => {
        try {
            const data = await api.getUnreadFeedbackCount();
            setUnreadFeedbackCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch unread feedback:', error);
        }
    };

    const fetchPendingKYC = async () => {
        try {
            const data = await api.getKYCAdminQueue();
            setPendingKYCCount(data.pending?.length || 0);
        } catch (error) {
            console.error('Failed to fetch pending KYC:', error);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchUnreadFeedback();
        fetchPendingKYC();
        const interval = setInterval(() => {
            fetchAnalytics();
            fetchUnreadFeedback();
            fetchPendingKYC();
        }, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'kyc', label: 'KYC', icon: Shield },
        { id: 'founding', label: 'Founding Circle', icon: Shield },
        { id: 'feedback', label: 'Feedback', icon: AlertCircle },
        { id: 'planning', label: 'Planning', icon: Activity },
        { id: 'interactions', label: 'Interactions', icon: Activity },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'errors', label: 'Errors', icon: AlertCircle },
        { id: 'system', label: 'System', icon: SettingsIcon },
    ];

    const stats = [
        { label: 'Verified Identities', value: analytics?.totalUsers?.toLocaleString() || '---', grow: analytics ? 'Live' : 'Fetching...', icon: Globe, color: 'text-osia-teal-500' },
        { label: 'Active Sessions', value: analytics?.activeUsers?.toLocaleString() || '---', grow: 'Recent', icon: Zap, color: 'text-osia-purple-500' },
        { label: 'System Health', value: '100%', grow: 'Stable', icon: Server, color: 'text-green-500' },
        { label: 'Sync Completion', value: `${Math.round(analytics?.completionRate || 0)}%`, grow: 'High', icon: Activity, color: 'text-blue-500' }
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header section with Stats */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-osia-teal-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-osia-teal-500/80">Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">OSIA Admin <span className="text-osia-teal-500">.</span></h1>
                    </div>

                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-osia-teal-500 text-white shadow-[0_0_25px_rgba(56,163,165,0.4)] scale-105'
                                    : 'text-osia-neutral-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                                {tab.id === 'feedback' && unreadFeedbackCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-[8px] font-black bg-red-500 text-white rounded-full min-w-[18px] text-center animate-pulse">
                                        {unreadFeedbackCount > 9 ? '9+' : unreadFeedbackCount}
                                    </span>
                                )}
                                {tab.id === 'kyc' && pendingKYCCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-[8px] font-black bg-amber-500 text-white rounded-full min-w-[18px] text-center animate-pulse">
                                        {pendingKYCCount > 9 ? '9+' : pendingKYCCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="p-5 border-white/5 bg-white/[0.02] flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-osia-neutral-500 uppercase tracking-widest">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-xl font-bold text-white">{stat.value}</h4>
                                    <span className={`text-[8px] font-black ${stat.grow === 'Stable' || stat.grow === 'High' || stat.grow === 'Live' ? 'text-green-500' : 'text-osia-neutral-600'}`}>{stat.grow}</span>
                                </div>
                            </div>
                            <stat.icon className={`w-8 h-8 ${stat.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        </Card>
                    ))}
                </div>
            </div>

            <main className="min-h-[500px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {activeTab === 'analytics' && <Analytics data={analytics} />}
                        {activeTab === 'kyc' && <KYCReviewPanel />}
                        {activeTab === 'founding' && <FoundingCircle />}
                        {activeTab === 'feedback' && <FeedbackManagement />}
                        {activeTab === 'planning' && <PlatformPlanning />}
                        {activeTab === 'interactions' && <Interactions />}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'errors' && <ErrorLog />}
                        {activeTab === 'system' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-10 border-white/5 bg-white/[0.02] space-y-8 backdrop-blur-xl">
                                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                        <Server className="text-osia-teal-500" />
                                        Core Cognitive Services
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Identity Oracle', status: 'Not Connected', load: '—' },
                                            { name: 'Emergent Pattern Engine', status: 'Not Connected', load: '—' },
                                            { name: 'Relational Context Router', status: 'Not Connected', load: '—' },
                                            { name: 'Evidence Persistence Vault', status: 'JSON File Store', load: '—' }
                                        ].map(s => (
                                            <div key={s.name} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-colors">
                                                <div className="space-y-1">
                                                    <span className="text-white font-bold text-sm">{s.name}</span>
                                                    <p className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">Load: {s.load}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-tighter">{s.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="p-10 border-white/5 bg-white/[0.02] flex flex-col justify-center items-center text-center space-y-6 backdrop-blur-xl">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group hover:rotate-12 transition-transform">
                                            <RefreshCw size={32} className="text-osia-neutral-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-white tracking-tight">System Integrity</h3>
                                            <p className="text-sm text-osia-neutral-500 max-w-xs mx-auto">Ping the API server and validate core service reachability.</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full py-6 text-[11px] font-black uppercase tracking-widest shadow-2xl"
                                            onClick={async () => {
                                                showToast('Running diagnostics...');
                                                try {
                                                    const data = await api.getAdminAnalytics();
                                                    if (data) {
                                                        showToast('✓ API server reachable. JSON data store active.');
                                                    }
                                                } catch {
                                                    showToast('✗ Could not reach API server');
                                                }
                                            }}
                                        >
                                            Run Full Diagnostics
                                        </Button>
                                    </Card>

                                    <Card className="p-8 border-white/10 bg-osia-teal-500/5 flex items-center justify-between group cursor-pointer hover:bg-osia-teal-500/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Globe className="text-osia-teal-500" />
                                            <div>
                                                <p className="text-white font-bold text-sm">Deployment Portal</p>
                                                <p className="text-[10px] text-osia-neutral-500 uppercase font-black">View staging & production</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="text-osia-neutral-600 group-hover:text-white transition-colors" />
                                    </Card>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
            <ToastComponent />
        </div >
    );
}
