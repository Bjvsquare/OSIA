import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate } from 'react-router-dom';
import { Play, BarChart3, ChevronRight, Plus, Search, X, Clock, UserPlus } from 'lucide-react';
import { api } from '../../services/api';

export function TeamHomePage() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Join state
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [requestMessage, setRequestMessage] = useState('');
    const [selectedTeamForRequest, setSelectedTeamForRequest] = useState<any>(null);
    const [submittingRequest, setSubmittingRequest] = useState(false);

    useEffect(() => {
        loadTeams();
        loadMyRequests();
    }, []);

    const loadTeams = async () => {
        try {
            const data = await api.getMyTeams();
            setTeams(data);
        } catch (error) {
            console.error('Failed to load teams', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMyRequests = async () => {
        try {
            const data = await api.getMyJoinRequests();
            setMyRequests(data);
        } catch (error) {
            console.error('Failed to load requests', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const results = await api.searchTeams(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleRequestJoin = async (team: any) => {
        setSubmittingRequest(true);
        try {
            await api.requestToJoinTeam(team.id, requestMessage);
            setSelectedTeamForRequest(null);
            setRequestMessage('');
            await loadMyRequests();
            // Remove from search results
            setSearchResults(prev => prev.filter(t => t.id !== team.id));
        } catch (error: any) {
            alert(error.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const pendingRequests = myRequests.filter(r => r.status === 'pending');

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 container mx-auto px-6 pb-12 max-w-5xl">
                <div className="space-y-12">
                    {/* Context Switcher: Personal Circles vs Organizations */}
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit">
                        <button
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)] transition-all"
                        >
                            My Circles
                        </button>
                        <button
                            onClick={() => navigate('/organizations')}
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Organizations
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight">Collective Context.</h1>
                            <p className="text-osia-neutral-500 text-sm italic">Aggregate patterns, never individual scores.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setShowSearch(!showSearch)}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Search size={16} />
                                Find Teams
                            </Button>
                            <Button onClick={() => navigate('/teams/create')} variant="primary" className="flex items-center gap-2 px-8">
                                <Plus size={16} />
                                Create New Team
                            </Button>
                        </div>
                    </div>

                    {/* Search Panel */}
                    {showSearch && (
                        <Card className="p-6 border-osia-teal-500/20 bg-[#0a1128]/60 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Search size={18} className="text-osia-teal-400" />
                                    Find & Join Teams
                                </h3>
                                <button onClick={() => setShowSearch(false)} className="text-osia-neutral-500 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by team name..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-osia-neutral-500 focus:outline-none focus:border-osia-teal-500/50"
                                />
                                <Button onClick={handleSearch} disabled={searchLoading}>
                                    {searchLoading ? 'Searching...' : 'Search'}
                                </Button>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs text-osia-neutral-500 uppercase tracking-widest">{searchResults.length} teams found</p>
                                    {searchResults.map(team => (
                                        <div key={team.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div>
                                                <h4 className="font-semibold text-white">{team.name}</h4>
                                                <p className="text-xs text-osia-neutral-500">{team.type} • {team.purpose}</p>
                                            </div>
                                            {selectedTeamForRequest?.id === team.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={requestMessage}
                                                        onChange={(e) => setRequestMessage(e.target.value)}
                                                        placeholder="Optional message..."
                                                        className="w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-osia-neutral-500"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRequestJoin(team)}
                                                        disabled={submittingRequest}
                                                    >
                                                        {submittingRequest ? '...' : 'Send'}
                                                    </Button>
                                                    <button
                                                        onClick={() => setSelectedTeamForRequest(null)}
                                                        className="text-osia-neutral-500 hover:text-white"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedTeamForRequest(team)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <UserPlus size={14} />
                                                    Request to Join
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery && searchResults.length === 0 && !searchLoading && (
                                <p className="text-center text-osia-neutral-500 py-4">No teams found matching "{searchQuery}"</p>
                            )}
                        </Card>
                    )}

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <Card className="p-6 border-yellow-500/20 bg-yellow-500/5 space-y-4">
                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                <Clock size={16} />
                                Pending Join Requests
                            </h3>
                            <div className="space-y-2">
                                {pendingRequests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span className="text-white">{req.teamName}</span>
                                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            Awaiting approval
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {loading ? (
                        <div className="p-12 text-center text-osia-neutral-500 animate-pulse">Syncing team networks...</div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <p className="text-osia-neutral-400 mb-6">You are not part of any teams yet.</p>
                            <div className="flex items-center justify-center gap-4">
                                <Button onClick={() => setShowSearch(true)} variant="outline">Find Existing Team</Button>
                                <Button onClick={() => navigate('/teams/create')}>Create New Team</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {teams.map((team) => (
                                <Card key={team.id} className="p-8 border-white/5 bg-[#0a1128]/40 space-y-8 group hover:border-osia-teal-500/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 cursor-pointer" onClick={() => navigate(`/teams/${team.id}`)}>
                                            <h3 className="text-2xl font-bold group-hover:text-osia-teal-500 transition-colors">{team.name}</h3>
                                            <div className="flex items-center gap-4 text-[10px] text-osia-neutral-500 font-bold uppercase tracking-widest">
                                                <span>{team.members?.length || 0} members</span>
                                                {(team.activeSessions > 0) && (
                                                    <span className="text-osia-teal-500 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-osia-teal-500 animate-pulse" />
                                                        Session Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => navigate(`/teams/${team.id}`)} className="flex items-center gap-2 text-osia-neutral-600 hover:text-white transition-colors group/btn">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">Access Intelligence</span>
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => navigate(`/teams/${team.id}/session`)}
                                            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-osia-teal-500/10 border border-osia-teal-500/20 text-[10px] font-bold uppercase tracking-widest text-osia-teal-500 hover:bg-osia-teal-500/20 transition-all"
                                        >
                                            <Play size={14} fill="currentColor" />
                                            Enter Session
                                        </button>
                                        <button
                                            onClick={() => navigate(`/teams/${team.id}/patterns`)}
                                            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-osia-neutral-400 hover:text-white transition-all"
                                        >
                                            <BarChart3 size={14} />
                                            View Patterns
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Ethical Boundary Reminder */}
                    <Card className="p-8 border-osia-teal-500/20 bg-osia-teal-500/[0.03]">
                        <div className="max-w-3xl space-y-6">
                            <h4 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Team Boundaries</h4>
                            <div className="grid sm:grid-cols-3 gap-8">
                                {[
                                    { title: 'Anonymized', desc: 'Individual inputs are never revealed at the group level.' },
                                    { title: 'Voluntary', desc: 'Anyone can pause or stop team participation at any time.' },
                                    { title: 'No Scoring', desc: 'OSIA does not rank or compare team members.' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="text-white text-xs font-bold">{item.title}</div>
                                        <p className="text-[11px] text-osia-neutral-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
