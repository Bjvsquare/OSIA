import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
    Building2, Search, ArrowRight, ArrowLeft, CheckCircle,
    Users, Shield, Eye, BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';

interface Organization {
    id: string;
    name: string;
    type: string;
    industry: string;
    size: string;
    description?: string;
}

type Step = 'search' | 'consent' | 'confirm';

const ROLES = [
    { value: 'employee', label: 'Employee', desc: 'Standard team member' },
    { value: 'manager', label: 'Manager', desc: 'Team or department lead' },
    { value: 'contractor', label: 'Contractor', desc: 'External consultant' }
];

export function JoinOrganizationFlow() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('search');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Details
    const [role, setRole] = useState('employee');
    const [department, setDepartment] = useState('');
    const [title, setTitle] = useState('');

    // Consent
    const [shareBlueprint, setShareBlueprint] = useState(true);
    const [shareStats, setShareStats] = useState(true);
    const [shareTrends, setShareTrends] = useState(false);
    const [recruitmentVisible, setRecruitmentVisible] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await api.searchOrganizations(searchQuery);

            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectOrg = (org: Organization) => {
        setSelectedOrg(org);
        setStep('consent');
    };

    const handleSubmit = async () => {
        if (!selectedOrg) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await api.joinOrganization(selectedOrg.id, {
                role,
                department,
                title,
                consent: {
                    shareBlueprint,
                    shareProtocolStats: shareStats,
                    shareGrowthTrends: shareTrends,
                    recruitmentVisible
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit join request');
            }

            setStep('confirm');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-osia-teal-500 to-osia-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-osia-teal-500/20">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                        Join Your Organization
                    </h1>
                    <p className="text-osia-neutral-400">
                        Connect your profile to your company
                    </p>
                </div>

                <Card className="p-8 border-white/5 bg-osia-deep-900/60 backdrop-blur-3xl">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Search */}
                        {step === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <Label>Search for your organization</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Company name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="bg-white/5 border-white/10 flex-1"
                                        />
                                        <Button
                                            onClick={handleSearch}
                                            disabled={isSearching}
                                            className="bg-osia-teal-600"
                                        >
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Results */}
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {searchResults.length === 0 && searchQuery && !isSearching && (
                                        <div className="text-center py-8 text-osia-neutral-500">
                                            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p>No organizations found matching "{searchQuery}"</p>
                                            <p className="text-sm mt-2">
                                                Can't find your org?{' '}
                                                <a href="/signup/organization" className="text-osia-teal-400 hover:underline">
                                                    Register it here
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    {searchResults.map(org => (
                                        <button
                                            key={org.id}
                                            onClick={() => handleSelectOrg(org)}
                                            className="w-full p-4 rounded-xl border bg-white/5 border-white/10 text-left hover:border-osia-teal-500/50 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-osia-teal-500/20 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-osia-teal-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-white">{org.name}</h3>
                                                    <p className="text-sm text-osia-neutral-500">
                                                        {org.industry} • {org.size}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-osia-neutral-600" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => navigate('/get-started')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Consent & Details */}
                        {step === 'consent' && selectedOrg && (
                            <motion.div
                                key="consent"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold text-white">Joining {selectedOrg.name}</h2>
                                    <p className="text-sm text-osia-neutral-400">Configure your profile and data sharing</p>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label>Your Role</Label>
                                    <div className="space-y-2">
                                        {ROLES.map(r => (
                                            <button
                                                key={r.value}
                                                onClick={() => setRole(r.value)}
                                                className={`w-full p-3 rounded-xl border text-left transition-colors ${role === r.value
                                                    ? 'bg-osia-teal-500/20 border-osia-teal-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between">
                                                    <span className="font-medium">{r.label}</span>
                                                    <span className="text-osia-neutral-500 text-sm">{r.desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input
                                            placeholder="Engineering..."
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input
                                            placeholder="Senior Developer..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>

                                {/* Data Consent */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-osia-teal-400" />
                                        <Label className="text-osia-teal-400">Data Sharing Consent</Label>
                                    </div>

                                    <ConsentToggle
                                        icon={Eye}
                                        label="Share Blueprint"
                                        description="Allow organization to view your trait profile"
                                        checked={shareBlueprint}
                                        onChange={setShareBlueprint}
                                    />

                                    <ConsentToggle
                                        icon={BarChart3}
                                        label="Share Protocol Stats"
                                        description="Share your protocol completion metrics"
                                        checked={shareStats}
                                        onChange={setShareStats}
                                    />

                                    <ConsentToggle
                                        icon={TrendingUp}
                                        label="Share Growth Trends"
                                        description="Allow viewing your recalibration history"
                                        checked={shareTrends}
                                        onChange={setShareTrends}
                                    />

                                    <ConsentToggle
                                        icon={Users}
                                        label="Recruitment Visibility"
                                        description="Appear in recruitment candidate searches"
                                        checked={recruitmentVisible}
                                        onChange={setRecruitmentVisible}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => setStep('search')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-osia-teal-600 to-osia-teal-700"
                                    >
                                        {isLoading ? 'Submitting...' : 'Request to Join'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 'confirm' && selectedOrg && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
                                <p className="text-osia-neutral-400 mb-6">
                                    Your request to join <strong className="text-white">{selectedOrg.name}</strong> has been sent to their administrators.
                                </p>

                                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                                    <p className="text-sm text-osia-neutral-500 mb-2">What happens next:</p>
                                    <ul className="text-sm text-osia-neutral-300 space-y-1">
                                        <li>• An administrator will review your request</li>
                                        <li>• They may verify your employment</li>
                                        <li>• You'll be notified when approved</li>
                                    </ul>
                                </div>

                                <Button onClick={() => navigate('/home')} className="bg-gradient-to-r from-osia-teal-600 to-osia-teal-700">
                                    Go to Dashboard
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}

// Reusable consent toggle component
function ConsentToggle({
    icon: Icon,
    label,
    description,
    checked,
    onChange
}: {
    icon: any;
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${checked
                ? 'bg-osia-teal-500/10 border-osia-teal-500/50'
                : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${checked ? 'bg-osia-teal-500/20' : 'bg-white/10'
                }`}>
                <Icon className={`w-5 h-5 ${checked ? 'text-osia-teal-400' : 'text-osia-neutral-500'}`} />
            </div>
            <div className="flex-1">
                <p className={`font-medium ${checked ? 'text-white' : 'text-osia-neutral-300'}`}>{label}</p>
                <p className="text-xs text-osia-neutral-500">{description}</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${checked ? 'bg-osia-teal-500 justify-end' : 'bg-white/20 justify-start'
                }`}>
                <div className="w-4 h-4 mx-1 rounded-full bg-white" />
            </div>
        </button>
    );
}
