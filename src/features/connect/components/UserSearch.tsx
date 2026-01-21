import { useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import axios from 'axios';
import { RequestModal } from './RequestModal';
import { useAuth } from '../../../features/auth/AuthContext';

export function UserSearch() {
    const { auth } = useAuth();
    const token = auth.token;
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null); // For modal

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length < 2) return;

        setIsLoading(true);
        setError(null);
        try {
            console.log('Searching with token:', token ? 'Present' : 'Missing');
            const res = await axios.get(`/api/connect/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Search response:', res.data);
            setResults(res.data);
        } catch (err: any) {
            console.error('Search failed', err);
            setError(err.response?.data?.error || err.message || 'Search failed');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async (type: string) => {
        if (!selectedUser) return;
        try {
            await axios.post('/api/connect/request', {
                toUserId: selectedUser.userId,
                type
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Could add toast here
            alert('Request sent!');
        } catch (err) {
            console.error('Failed to send request', err);
            alert('Failed to send request');
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-osia-neutral-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by username or name..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-osia-neutral-500 focus:outline-none focus:ring-2 focus:ring-osia-teal-500/50"
                    />
                </div>
                <Button type="submit" disabled={isLoading || query.length < 2}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
            </form>

            {
                error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )
            }

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.length === 0 && !isLoading && query.length > 2 && (
                    <div className="col-span-full text-center py-10 text-osia-neutral-500">
                        No users found matching "{query}"
                    </div>
                )}

                {results.map((user) => (
                    <div key={user.userId} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-osia-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium text-white">{user.username.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-white">{user.name || user.username}</h3>
                                {user.name && <p className="text-xs text-osia-neutral-400">@{user.username}</p>}
                            </div>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setSelectedUser(user)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                        </Button>
                    </div>
                ))}
            </div>

            <RequestModal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                targetUsername={selectedUser?.username || ''}
                onSubmit={handleSendRequest}
            />
        </div >
    );
}
