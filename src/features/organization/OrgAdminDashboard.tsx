import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Building2, Users, BarChart3, Briefcase, Settings,
    CheckCircle, XCircle, Clock, ChevronRight, Eye, Shield,
    UserPlus, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type Tab = 'overview' | 'members' | 'analytics' | 'recruitment' | 'settings';

interface Organization {
    id: string;
    name: string;
    type: string;
    industry: string;
    size: string;
    blueprint?: any;
    settings: any;
}

interface Member {
    id: string;
    userId: string;
    role: string;
    department?: string;
    title?: string;
    status: 'pending' | 'active' | 'suspended';
    user?: {
        id: string;
        name?: string;
        username: string;
        avatarUrl?: string;
    };
    dataConsent: {
        shareBlueprint: boolean;
        shareProtocolStats: boolean;
        shareGrowthTrends: boolean;
    };
    joinedAt: string;
}

interface Analytics {
    memberCount: number;
    pendingCount: number;
    departmentBreakdown: Record<string, number>;
    consentLevels: { full: number; partial: number; minimal: number };
}

interface RecruitmentRole {
    id: string;
    orgId: string;
    title: string;
    department: string;
    idealTraits: Record<string, any>;
    status: 'open' | 'closed' | 'paused';
    createdAt: string;
}

