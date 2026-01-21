import { useState, useEffect } from 'react';
import { Building2, Plus, Search, ChevronRight, Briefcase, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PlexusBackground } from '../../../components/viz/PlexusBackground';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

export function OrgHub() {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [memberships, setMemberships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        setLoading(true);
        try {
            const res = await api.getMyMemberships();
            if (res.ok) {
                setMemberships(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch memberships', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await api.searchOrganizations(searchQuery);
            if (res.ok) {
                setSearchResults(await res.json());
            }
        } catch (e) {
            console.error('Search failed', e);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-950 text-white relative overflow-hidden">
            <PlexusBackground />

            <div className="relative z-10 pt-24 pb-12 px-6 max-w-7xl mx-auto">
                {/* Context Switcher: Personal Circles vs Organizations */}
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit mb-8">
                    <button
                        onClick={() => navigate('/teams')}
                        className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        My Circles
                    </button>
                    <button
                        className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all"
                    >
                        Organizations
                    </button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                            <Building2 size={14} />
                            Organization Hub
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Enterprise Networks.</h1>
                        <p className="text-osia-neutral-400 max-w-lg">
                            Connect your professional identity to your organizational context. Aggregate insights, drive cultural evolution.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Button
                                onClick={() => navigate('/signup/organization/register')}
                                className="relative bg-purple-600 hover:bg-purple-500 text-white px-8 h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20"
                            >
                                <Plus size={18} />
                                Register Organization
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content: My Bio-Orgs */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-osia-neutral-500 mb-6 flex items-center gap-2">
                                <Activity size={14} className="text-osia-teal-400" />
                                Your Memberships
                            </h2>

                            {loading ? (
                                <div className="grid gap-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : memberships.length === 0 ? (
                                <Card className="p-12 text-center border-dashed border-white/10 bg-white/[0.02]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Building2 className="w-8 h-8 text-osia-neutral-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No active organizations</h3>
                                    <p className="text-osia-neutral-400 mb-8 max-w-sm mx-auto">
                                        You are not currently a member of any organization. Discover an existing one or create a new network.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button variant="outline" className="border-white/10" onClick={() => { }}>
                                            Discover Businesses
                                        </Button>
                                        <Button className="bg-purple-600" onClick={() => navigate('/signup/organization/register')}>
                                            Create Organization
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {memberships.map((m) => (
                                        <Card
                                            key={m.id}
                                            className="group p-6 border-white/5 bg-white/[0.03] hover:border-purple-500/30 transition-all cursor-pointer"
                                            onClick={() => navigate(`/organization/${m.orgId}`)}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                                                    <Building2 className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                                                    {m.role}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                                                    {m.organization?.name}
                                                </h3>
                                                <p className="text-xs text-osia-neutral-500 mb-4">
                                                    {m.organization?.industry} • {m.organization?.size}
                                                </p>
                                                <div className="flex items-center text-[10px] font-bold text-osia-neutral-400 uppercase tracking-widest gap-2">
                                                    View Dashboard
                                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar: Explore & Find */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-osia-neutral-500 mb-6 flex items-center gap-2">
                                <Search size={14} className="text-osia-teal-400" />
                                Find Business
                            </h2>
                            <Card className="p-6 border-white/10 bg-white/[0.02] backdrop-blur-xl">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search organizations..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                        />
                                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-osia-neutral-500" />
                                    </div>
                                    <Button
                                        onClick={handleSearch}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                        disabled={isSearching}
                                    >
                                        {isSearching ? 'Scanning...' : 'Search Network'}
                                    </Button>

                                    {searchResults.length > 0 && (
                                        <div className="pt-4 space-y-3">
                                            {searchResults.map(org => (
                                                <div
                                                    key={org.id}
                                                    onClick={() => navigate(`/organization/${org.id}`)}
                                                    className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{org.name}</div>
                                                            <div className="text-[10px] text-osia-neutral-500">{org.industry}</div>
                                                        </div>
                                                        <ChevronRight size={14} className="text-osia-neutral-600" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </section>

                        <section>
                            <Card className="p-6 border-osia-teal-500/20 bg-osia-teal-500/[0.03]">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-osia-teal-400 mb-3 flex items-center gap-2">
                                    <Briefcase size={14} />
                                    Recruitment Mode
                                </h3>
                                <p className="text-xs text-osia-neutral-400 leading-relaxed mb-4">
                                    Enable Recruiter visibility in your privacy settings to be discoverable by potential organization matches based on your Blueprint.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-osia-teal-500/30 text-osia-teal-400 hover:bg-osia-teal-500/10"
                                    onClick={() => navigate('/privacy')}
                                >
                                    Manage Privacy
                                </Button>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
