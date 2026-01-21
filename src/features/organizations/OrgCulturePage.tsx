import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

interface OrgCultureProfile {
    orgId: string;
    orgName: string;
    memberCount: number;
    aggregatedAt: string;
    cultureTraits: { name: string; prevalence: number; description: string }[];
    departmentBreakdowns: { department: string; memberCount: number; dominantPatterns: string[]; alignmentWithOrg: number }[];
    culturalStrengths: string[];
    culturalBlindSpots: string[];
    alignmentScore: number;
    diversityIndex: number;
    engagementPotential: number;
}

interface AIOrgReport {
    orgId: string;
    generatedAt: string;
    executiveSummary: string;
    cultureArchetype: string;
    coreValues: string[];
    hiddenValues: string[];
    strengthsAnalysis: string;
    risksAnalysis: string;
    recommendations: { title: string; description: string; priority: string }[];
}

export function OrgCulturePage({ hideHeader = false }: { hideHeader?: boolean }) {
    const { orgId } = useParams<{ orgId: string }>();
    const [profile, setProfile] = useState<OrgCultureProfile | null>(null);
    const [aiReport, setAiReport] = useState<AIOrgReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'ai'>('overview');

    useEffect(() => {
        fetchCulture();
    }, [orgId]);

    const fetchCulture = async () => {
        setLoading(true);
        try {
            const data = await api.getOrgCulture(orgId!);
            setProfile(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const generateAIReport = async () => {
        setGenerating(true);
        try {
            const res = await api.analyzeOrgCulture(orgId!);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to generate report');
            }
            const data = await res.json();
            setAiReport(data);
            setActiveTab('ai');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="org-culture-page loading">
                <div className="loading-orb" />
                <p>Mapping organizational culture...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="org-culture-page error">
                <Card className="error-card">
                    <h2>Unable to Load</h2>
                    <p>{error || 'No culture data available'}</p>
                    <Button onClick={fetchCulture}>Retry</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="org-culture-page">
            <style>{`
                .org-culture-page {
                    min-height: 100vh;
                    padding: 2rem;
                    background: linear-gradient(150deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    color: #fff;
                }
                
                .org-culture-page.loading, .org-culture-page.error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                }
                
                .loading-orb {
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%);
                    border-radius: 50%;
                    animation: pulse-orb 2s ease-in-out infinite;
                }
                
                @keyframes pulse-orb {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                
                .org-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                
                .org-header h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #a855f7, #3b82f6, #22d3d1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 0.5rem;
                }
                
                .org-header .meta {
                    color: rgba(255,255,255,0.5);
                }
                
                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                
                .metric-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .metric-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #a855f7, #3b82f6);
                }
                
                .metric-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #a855f7;
                }
                
                .metric-label {
                    color: rgba(255,255,255,0.6);
                    margin-top: 0.5rem;
                }
                
                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 0.5rem;
                }
                
                .tab {
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    font-size: 1rem;
                    border-radius: 8px 8px 0 0;
                    transition: all 0.2s;
                }
                
                .tab:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.05);
                }
                
                .tab.active {
                    color: #a855f7;
                    background: rgba(168,85,247,0.1);
                    border-bottom: 2px solid #a855f7;
                }
                
                .culture-traits {
                    display: grid;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .trait-card {
                    background: rgba(168,85,247,0.1);
                    border: 1px solid rgba(168,85,247,0.3);
                    border-radius: 12px;
                    padding: 1.25rem;
                }
                
                .trait-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .trait-name {
                    font-weight: 600;
                    color: #c084fc;
                }
                
                .trait-prevalence {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                }
                
                .strengths-blindspots {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                
                .sb-card {
                    background: rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 1.5rem;
                }
                
                .sb-card.strengths { border-left: 4px solid #22c55e; }
                .sb-card.blindspots { border-left: 4px solid #f59e0b; }
                
                .sb-card h3 {
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .sb-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                
                .sb-list li {
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.8);
                }
                
                .departments-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                
                .dept-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                }
                
                .dept-card h3 {
                    color: #3b82f6;
                    margin-bottom: 0.5rem;
                }
                
                .dept-meta {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                
                .alignment-bar {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 1rem;
                }
                
                .alignment-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #22d3d1);
                    border-radius: 4px;
                }
                
                .ai-panel {
                    background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1));
                    border: 1px solid rgba(168,85,247,0.3);
                    border-radius: 20px;
                    padding: 2rem;
                }
                
                .ai-panel.empty {
                    text-align: center;
                }
                
                .archetype-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    padding: 0.75rem 1.5rem;
                    border-radius: 30px;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }
                
                .values-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin: 1.5rem 0;
                }
                
                .values-box {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 1.25rem;
                }
                
                .values-box h4 {
                    margin-bottom: 0.75rem;
                    color: #c084fc;
                }
                
                .values-box.hidden h4 {
                    color: #f59e0b;
                }
                
                .generate-btn {
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    border: none;
                    color: #fff;
                    padding: 1rem 2.5rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .generate-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 10px 40px rgba(168,85,247,0.4);
                }
                
                .generate-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .credit-note {
                    margin-top: 0.75rem;
                    color: rgba(255,255,255,0.4);
                    font-size: 0.9rem;
                }
                
                @media (max-width: 768px) {
                    .metrics-row,
                    .strengths-blindspots,
                    .values-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {!hideHeader && (
                <header className="org-header">
                    <h1>{profile.orgName}</h1>
                    <p className="meta">{profile.memberCount} members analyzed • {new Date(profile.aggregatedAt).toLocaleDateString()}</p>
                </header>
            )}

            <div className="metrics-row">
                <div className="metric-card">
                    <div className="metric-value">{profile.alignmentScore}%</div>
                    <div className="metric-label">Culture Alignment</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value">{profile.diversityIndex}%</div>
                    <div className="metric-label">Diversity Index</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value">{profile.engagementPotential}%</div>
                    <div className="metric-label">Engagement Potential</div>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview
                </button>
                <button className={`tab ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
                    Departments
                </button>
                <button className={`tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                    AI Insights
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <section className="culture-traits">
                        <h2>Culture Traits</h2>
                        {profile.cultureTraits.map((t, i) => (
                            <div key={i} className="trait-card">
                                <div className="trait-header">
                                    <span className="trait-name">{t.name}</span>
                                    <span className="trait-prevalence">{Math.round(t.prevalence * 100)}%</span>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</p>
                            </div>
                        ))}
                    </section>

                    <div className="strengths-blindspots">
                        <div className="sb-card strengths">
                            <h3>💪 Cultural Strengths</h3>
                            <ul className="sb-list">
                                {profile.culturalStrengths.map((s, i) => <li key={i}>{s}</li>)}
                                {profile.culturalStrengths.length === 0 && <li>Analyzing...</li>}
                            </ul>
                        </div>
                        <div className="sb-card blindspots">
                            <h3>👁️ Blind Spots</h3>
                            <ul className="sb-list">
                                {profile.culturalBlindSpots.map((b, i) => <li key={i}>{b}</li>)}
                                {profile.culturalBlindSpots.length === 0 && <li>None identified</li>}
                            </ul>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'departments' && (
                <div className="departments-grid">
                    {profile.departmentBreakdowns.map((d, i) => (
                        <div key={i} className="dept-card">
                            <h3>{d.department}</h3>
                            <p className="dept-meta">{d.memberCount} members</p>
                            <p><strong>Dominant Patterns:</strong></p>
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{d.dominantPatterns.join(', ') || 'None identified'}</p>
                            <div className="alignment-bar">
                                <div className="alignment-fill" style={{ width: `${d.alignmentWithOrg}%` }} />
                            </div>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                {d.alignmentWithOrg}% alignment with org culture
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'ai' && (
                <div className={`ai-panel ${aiReport ? '' : 'empty'}`}>
                    {aiReport ? (
                        <>
                            <div className="archetype-badge">{aiReport.cultureArchetype}</div>
                            <p style={{ fontSize: '1.15rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                                {aiReport.executiveSummary}
                            </p>

                            <div className="values-grid">
                                <div className="values-box">
                                    <h4>Core Values</h4>
                                    <ul className="sb-list">
                                        {aiReport.coreValues.map((v, i) => <li key={i}>{v}</li>)}
                                    </ul>
                                </div>
                                <div className="values-box hidden">
                                    <h4>Hidden Values</h4>
                                    <ul className="sb-list">
                                        {aiReport.hiddenValues.map((v, i) => <li key={i}>{v}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Recommendations</h3>
                            {aiReport.recommendations.map((r, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    borderLeft: `4px solid ${r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f59e0b' : '#22c55e'}`
                                }}>
                                    <h4>{r.title}</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>{r.description}</p>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <h2>✨ AI Culture Analysis</h2>
                            <p style={{ margin: '1.5rem 0', color: 'rgba(255,255,255,0.7)' }}>
                                Unlock deep insights into your organization's cultural DNA, hidden values, and strategic recommendations.
                            </p>
                            <button
                                className="generate-btn"
                                onClick={generateAIReport}
                                disabled={generating}
                            >
                                {generating ? 'Analyzing Culture...' : 'Generate AI Report'}
                            </button>
                            <p className="credit-note">Costs 15 credits</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default OrgCulturePage;
