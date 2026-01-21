import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
    Building2, Search, ArrowRight, Plus, Users,
    MapPin, Briefcase, ChevronRight, AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';

interface Organization {
    id: string;
    name: string;
    industry: string;
    size: string;
    headquarters?: string;
    description?: string;
}

export function OrganizationSearchPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Organization[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                performSearch();
            } else {
                setSearchResults([]);
                setHasSearched(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const res = await api.searchOrganizations(searchQuery);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
            setHasSearched(true);
        }
    };

    const handleJoinOrg = (org: Organization) => {
        navigate(`/signup/join-organization?org=${org.id}`);
    };

    const handleRegisterNew = () => {
        navigate('/signup/organization/register');
    };

    const getSizeLabel = (size: string) => {
        const sizes: Record<string, string> = {
            startup: '1-10 employees',
            small: '11-50 employees',
            medium: '51-200 employees',
            large: '201-1000 employees',
            enterprise: '1000+ employees'
        };
        return sizes[size] || size;
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                        Find Your Organization
                    </h1>
                    <p className="text-osia-neutral-400">
                        Search for your company to join, or register a new organization
                    </p>
                </div>

                <Card className="p-8 border-white/5 bg-osia-deep-900/60 backdrop-blur-3xl">
                    {/* Search Input */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-osia-neutral-500" />
                        <Input
                            placeholder="Search by company name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 py-4 text-lg bg-white/5 border-white/10 focus:border-purple-500"
                        />
                        {isSearching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-3 mb-6">
                            <p className="text-sm text-osia-neutral-400 mb-3">
                                Found {searchResults.length} organization{searchResults.length !== 1 ? 's' : ''}
                            </p>
                            {searchResults.map((org) => (
                                <motion.div
                                    key={org.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group cursor-pointer"
                                    onClick={() => handleJoinOrg(org)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                                                {org.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-osia-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3" />
                                                    {org.industry}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {getSizeLabel(org.size)}
                                                </span>
                                                {org.headquarters && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {org.headquarters}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-osia-neutral-500 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* No Results Message */}
                    {hasSearched && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                        <div className="text-center py-8 mb-6">
                            <AlertCircle className="w-12 h-12 text-osia-neutral-600 mx-auto mb-4" />
                            <p className="text-osia-neutral-400 mb-2">
                                No organizations found matching "{searchQuery}"
                            </p>
                            <p className="text-sm text-osia-neutral-500">
                                You can register your organization below
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-osia-deep-900 text-osia-neutral-500">
                                Can't find your organization?
                            </span>
                        </div>
                    </div>

                    {/* Register New Organization */}
                    <Button
                        onClick={handleRegisterNew}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Register Your Organization
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    {/* Back Link */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/get-started')}
                            className="text-sm text-osia-neutral-500 hover:text-white transition-colors"
                        >
                            ← Back to account options
                        </button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