export function OrgAdminDashboard({ hideHeader = false }: { hideHeader?: boolean }) {
    const { orgId } = useParams<{ orgId: string }>();
    const { auth, userProfile } = useAuth();
    const [tab, setTab] = useState<Tab>('overview');
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
    const [roles, setRoles] = useState<RecruitmentRole[]>([]);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [orgId]);

    const loadData = async () => {
        if (!orgId) return;
        setIsLoading(true);
        setError('');

        try {
            // Load organization
            const orgRes = await api.getOrganization(orgId);
            if (!orgRes.ok) throw new Error('Failed to load organization');
            setOrg(await orgRes.json());

            // Load members
            const membersRes = await api.getOrgMembers(orgId);
            if (membersRes.ok) {
                const allMembers = await membersRes.json();
                setMembers(allMembers.filter((m: Member) => m.status === 'active'));
                setPendingRequests(allMembers.filter((m: Member) => m.status === 'pending'));
            }

            // Load analytics
            const analyticsRes = await api.getOrgAnalytics(orgId);
            if (analyticsRes.ok) {
                setAnalytics(await analyticsRes.json());
            }

            // Load roles
            const rolesRes = await api.getOrgRoles(orgId);
            if (rolesRes.ok) {
                setRoles(await rolesRes.json());
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const form = e.target as HTMLFormElement;
            const data = {
                title: (form.elements.namedItem('title') as HTMLInputElement).value,
                department: (form.elements.namedItem('department') as HTMLInputElement).value,
                idealTraits: JSON.parse((form.elements.namedItem('traits') as HTMLTextAreaElement).value)
            };

            await api.createOrgRole(orgId!, data);

            setIsCreatingRole(false);
            loadData();
        } catch (err) {
            console.error('Failed to create role', err);
        }
    };

    const handleUpdateSettings = async (settings: any) => {
        try {
            const res = await api.updateOrgSettings(orgId!, settings);

            if (res.ok) {
                const newSettings = await res.json();
                setOrg(prev => prev ? { ...prev, settings: newSettings } : null);
            }
        } catch (err) {
            console.error('Failed to update settings', err);
        }
    };

    const handleApprove = async (memberId: string) => {
        try {
            await api.approveMember(orgId!, memberId);
            loadData();
        } catch (err) {
            console.error('Failed to approve', err);
        }
    };

    const handleReject = async (memberId: string) => {
        try {
            await api.removeMember(orgId!, memberId);
            loadData();
        } catch (err) {
            console.error('Failed to reject', err);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            const res = await api.removeMember(orgId!, memberId);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            await api.updateMemberRole(orgId!, memberId, newRole);
            loadData();
        } catch (err) {
            console.error('Failed to update role', err);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const form = e.target as HTMLFormElement;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

            const res = await api.addMember(orgId!, { email, role });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add member');
            }

            setIsAddingMember(false);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const tabs: Array<{ id: Tab; label: string; icon: any; badge?: number }> = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'members', label: 'Members', icon: Users, badge: pendingRequests.length },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !org) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
                    <p className="text-osia-neutral-400">{error || 'Organization not found'}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                            <p className="text-osia-neutral-400">{org.industry} • {org.size}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${tab === t.id
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                            : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        {t.badge ? (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {t.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {tab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        <StatCard
                            icon={Users}
                            label="Active Members"
                            value={analytics?.memberCount || 0}
                            color="purple"
                        />
                        <StatCard
                            icon={Clock}
                            label="Pending Requests"
                            value={analytics?.pendingCount || 0}
                            color="yellow"
                        />
                        <StatCard
                            icon={Eye}
                            label="Full Consent"
                            value={analytics?.consentLevels.full || 0}
                            color="teal"
                        />

                        {/* Blueprint Preview */}
                        {org.blueprint && (
                            <Card className="md:col-span-3 p-6 border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-purple-400" />
                                    Organization Blueprint
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <BlueprintSection title="Culture" data={org.blueprint.culture} />
                                    <BlueprintSection title="Structure" data={org.blueprint.structure} />
                                    <BlueprintSection title="Dynamics" data={org.blueprint.dynamics} />
                                </div>
                            </Card>
                        )}

                        {/* Pending Requests Quick View */}
                        {pendingRequests.length > 0 && (
                            <Card className="md:col-span-3 p-6 border-yellow-500/20 bg-yellow-500/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-yellow-400" />
                                        Pending Join Requests
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTab('members')}
                                    >
                                        View All <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {pendingRequests.slice(0, 3).map(req => (
                                        <PendingRequestRow
                                            key={req.id}
                                            request={req}
                                            onApprove={() => handleApprove(req.id)}
                                            onReject={() => handleReject(req.id)}
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}

                {/* Members Tab */}
                {tab === 'members' && (
                    <motion.div
                        key="members"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Pending */}
                        {pendingRequests.length > 0 && (
                            <Card className="p-6 border-yellow-500/20">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-yellow-400" />
                                    Pending Requests ({pendingRequests.length})
                                </h3>
                                <div className="space-y-3">
                                    {pendingRequests.map(req => (
                                        <PendingRequestRow
                                            key={req.id}
                                            request={req}
                                            onApprove={() => handleApprove(req.id)}
                                            onReject={() => handleReject(req.id)}
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Active Members */}
                        <Card className="p-6 border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    Active Members ({members.length})
                                </h3>
                                <Button size="sm" onClick={() => setIsAddingMember(true)} className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30">
                                    <UserPlus className="w-4 h-4 mr-2" /> Add Member
                                </Button>
                            </div>

                            {isAddingMember && (
                                <Card className="p-4 border-purple-500/20 bg-purple-500/5 mb-4">
                                    <h4 className="text-sm font-medium text-white mb-3">Add Member directly</h4>
                                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            name="email"
                                            type="text"
                                            placeholder="Email or Username"
                                            required
                                            className="flex-1 bg-osia-deep-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-purple-500/50 outline-none"
                                        />
                                        <select
                                            name="role"
                                            className="bg-osia-deep-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" className="bg-purple-600">Add</Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingMember(false)}>Cancel</Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            <div className="space-y-2">
                                {members.map(member => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        isMe={member.userId === userProfile?.id || member.userId === auth.username}
                                        onRemove={() => handleRemoveMember(member.id)}
                                        onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                                    />
                                ))}
                                {members.length === 0 && (
                                    <p className="text-osia-neutral-500 text-center py-8">
                                        No active members yet
                                    </p>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Analytics Tab */}
                {tab === 'analytics' && analytics && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        <Card className="p-6 border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">Department Breakdown</h3>
                            <div className="space-y-3">
                                {Object.entries(analytics.departmentBreakdown).map(([dept, count]) => (
                                    <div key={dept} className="flex items-center justify-between">
                                        <span className="text-osia-neutral-300">{dept}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500"
                                                    style={{
                                                        width: `${(count / analytics.memberCount) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-white font-medium w-8 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6 border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">Data Consent Levels</h3>
                            <div className="space-y-4">
                                <ConsentBar
                                    label="Full Consent"
                                    value={analytics.consentLevels.full}
                                    total={analytics.memberCount}
                                    color="bg-green-500"
                                />
                                <ConsentBar
                                    label="Partial Consent"
                                    value={analytics.consentLevels.partial}
                                    total={analytics.memberCount}
                                    color="bg-yellow-500"
                                />
                                <ConsentBar
                                    label="Minimal Consent"
                                    value={analytics.consentLevels.minimal}
                                    total={analytics.memberCount}
                                    color="bg-red-500"
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Recruitment Tab */}
                {tab === 'recruitment' && (
                    <motion.div
                        key="recruitment"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {roles.length === 0 && !isCreatingRole ? (
                            <Card className="p-12 text-center border-white/5">
                                <Briefcase className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-white mb-2">Recruitment Module</h3>
                                <p className="text-osia-neutral-400 max-w-md mx-auto mb-6">
                                    Create role profiles with ideal Blueprint traits and find matching candidates.
                                </p>
                                <Button onClick={() => setIsCreatingRole(true)} className="bg-purple-600">
                                    <UserPlus className="w-4 h-4 mr-2" /> Create First Role
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Open Roles</h3>
                                    {!isCreatingRole && (
                                        <Button onClick={() => setIsCreatingRole(true)} size="sm">
                                            <UserPlus className="w-4 h-4 mr-2" /> Add Role
                                        </Button>
                                    )}
                                </div>

                                {isCreatingRole && (
                                    <Card className="p-6 border-purple-500/20 bg-purple-500/5 mb-6">
                                        <h4 className="text-lg font-medium text-white mb-4">New Role Profile</h4>
                                        <form onSubmit={handleCreateRole} className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-osia-neutral-400 mb-1">Role Title</label>
                                                    <input
                                                        name="title" required
                                                        className="w-full bg-osia-deep-900 border border-white/10 rounded-lg p-2 text-white"
                                                        placeholder="e.g. Senior Engineer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-osia-neutral-400 mb-1">Department</label>
                                                    <input
                                                        name="department" required
                                                        className="w-full bg-osia-deep-900 border border-white/10 rounded-lg p-2 text-white"
                                                        placeholder="e.g. Engineering"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-osia-neutral-400 mb-1">Ideal Blueprint Traits (JSON)</label>
                                                <textarea
                                                    name="traits"
                                                    className="w-full bg-osia-deep-900 border border-white/10 rounded-lg p-2 text-white font-mono text-xs"
                                                    rows={3}
                                                    defaultValue='{"innovation": {"min": 0.7, "max": 1.0, "weight": 1.0}}'
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" onClick={() => setIsCreatingRole(false)}>Cancel</Button>
                                                <Button type="submit" className="bg-purple-600">Create Role</Button>
                                            </div>
                                        </form>
                                    </Card>
                                )}

                                <div className="grid gap-4">
                                    {roles.map(role => (
                                        <Card key={role.id} className="p-4 border-white/5 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white font-medium">{role.title}</h4>
                                                <p className="text-sm text-osia-neutral-400">{role.department} • {role.status}</p>
                                            </div>
                                            <Button variant="outline" size="sm">View Matches</Button>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Settings Tab */}
                {tab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className="p-6 border-white/5 space-y-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Organization Settings</h3>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <h4 className="text-white font-medium">Public Discoverability</h4>
                                    <p className="text-sm text-osia-neutral-400">Allow users to find this organization in search</p>
                                </div>
                                <div
                                    onClick={() => handleUpdateSettings({ allowPublicSearch: !org.settings.allowPublicSearch })}
                                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${org.settings.allowPublicSearch ? 'bg-purple-600' : 'bg-white/20'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${org.settings.allowPublicSearch ? 'left-7' : 'left-1'}`} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <h4 className="text-white font-medium">Require Admin Approval</h4>
                                    <p className="text-sm text-osia-neutral-400">New members must be approved by an admin</p>
                                </div>
                                <div
                                    onClick={() => handleUpdateSettings({ requireApproval: !org.settings.requireApproval })}
                                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${org.settings.requireApproval ? 'bg-purple-600' : 'bg-white/20'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${org.settings.requireApproval ? 'left-7' : 'left-1'}`} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <h4 className="text-white font-medium">Enable Recruitment</h4>
                                    <p className="text-sm text-osia-neutral-400">Show recruitment tab and allow role creation</p>
                                </div>
                                <div
                                    onClick={() => handleUpdateSettings({ recruitmentEnabled: !org.settings.recruitmentEnabled })}
                                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${org.settings.recruitmentEnabled ? 'bg-purple-600' : 'bg-white/20'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${org.settings.recruitmentEnabled ? 'left-7' : 'left-1'}`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub-components
function StatCard({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: number; color: 'purple' | 'yellow' | 'teal'
}) {
    const colors = {
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
        yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
        teal: 'from-osia-teal-500/20 to-osia-teal-600/10 border-osia-teal-500/20 text-osia-teal-400'
    };

    return (
        <Card className={`p-6 bg-gradient-to-br ${colors[color]} border`}>
            <div className="flex items-center gap-4">
                <Icon className={`w-8 h-8 ${color === 'purple' ? 'text-purple-400' : color === 'yellow' ? 'text-yellow-400' : 'text-osia-teal-400'}`} />
                <div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-sm text-osia-neutral-400">{label}</p>
                </div>
            </div>
        </Card>
    );
}

function BlueprintSection({ title, data }: { title: string; data: any }) {
    if (!data) return null;
    const entries = Object.entries(data).filter(([k]) => k !== 'values' && typeof data[k] === 'number');

    return (
        <div>
            <h4 className="text-sm font-medium text-purple-300 mb-3">{title}</h4>
            <div className="space-y-2">
                {entries.slice(0, 4).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-osia-neutral-500 capitalize w-24">{key}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500"
                                style={{ width: `${(val as number) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PendingRequestRow({ request, onApprove, onReject }: {
    request: Member; onApprove: () => void; onReject: () => void
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center overflow-hidden">
                    {request.user?.avatarUrl ? (
                        <img src={request.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Users className="w-5 h-5 text-yellow-400" />
                    )}
                </div>
                <div>
                    <p className="text-white font-medium">{request.user?.name || request.user?.username || `User ${request.userId.slice(0, 8)}`}</p>
                    <p className="text-xs text-osia-neutral-500">
                        {request.role} • {request.department || 'No dept'} • {request.title || 'No title'}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={onReject} className="border-red-500/50 text-red-400">
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

function MemberRow({ member, isMe, onRemove, onUpdateRole }: {
    member: Member;
    isMe: boolean;
    onRemove: () => void;
    onUpdateRole: (role: string) => void;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl group transition-all hover:bg-white/10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center overflow-hidden">
                    {member.user?.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Users className="w-5 h-5 text-purple-400" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{member.user?.name || member.user?.username || `User ${member.userId.slice(0, 8)}`}</p>
                        {isMe && <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">You</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-osia-neutral-500 capitalize">
                            {member.role} • {member.department || 'No dept'}
                        </span>
                        {member.dataConsent.shareBlueprint && (
                            <span className="px-1.5 py-0.5 bg-osia-teal-500/20 text-osia-teal-400 text-[9px] font-bold uppercase rounded border border-osia-teal-500/20">OSIA</span>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex items-center gap-2 transition-all ${isMe ? 'invisible' : 'opacity-0 group-hover:opacity-100'}`}>
                <select
                    value={member.role}
                    onChange={(e) => onUpdateRole(e.target.value)}
                    className="bg-osia-deep-900 border border-white/10 rounded px-2 py-1 text-xs text-osia-neutral-300 outline-none hover:border-purple-500/50"
                >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                </select>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRemove}
                    className="border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all h-8 w-8 p-0"
                    title="Remove Member"
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

function ConsentBar({ label, value, total, color }: {
    label: string; value: number; total: number; color: string
}) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-osia-neutral-300">{label}</span>
                <span className="text-white">{value} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
