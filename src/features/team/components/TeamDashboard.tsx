import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Sparkles, ShieldAlert, Users, Zap, Heart, Target, X, Settings, ShieldCheck, Clock, RefreshCw, Activity, LayoutGrid, Brain, Rocket, Shield, GitBranch, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { HelpCircle } from 'lucide-react';
import { TeamSkillRadar } from './TeamSkillRadar';
import { MemberContributionMatrix } from './MemberContributionMatrix';
import { CoachActionPanel } from './CoachActionPanel';
import { FrictionSynergyMap } from './FrictionSynergyMap';
import { TeamHealthRing } from './TeamHealthRing';
import { DimensionCard } from './DimensionCard';
import { RoleDistributionBar } from './RoleDistributionBar';
import { PulseIndicators } from './PulseIndicators';
import { PriorityActionSpotlight } from './PriorityActionSpotlight';

// --- Sub-components ---

function TeamRadarChart({ layers }: { layers: any[] }) {
    if (!layers) return null;

    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const angleStep = (Math.PI * 2) / layers.length;

    const layerNames: Record<number, string> = {
        1: 'Foundation', 2: 'Energy', 3: 'Emotion', 4: 'Logic',
        5: 'Expression', 6: 'Social', 7: 'Safety', 8: 'Purpose'
    };

    // Calculate coordinates for the polygon
    const points = layers.map((l, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * (l.score || 0.5);
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    // Concentric circles for the background
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    return (
        <div className="relative flex justify-center items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background circles */}
                {levels.map((level) => (
                    <circle
                        key={level}
                        cx={center}
                        cy={center}
                        r={radius * level}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {layers.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x2 = center + radius * Math.cos(angle);
                    const y2 = center + radius * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* The Polygon */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    points={points}
                    fill="rgba(20, 184, 166, 0.2)"
                    stroke="rgba(20, 184, 166, 0.8)"
                    strokeWidth="2"
                />

                {/* Labels */}
                {layers.map((l, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + (radius + 25) * Math.cos(angle);
                    const y = center + (radius + 15) * Math.sin(angle);
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            className="text-[10px] fill-osia-neutral-400 font-medium uppercase tracking-tighter"
                        >
                            {layerNames[l.layerId]}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

export function TeamDashboard({ teamId }: { teamId: string }) {
    const { userProfile } = useAuth();
    const [teamData, setTeamData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showManageMembersModal, setShowManageMembersModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeView, setActiveView] = useState<'overview' | 'intelligence'>('overview');
    const { showToast, ToastComponent } = useToast();

    const currentUserId = userProfile?.id;
    const currentUserRole = teamData?.team.members.find((m: any) => m.userId === currentUserId)?.role;
    const isUserAdmin = currentUserRole === 'Leader' || currentUserRole === 'Admin';

    useEffect(() => {
        loadTeamData();
    }, [teamId]);

    const loadTeamData = async (silent = false) => {
        if (!teamId) return;
        if (!isSyncing && !silent) setLoading(true);
        try {
            const data = await api.getTeamData(teamId);
            setTeamData(data);
            if (isSyncing) {
                showToast('Team dynamics recalibrated successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to load team data', error);
            if (isSyncing) {
                showToast('Recalibration failed. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await loadTeamData();
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await api.searchTeamMembers(searchQuery);
                    const mappedResults = results.map(u => ({
                        ...u,
                        isMember: teamData?.team.members.some((m: any) => m.userId === u.userId)
                    }));
                    setSearchResults(mappedResults);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, teamId, teamData?.team.members]);

    const handleAddMember = async (userId: string) => {
        setAddingMemberId(userId);
        try {
            await api.addTeamMember(teamId, userId);
            await loadTeamData();
            setSearchResults(prev => prev.filter(u => u.userId !== userId));
        } catch (error) {
            console.error('Failed to add member', error);
        } finally {
            setAddingMemberId(null);
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        try {
            await api.leaveTeam(teamId);
            window.location.reload();
        } catch (error) {
            console.error('Failed to leave team', error);
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm('CRITICAL: Dissolve this entire team?')) return;
        try {
            await api.deleteTeam(teamId);
            window.location.href = '/teams';
        } catch (error) {
            console.error('Failed to delete team', error);
        }
    };

    const handleUpdateRole = async (targetUserId: string, newRole: string) => {
        try {
            await api.updateTeamMemberRole(teamId, targetUserId, newRole);
            await loadTeamData();
        } catch (error) {
            console.error('Failed to update role', error);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm('Are you sure you want to remove this member from the team?')) return;
        try {
            await api.removeTeamMember(teamId, userId);
            await loadTeamData();
        } catch (error) {
            console.error('Failed to remove member', error);
            alert('Failed to remove member');
        }
    };

    if (loading && !isSyncing) return <div className="p-12 text-center animate-pulse text-osia-teal-500">Recalibrating Team Dynamics...</div>;
    if (!teamData) return <div className="p-12 text-center text-osia-neutral-400">No team data found.</div>;

    if (teamData?.suppressed) {
        return (
            <div className="p-12 relative max-w-2xl mx-auto">
                <Card className="p-10 text-center space-y-8 border-white/5 bg-osia-neutral-900/40 backdrop-blur-xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full" />
                    <div className="flex justify-center relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <ShieldAlert className="w-16 h-16 text-amber-500 opacity-50" />
                        </motion.div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Signals Masked</h2>
                        <p className="text-osia-neutral-400 text-sm leading-relaxed">
                            {teamData.reason}. To preserve individual anonymity, OSIA blurs collective insights until your team hits the required member threshold.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="bg-amber-600 hover:bg-amber-500" onClick={() => setShowInviteModal(true)}>
                            <Users className="w-4 h-4 mr-2" />
                            Add Members
                        </Button>
                        <Button variant="ghost" onClick={() => window.location.href = '/teams'}>Back to Selection</Button>
                    </div>
                </Card>
            </div>
        );
    }

    const metrics = teamData?.metrics || {
        pace: 0, safety: 0, clarity: 0, collectiveIQ: 0, layers: []
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                        Collective <span className="text-osia-teal-500">Intelligence.</span>
                    </h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    {metrics.dataCoverage !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-osia-teal-500/5 border border-osia-teal-500/10 mr-4">
                            <Activity className="w-3.5 h-3.5 text-osia-teal-500" />
                            <span className="text-[10px] font-bold text-osia-neutral-400 uppercase tracking-widest">
                                Data Coverage: <span className="text-white">{metrics.syncedCount}/{metrics.totalCount}</span>
                            </span>
                        </div>
                    )}
                    {isUserAdmin && (
                        <Button variant="ghost" onClick={() => setShowManageMembersModal(true)} className="bg-white/5 border-white/5 hover:bg-white/10 text-osia-teal-400">
                            <Settings className="w-4 h-4 mr-2" />
                            Member Governance
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowInviteModal(true)} className="bg-white/5 border-white/10 hover:bg-white/10 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Invite
                    </Button>
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-osia-teal-500 hover:bg-osia-teal-400 text-black font-bold flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Recalibrating...' : 'Synchronize Data'}
                    </Button>
                </div>
            </div>

            {/* View Toggle Tabs */}
            <div className="flex items-center gap-2 mb-2">
                <button
                    onClick={() => setActiveView('overview')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeView === 'overview'
                        ? 'bg-osia-teal-500 text-black'
                        : 'bg-white/5 text-osia-neutral-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveView('intelligence')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeView === 'intelligence'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-osia-neutral-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Brain className="w-4 h-4" />
                    Team Intelligence
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-bold">NEW</span>
                </button>
            </div>

            {/* Intelligence View */}
            {activeView === 'intelligence' && teamData?.analytics && (
                <div className="space-y-8">
                    {/* Top row: Radar + Health Score */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5">
                            <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5 h-full">
                                <div className="flex items-center gap-2 mb-6">
                                    <Sparkles className="w-4 h-4 text-osia-teal-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-osia-neutral-500">
                                        15-Layer Skill Inventory
                                    </h3>
                                </div>
                                <div className="flex justify-center">
                                    <TeamSkillRadar skillInventory={teamData.analytics.skillInventory} size={380} />
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-7">
                            <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-osia-teal-500" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-osia-neutral-500">
                                            Member Contribution Matrix
                                        </h3>
                                    </div>
                                    <div className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-osia-neutral-400">
                                        {teamData.analytics.memberContributions?.length || 0} Members
                                    </div>
                                </div>
                                <MemberContributionMatrix contributions={teamData.analytics.memberContributions} />
                            </Card>
                        </div>
                    </div>

                    {/* Bottom row: Friction/Synergy + Coach Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5">
                            <FrictionSynergyMap
                                frictionPoints={teamData.analytics.frictionPoints}
                                synergyPoints={teamData.analytics.synergyPoints}
                            />
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5">
                            <CoachActionPanel actions={teamData.analytics.coachActions} />
                        </Card>
                    </div>
                </div>
            )}

            {/* Overview View - Redesigned */}
            {activeView === 'overview' && teamData?.analytics?.overview && (
                <div className="space-y-8">
                    {/* Row 1: Health Index + Pulse Indicators */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Health Index Hero */}
                        <div className="lg:col-span-4">
                            <Card className="p-8 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5 h-full flex items-center justify-center">
                                <TeamHealthRing healthIndex={teamData.analytics.overview.healthIndex} size={220} />
                            </Card>
                        </div>

                        {/* Four Core Dimensions */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DimensionCard
                                    title="Execution Capacity"
                                    score={teamData.analytics.overview.executionCapacity}
                                    icon={<Rocket className="w-5 h-5" />}
                                    description="Energy + Leadership"
                                    index={0}
                                />
                                <DimensionCard
                                    title="Psychological Safety"
                                    score={teamData.analytics.overview.psychologicalSafety}
                                    icon={<Shield className="w-5 h-5" />}
                                    description="Emotional Safety + Trust"
                                    index={1}
                                />
                                <DimensionCard
                                    title="Cognitive Alignment"
                                    score={teamData.analytics.overview.cognitiveAlignment}
                                    icon={<GitBranch className="w-5 h-5" />}
                                    description="Thinking + Decision patterns"
                                    index={2}
                                />
                                <DimensionCard
                                    title="Adaptive Resilience"
                                    score={teamData.analytics.overview.adaptiveResilience}
                                    icon={<Gauge className="w-5 h-5" />}
                                    description="Foundation + Change readiness"
                                    index={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Pulse Indicators */}
                    <PulseIndicators
                        dataCoverage={metrics.dataCoverage || 0}
                        syncedCount={metrics.syncedCount || 0}
                        totalCount={metrics.totalCount || 0}
                        frictionCount={teamData.analytics.overview.frictionCount}
                        synergyCount={teamData.analytics.overview.synergyCount}
                    />

                    {/* Row 3: Role Distribution + Priority Action */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border-white/5">
                            <RoleDistributionBar roles={teamData.analytics.overview.roleDistribution || []} />
                        </Card>

                        <PriorityActionSpotlight
                            action={teamData.analytics.overview.topAction}
                            onViewIntelligence={() => setActiveView('intelligence')}
                        />
                    </div>
                </div>
            )}


            <AnimatePresence>
                {/* Invite Modal */}
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-osia-neutral-950/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="w-full max-w-md bg-osia-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 flex flex-col max-h-[85vh]"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-white">Add Members</h3>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-osia-neutral-500" />
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-osia-neutral-500 focus:outline-none focus:ring-2 focus:ring-osia-teal-500/50"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-osia-teal-500/30 border-t-osia-teal-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <div key={user.userId} className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-400 font-bold border border-osia-teal-500/20">
                                                    {(user.name || user.username)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{user.name || user.username}</div>
                                                    <div className="text-xs text-osia-neutral-400">@{user.username}</div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={user.isMember ? 'ghost' : 'primary'}
                                                onClick={() => !user.isMember && handleAddMember(user.userId)}
                                                disabled={addingMemberId === user.userId || user.isMember}
                                                className="h-8 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {addingMemberId === user.userId ? '...' : user.isMember ? 'Joined' : 'Add'}
                                            </Button>
                                        </div>
                                    ))
                                ) : searchQuery.length >= 2 && !isSearching ? (
                                    <div className="text-center py-8 text-osia-neutral-500 text-sm italic">No oscillators found.</div>
                                ) : null}
                            </div>
                            <Button className="w-full" onClick={() => setShowInviteModal(false)}>Done</Button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Manage Members Modal */}
                {showManageMembersModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-osia-neutral-950/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="w-full max-w-lg bg-osia-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 flex flex-col max-h-[85vh]"
                        >
                            <div className="flex justify-between items-center shrink-0">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white">Member Governance</h3>
                                    <p className="text-xs text-osia-neutral-400">Manage members and roles for {teamData?.team?.name || 'this team'}</p>
                                </div>
                                <button onClick={() => setShowManageMembersModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-osia-neutral-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {(teamData?.team?.members || []).map((member: any) => (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {member.avatarUrl ? (
                                                <img
                                                    src={member.avatarUrl}
                                                    alt={member.name}
                                                    className="w-12 h-12 rounded-full object-cover border border-osia-teal-500/20 shadow-inner shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-400 font-black border border-osia-teal-500/20 text-xl shadow-inner shrink-0">
                                                    {(member.name || 'U')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-white truncate">{member.name || member.username}</span>
                                                    {member.role === 'Leader' && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-black uppercase shrink-0">Leader</span>}
                                                    {member.role === 'Admin' && <span className="text-[8px] bg-osia-teal-500/10 text-osia-teal-400 px-2 py-0.5 rounded-full border border-osia-teal-500/20 font-black uppercase shrink-0">Admin</span>}
                                                </div>
                                                <div className="text-[10px] text-osia-neutral-500 font-mono truncate">{member.username}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="flex flex-col items-end shrink-0">
                                                {member.hasData ? (
                                                    <div className="flex items-center gap-1 text-[8px] text-osia-teal-500 font-bold uppercase tracking-tighter">
                                                        <ShieldCheck className="w-2.5 h-2.5" />
                                                        Synced
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[8px] text-amber-500/60 font-bold uppercase tracking-tighter">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        Pending Data
                                                    </div>
                                                )}
                                            </div>

                                            {isUserAdmin && member.userId !== currentUserId && member.role !== 'Leader' && (
                                                <div className="flex gap-2 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleUpdateRole(member.userId, member.role === 'Admin' ? 'Member' : 'Admin')}
                                                        className="h-8 text-[10px] font-black uppercase tracking-widest px-2"
                                                    >
                                                        {member.role === 'Admin' ? 'Demote' : 'Promote'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveMember(member.userId)}
                                                        className="h-8 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 hover:text-red-400 px-2"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="shrink-0 flex gap-4">
                                {isUserAdmin && (
                                    <Button variant="ghost" onClick={handleDeleteTeam} className="flex-1 text-red-500 border-red-500/10 hover:bg-red-500/10 font-bold">
                                        Dissolve Team
                                    </Button>
                                )}
                                {!isUserAdmin && (
                                    <Button variant="ghost" onClick={handleLeaveTeam} className="flex-1 text-osia-neutral-400 border-white/10 hover:bg-white/5 font-bold">
                                        Leave Team
                                    </Button>
                                )}
                                <Button className="flex-1" onClick={() => setShowManageMembersModal(false)}>Refocus</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ToastComponent />
        </div>
    );
}
