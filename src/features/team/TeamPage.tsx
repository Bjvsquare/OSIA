import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamSetup } from './components/TeamSetup';
import { TeamCheckIn } from './components/TeamCheckIn';
import { TeamDashboard } from './components/TeamDashboard';
import { TeamChat } from './components/TeamChat';
import { Button } from '../../components/ui/Button';
import { CheckSquare, BarChart3, MessageSquare, Settings, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';

export function TeamPage() {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    // If we are in creation mode
    const isCreating = teamId === 'create';

    const [activeTab, setActiveTab] = useState<'dashboard' | 'checkin' | 'comms' | 'settings'>('dashboard');
    const [teamData, setTeamData] = useState<any>(null); // Full dashboard data
    const [loading, setLoading] = useState(!isCreating);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isCreating && teamId) {
            loadTeamData();
        }
    }, [teamId, isCreating]);

    const loadTeamData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getTeamData(teamId!);
            setTeamData(data);
        } catch (err: any) {
            console.error('Failed to load team', err);
            setError(err.message || 'Failed to sync team channel.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupComplete = async (data: any) => {
        try {
            const newTeam = await api.createTeam(data);
            navigate(`/teams/${newTeam.id}`);
        } catch (error) {
            console.error('Failed to create team', error);
        }
    };

    const handleDeleteTeam = async () => {
        if (!confirm('Are you sure you want to dissolve this team network? This action cannot be undone.')) return;
        try {
            await api.deleteTeam(teamId!);
            navigate('/teams');
        } catch (e) {
            console.error('Failed to delete team', e);
            alert('Failed to delete team. Please ensure you are the creator.');
        }
    };

    const handleCheckInComplete = (data: any) => {
        console.log('Check-in synced', data);
        setActiveTab('dashboard');
    };

    if (isCreating) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Initialize Team Protocol</h1>
                    <p className="text-osia-neutral-400 mt-1">Define the parameters of your collective intelligence unit.</p>
                </div>
                <TeamSetup onComplete={handleSetupComplete} />
            </div>
        );
    }

    if (loading) return <div className="p-12 text-center animate-pulse text-osia-teal-500">Establishing Secure Link...</div>;

    if (error || !teamData) {
        return (
            <div className="p-12 text-center space-y-4">
                <div className="text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4 max-w-md mx-auto">
                    {error || 'Team signal lost.'}
                </div>
                <Button onClick={() => navigate('/teams')} variant="outline">Return to Hub</Button>
            </div>
        );
    }

    const team = teamData.team;
    // Determine user role for this team (Leader, Admin, Member)
    // Currently TeamService logic sets creator as Leader.
    const memberRecord = team.members.find((m: any) => m.userId === userProfile?.id);
    const userRole = memberRecord?.role;
    const isCreator = team.creatorId === userProfile?.id;
    const canManage = userRole === 'Leader' || userRole === 'Admin' || isCreator;

    return (
        <div data-tour="team-overview" className="min-h-full flex flex-col pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        {team.name}
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-osia-neutral-400 uppercase tracking-widest font-bold">
                            {team.type}
                        </span>
                    </h1>
                    <p className="text-osia-neutral-400 mt-1 text-sm">{team.purpose}</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
                    {[
                        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                        { id: 'checkin', icon: CheckSquare, label: 'Check-in' },
                        { id: 'comms', icon: MessageSquare, label: 'Comms' },
                        ...(canManage ? [{ id: 'settings', icon: Settings, label: 'Settings' }] : [])
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'dashboard' && <TeamDashboard teamId={teamId!} />}
                    {activeTab === 'checkin' && <TeamCheckIn onComplete={handleCheckInComplete} />}
                    {activeTab === 'comms' && (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <TeamChat teamId={teamId!} currentUserRole={userRole} />
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 h-fit">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Active Members</h3>
                                <div className="space-y-3">
                                    {team.members.map((m: any) => (
                                        <div key={m.userId} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {m.avatarUrl ? (
                                                    <img
                                                        src={m.avatarUrl}
                                                        alt={m.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.role === 'Leader' ? 'bg-osia-teal-500 text-white' : 'bg-white/10 text-osia-neutral-400'
                                                        }`}>
                                                        {m.name?.charAt(0) || m.username?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm text-white font-medium">{m.name || m.username?.split('@')[0]}</div>
                                                    <div className="text-[10px] text-osia-neutral-500 uppercase">{m.role}</div>
                                                </div>
                                            </div>
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'settings' && canManage && (
                        <div className="max-w-2xl mx-auto space-y-8 bg-[#0a1128]/40 p-8 rounded-3xl border border-white/5">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white">Team Administration</h3>
                                <p className="text-osia-neutral-400 text-sm">Manage team configuration and lifecycle.</p>
                            </div>

                            <hr className="border-white/5" />

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest">Danger Zone</h4>
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold text-sm">Dissolve Team</div>
                                        <div className="text-red-300/60 text-xs mt-1">Permanently delete this team and all aggregated history.</div>
                                    </div>
                                    <Button onClick={handleDeleteTeam} variant="outline" className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/20">
                                        <Trash2 size={16} className="mr-2" />
                                        Confirm Dissolution
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
