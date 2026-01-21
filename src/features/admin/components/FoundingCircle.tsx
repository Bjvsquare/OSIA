import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { CheckCircle2, Clock, UserCheck, Download, RefreshCw, Trash2 } from 'lucide-react';

interface FoundingMember {
    id: string;
    email: string;
    queueNumber: number;
    accessCode: string;
    status: 'pending' | 'approved' | 'activated';
    signedUpAt: string;
    approvedAt: string | null;
    activatedAt: string | null;
    metadata?: {
        referralSource?: string;
        notes?: string;
    };
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    activated: number;
    remainingSlots: number;
}

export function FoundingCircle() {
    const { auth } = useAuth();
    const { showToast } = useToast();
    const [members, setMembers] = useState<FoundingMember[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'activated'>('all');

    const fetchData = async () => {
        try {
            const [membersRes, statsRes] = await Promise.all([
                fetch('/api/founding-circle/admin/all', {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                }),
                fetch('/api/founding-circle/admin/stats', {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                })
            ]);

            if (membersRes.ok && statsRes.ok) {
                setMembers(await membersRes.json());
                setStats(await statsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch founding circle data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (memberId: string) => {
        try {
            const response = await fetch(`/api/founding-circle/admin/${memberId}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });

            if (response.ok) {
                showToast('Member approved successfully', 'success');
                fetchData();
            }
        } catch (error) {
            showToast('Failed to approve member', 'error');
        }
    };

    const handleBulkApprove = async (count: number) => {
        try {
            const response = await fetch('/api/founding-circle/admin/bulk-approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({ count })
            });

            if (response.ok) {
                const data = await response.json();
                showToast(`Approved ${data.members.length} members`, 'success');
                fetchData();
            }
        } catch (error) {
            showToast('Failed to bulk approve', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/founding-circle/admin/export', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'founding-circle-export.csv';
                a.click();
                showToast('Export downloaded', 'success');
            }
        } catch (error) {
            showToast('Failed to export', 'error');
        }
    };

    const handleDelete = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to delete this member? Their spot will be opened and the queue will shift.')) {
            return;
        }

        try {
            const response = await fetch(`/api/founding-circle/admin/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });

            if (response.ok) {
                showToast('Member removed and queue updated', 'info');
                fetchData();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to delete member', 'error');
            }
        } catch (error) {
            showToast('Failed to delete member', 'error');
        }
    };

    const filteredMembers = members.filter(m => filter === 'all' || m.status === filter);

    const statusColors = {
        pending: 'text-yellow-500 bg-yellow-500/10',
        approved: 'text-blue-500 bg-blue-500/10',
        activated: 'text-green-500 bg-green-500/10'
    };

    const statusIcons = {
        pending: Clock,
        approved: UserCheck,
        activated: CheckCircle2
    };

    if (isLoading) {
        return <div className="text-white">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {[
                    { label: 'Total Signups', value: stats?.total || 0, color: 'text-white' },
                    { label: 'Pending', value: stats?.pending || 0, color: 'text-yellow-500' },
                    { label: 'Approved', value: stats?.approved || 0, color: 'text-blue-500' },
                    { label: 'Activated', value: stats?.activated || 0, color: 'text-green-500' },
                    { label: 'Slots Left', value: stats?.remainingSlots || 0, color: 'text-osia-teal-500' }
                ].map((stat, i) => (
                    <Card key={i} className="p-6 bg-white/[0.02] border-white/5">
                        <div className="text-xs font-bold text-osia-neutral-500 uppercase tracking-widest mb-2">
                            {stat.label}
                        </div>
                        <div className={`text-3xl font-black ${stat.color}`}>
                            {stat.value}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Actions Bar */}
            <Card className="p-6 bg-white/[0.02] border-white/5">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        {(['all', 'pending', 'approved', 'activated'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${filter === f
                                    ? 'bg-osia-teal-500 text-white'
                                    : 'bg-white/5 text-osia-neutral-500 hover:text-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => fetchData()}
                            className="text-xs"
                        >
                            <RefreshCw size={14} className="mr-2" />
                            Refresh
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleBulkApprove(150)}
                            className="text-xs"
                        >
                            Approve First 150
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            className="text-xs"
                        >
                            <Download size={14} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Members Table */}
            <Card className="p-8 bg-white/[0.02] border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Queue #
                                </th>
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Email
                                </th>
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Status
                                </th>
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Access Code
                                </th>
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Joined
                                </th>
                                <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-osia-neutral-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => {
                                const StatusIcon = statusIcons[member.status];
                                return (
                                    <motion.tr
                                        key={member.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="text-white font-bold">#{member.queueNumber}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-white">{member.email}</div>
                                            {member.metadata?.referralSource && (
                                                <div className="text-xs text-osia-neutral-500 mt-1">
                                                    via {member.metadata.referralSource}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusColors[member.status]}`}>
                                                <StatusIcon size={12} />
                                                {member.status}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-white font-mono text-sm">
                                                {member.accessCode || '—'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-osia-neutral-400 text-sm">
                                                {new Date(member.signedUpAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex gap-2">
                                                {member.status === 'pending' && (
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleApprove(member.id)}
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDelete(member.id)}
                                                    className="text-xs py-1 px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-transparent hover:border-red-500"
                                                >
                                                    <Trash2 size={12} className="mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-12 text-osia-neutral-500">
                            No members found
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
