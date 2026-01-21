import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Search, Trash2, ShieldCheck, RefreshCw, Fingerprint, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { resolveAvatarUrl } from '../../../utils/resolveAvatarUrl';
import { UserBlueprintDetail } from './UserBlueprintDetail';

export function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { auth, refreshProfile } = useAuth();
    const { showToast } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin: !currentIsAdmin })
            });

            if (!response.ok) throw new Error('Failed to update role');

            showToast(`User ${!currentIsAdmin ? 'promoted to Admin' : 'demoted to User'}`, 'success');
            await refreshProfile(); // Refresh current user's profile state
            fetchUsers(); // Refresh list
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you absolutely sure? This will delete all user data across the system.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            showToast('User account purged', 'info');
            fetchUsers(); // Refresh list
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedUserId) {
        const user = users.find(u => u.id === selectedUserId);
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedUserId(null)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-osia-neutral-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Directory
                </button>
                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center text-white">
                    <Fingerprint className="w-12 h-12 text-osia-teal-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black">{user?.name || user?.username}'s Foundational Blueprint</h2>
                    <p className="text-osia-neutral-500 mt-2">Historical Snapshots & 15-Layer Framework</p>

                    <div className="mt-8">
                        <UserBlueprintDetail userId={selectedUserId as string} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">Identity Directory</h3>
                    <p className="text-[10px] text-osia-neutral-500 uppercase tracking-widest font-black">Managing {users.length} Verified Identities</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-osia-neutral-500" size={14} />
                        <input
                            placeholder="SEARCH IDENTITIES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:border-osia-teal-500/50 focus:outline-none transition-colors"
                        />
                    </div>
                    <Button variant="secondary" className="px-6 py-2.5" onClick={fetchUsers} disabled={isLoading}>
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-white/5 bg-[#0a1128]/40 backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-osia-neutral-600">
                            <th className="px-8 py-5">Identity</th>
                            <th className="px-8 py-5">System Role</th>
                            <th className="px-8 py-5">Created</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        <AnimatePresence>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <RefreshCw className="w-8 h-8 text-osia-teal-500 animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-500">Retrieving Identity Streams...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-600">No identities found matching query.</span>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user, i) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-osia-teal-500/20 to-osia-purple-500/20 border border-white/10 flex items-center justify-center text-osia-teal-500 font-bold text-xs overflow-hidden">
                                                    {user.avatarUrl ? (
                                                        <img src={resolveAvatarUrl(user.avatarUrl || undefined) as string} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (user.name || user.username || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                                    )}
                                                </div>
                                                {user.isAdmin && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-osia-teal-500 rounded-full border-2 border-[#0a1128] flex items-center justify-center">
                                                        <ShieldCheck size={8} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-white font-bold">{user.name || user.username}</div>
                                                <div className="text-[10px] text-osia-neutral-600 uppercase tracking-widest font-black flex items-center gap-2">
                                                    {user.email}
                                                    {user.status === 'deletion_pending' && (
                                                        <span className="w-1 h-1 rounded-full bg-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.isAdmin ? 'bg-osia-teal-500 shadow-[0_0_10px_#38a3a5]' : 'bg-white/20'}`} />
                                            <div className={`text-[10px] font-black uppercase tracking-widest ${user.isAdmin ? 'text-white' : 'text-osia-neutral-500'}`}>
                                                {user.status === 'deletion_pending' ? (
                                                    <span className="text-red-400 animate-pulse">DELETION PENDING</span>
                                                ) : (
                                                    user.isAdmin ? 'Administrator' : 'Verified User'
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black text-osia-neutral-500 tracking-widest">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedUserId(user.id)}
                                            className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                                            title="View 15-Layer Blueprint"
                                        >
                                            <Fingerprint size={12} />
                                            BLUEPRINT
                                        </button>
                                        <button
                                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${user.isAdmin
                                                ? 'bg-osia-purple-500/10 text-osia-purple-500 hover:bg-osia-purple-500/20 border border-osia-purple-500/20'
                                                : 'bg-osia-teal-500/10 text-osia-teal-500 hover:bg-osia-teal-500/20 border border-osia-teal-500/20'
                                                }`}
                                        >
                                            {user.isAdmin ? 'DEMOTE' : 'PROMOTE'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                                            title="Purge Identity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
