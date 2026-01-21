import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface PatternInterpretation {
    patternName: string;
    interpretation: string;
}

interface RelationalPractice {
    practice: string;
    duration: string;
    outcome: string;
}

interface ConnectorInsight {
    relationshipType: string;
    displayName: string;
    interpretationFocus: string;
    primaryPatterns: PatternInterpretation[];
    suggestedPractice?: RelationalPractice;
}

interface RelationalConnectorsProfile {
    userId: string;
    generatedAt: string;
    connectorInsights: ConnectorInsight[];
    primaryRelationshipFocus?: string;
}

const RELATIONSHIP_ICONS: Record<string, string> = {
    spouse_partner: '💑',
    parent_child: '👨‍👧',
    family_member: '👪',
    friend: '👫',
    colleague_team: '👥',
    mentor_student: '👨‍🏫'
};

export function ConnectorsPage() {
    const [profile, setProfile] = useState<RelationalConnectorsProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConnectors = async () => {
            try {
                const data = await api.getRelationalConnectors();
                setProfile(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConnectors();
    }, []);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-osia-teal-500/30 border-t-osia-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="text-osia-neutral-400 text-sm">Loading connectors...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        const isNoData = error?.includes('No snapshot found') || error?.includes('No output found') || error?.includes('No connectors found');

        const handleRegenerate = async () => {
            setLoading(true);
            setError(null);
            try {
                await api.regenerateOSIA();
                const data = await api.getRelationalConnectors();
                setProfile(data);
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
                        {isNoData ? 'Connectors Not Yet Generated' : 'Connectors Not Ready'}
                    </h2>
                    <p className="text-osia-neutral-400 text-sm">
                        {isNoData
                            ? 'Your Relational Connectors can be generated from your profile data. Click below to generate them now.'
                            : error || 'Complete more of your profile to generate relational insights.'}
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

    const activeInsight = profile.connectorInsights[activeTab];

    return (
        <div className="min-h-full text-white relative pb-12">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-osia-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-osia-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-2 mb-8 relative z-10">
                <span className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.6em] text-glow block">
                    Module 3
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Relational Connectors<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-xs font-medium max-w-xl mx-auto opacity-70">
                    How your patterns show up across relationship types
                </p>
            </div>

            {/* Relationship Type Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {profile.connectorInsights.map((insight, idx) => (
                    <button
                        key={insight.relationshipType}
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === idx
                            ? 'bg-osia-teal-500 text-white'
                            : 'bg-white/5 text-osia-neutral-400 hover:bg-white/10'
                            }`}
                    >
                        <span className="text-lg">{RELATIONSHIP_ICONS[insight.relationshipType] || '🤝'}</span>
                        {insight.displayName}
                    </button>
                ))}
            </div>

            {/* Active Connector Content */}
            {activeInsight && (
                <Card className="p-8 max-w-4xl mx-auto border-osia-teal-500/20 bg-osia-deep-800/60 relative z-10">
                    {/* Focus */}
                    <div className="mb-6">
                        <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-2 font-bold">
                            Interpretation Focus
                        </div>
                        <p className="text-lg text-osia-teal-400 font-medium capitalize">
                            {activeInsight.interpretationFocus}
                        </p>
                    </div>

                    {/* Pattern Interpretations */}
                    {activeInsight.primaryPatterns.length > 0 && (
                        <div className="mb-6">
                            <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-3 font-bold">
                                How Your Patterns Show Up
                            </div>
                            <div className="space-y-4">
                                {activeInsight.primaryPatterns.map((pattern, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-2">{pattern.patternName}</h4>
                                        <p className="text-sm text-osia-neutral-300 leading-relaxed">
                                            {pattern.interpretation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Relational Practice */}
                    {activeInsight.suggestedPractice && (
                        <div className="bg-osia-teal-500/10 rounded-lg p-5 border border-osia-teal-500/20">
                            <div className="text-[9px] text-osia-teal-400 uppercase tracking-widest mb-2 font-bold">
                                ✨ One Relational Practice ({activeInsight.suggestedPractice.duration})
                            </div>
                            <p className="text-white font-medium mb-3">
                                {activeInsight.suggestedPractice.practice}
                            </p>
                            <p className="text-xs text-osia-neutral-400 italic">
                                Expected: {activeInsight.suggestedPractice.outcome}
                            </p>
                        </div>
                    )}
                </Card>
            )}

            {/* Navigation Footer */}
            <div className="mt-8 flex justify-center gap-4">
                <Button onClick={() => navigate('/insights')} variant="outline" size="lg">
                    ← View Insights Hub
                </Button>
                <Button onClick={() => navigate('/')} variant="primary" size="lg">
                    Return Home
                </Button>
            </div>
        </div>
    );
}
