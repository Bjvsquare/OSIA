import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface DomainInsight {
    domain: string;
    coreTheme: string;
    primaryChallenge: string;
    oneThing: string;
    appliedOutcome: string;
}

interface CoreInsightsHub {
    userId: string;
    generatedAt: string;
    domainInsights: DomainInsight[];
    primaryFocusDomain: string;
    coverageScore: number;
}

const DOMAIN_ICONS: Record<string, string> = {
    spiritual: '🕯️',
    physical_health: '💪',
    personal: '🪞',
    relationships: '❤️',
    career: '📈',
    business: '🏢',
    finances: '💰'
};

const DOMAIN_LABELS: Record<string, string> = {
    spiritual: 'Spiritual & Purpose',
    physical_health: 'Physical & Health',
    personal: 'Personal Development',
    relationships: 'Relationships',
    career: 'Career',
    business: 'Business & Leadership',
    finances: 'Finances'
};

export function InsightsHubPage() {
    const [hub, setHub] = useState<CoreInsightsHub | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHub = async () => {
            try {
                const data = await api.getCoreInsightsHub('json');
                setHub(data);
                // Auto-expand primary domain
                if (data.primaryFocusDomain) {
                    setExpandedDomain(data.primaryFocusDomain);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHub();
    }, []);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-osia-teal-500/30 border-t-osia-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="text-osia-neutral-400 text-sm">Loading your insights...</p>
                </div>
            </div>
        );
    }

    if (error || !hub) {
        const isNoData = error?.includes('No insights found') || error?.includes('No output found');

        const handleRegenerate = async () => {
            setLoading(true);
            setError(null);
            try {
                await api.regenerateOSIA();
                const data = await api.getCoreInsightsHub('json');
                setHub(data);
                if (data.primaryFocusDomain) {
                    setExpandedDomain(data.primaryFocusDomain);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="min-h-full flex items-center justify-center">
                <Card className="p-8 max-w-md text-center space-y-4">
                    <h2 className="text-xl font-bold text-white">
                        {isNoData ? 'Insights Not Yet Generated' : 'Insights Not Ready'}
                    </h2>
                    <p className="text-osia-neutral-400 text-sm">
                        {isNoData
                            ? 'Your Core Insights can be generated from your profile data. Click below to generate them now.'
                            : error || 'Complete more of your profile to generate insights.'}
                    </p>
                    <div className="flex flex-col gap-2">
                        {isNoData && (
                            <Button onClick={handleRegenerate} variant="primary">
                                ✨ Generate Now
                            </Button>
                        )}
                        <Button onClick={() => navigate('/')} variant={isNoData ? "outline" : "primary"}>
                            Return Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-full text-white relative pb-12">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-osia-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-osia-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-2 mb-8 relative z-10">
                <span className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.6em] text-glow block">
                    Module 2
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Core Insights Hub<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-xs font-medium max-w-xl mx-auto opacity-70">
                    "The One Thing" for each life domain
                </p>
            </div>

            {/* Coverage Score */}
            <div className="flex justify-center mb-8">
                <div className="text-center px-8 py-4 bg-osia-teal-500/10 rounded-xl border border-osia-teal-500/20">
                    <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-1 font-bold">Coverage</div>
                    <div className="text-2xl font-black text-osia-teal-400">
                        {Math.round(hub.coverageScore * 100)}%
                    </div>
                </div>
            </div>

            {/* Domain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto relative z-10">
                {hub.domainInsights.map((insight) => {
                    const isExpanded = expandedDomain === insight.domain;
                    const isPrimary = hub.primaryFocusDomain === insight.domain;

                    return (
                        <Card
                            key={insight.domain}
                            className={`p-5 cursor-pointer transition-all duration-300 ${isPrimary ? 'border-osia-teal-500/50 ring-2 ring-osia-teal-500/20' : 'border-white/10'
                                } ${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''} hover:border-osia-teal-500/30`}
                            onClick={() => setExpandedDomain(isExpanded ? null : insight.domain)}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{DOMAIN_ICONS[insight.domain] || '📊'}</span>
                                    <h3 className="text-sm font-bold text-white">
                                        {DOMAIN_LABELS[insight.domain] || insight.domain}
                                    </h3>
                                </div>
                                {isPrimary && (
                                    <span className="text-[9px] font-bold uppercase px-2 py-1 bg-osia-teal-500/20 text-osia-teal-400 rounded">
                                        Primary Focus
                                    </span>
                                )}
                            </div>

                            {/* Core Theme */}
                            <p className="text-xs text-osia-neutral-300 leading-relaxed mb-3"
                                dangerouslySetInnerHTML={{
                                    __html: insight.coreTheme.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                                }}
                            />

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                                    {/* Primary Challenge */}
                                    <div>
                                        <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-1 font-bold">
                                            Primary Challenge
                                        </div>
                                        <p className="text-sm text-osia-neutral-300">{insight.primaryChallenge}</p>
                                    </div>

                                    {/* The One Thing */}
                                    {insight.oneThing && (
                                        <div className="bg-osia-teal-500/10 rounded-lg p-4 border border-osia-teal-500/20">
                                            <div className="text-[9px] text-osia-teal-400 uppercase tracking-widest mb-2 font-bold">
                                                ✨ The One Thing
                                            </div>
                                            <p className="text-sm text-white font-medium"
                                                dangerouslySetInnerHTML={{
                                                    __html: insight.oneThing.replace(/\*\*(.+?)\*\*/g, '<strong class="text-osia-teal-400">$1</strong>')
                                                }}
                                            />
                                            {insight.appliedOutcome && (
                                                <p className="text-xs text-osia-neutral-400 mt-2 italic">
                                                    Expected: {insight.appliedOutcome}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expand indicator */}
                            <div className="mt-3 text-center">
                                <span className="text-[10px] text-osia-neutral-500">
                                    {isExpanded ? '▲ Collapse' : '▼ Expand'}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 flex justify-center gap-4">
                <Button onClick={() => navigate('/thesis')} variant="outline" size="lg">
                    ← View Thesis
                </Button>
                <Button onClick={() => navigate('/connectors')} variant="primary" size="lg">
                    View Connectors →
                </Button>
            </div>
        </div>
    );
}
