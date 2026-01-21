import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

// Types matching backend
interface TeamDynamicsProfile {
    teamId: string;
    teamName: string;
    memberCount: number;
    aggregatedAt: string;
    collectiveStrengths: { name: string; description: string; prevalence: number }[];
    potentialGaps: { area: string; description: string; severity: string; recommendation: string }[];
    memberContributions: { userId: string; uniqueStrengths: string[]; roleAlignment: number }[];
    cohesionScore: number;
    diversityScore: number;
    balanceScore: number;
}

interface AITeamReport {
    teamId: string;
    generatedAt: string;
    executiveSummary: string;
    teamPersonality: string;
    collectiveStrengths: string[];
    blindSpots: string[];
    teamDynamics: string;
    recommendations: { title: string; description: string; priority: string }[];
}

export function TeamDynamicsPage() {
    const { teamId } = useParams<{ teamId: string }>();
    const [profile, setProfile] = useState<TeamDynamicsProfile | null>(null);
    const [aiReport, setAiReport] = useState<AITeamReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDynamics();
    }, [teamId]);

    const fetchDynamics = async () => {
        setLoading(true);
        try {
            const data = await api.getTeamDynamics(teamId!);
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
            const res = await api.analyzeTeamDynamics(teamId!);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to generate report');
            }
            const data = await res.json();
            setAiReport(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="team-dynamics-page loading">
                <div className="loading-spinner" />
                <p>Analyzing team dynamics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="team-dynamics-page error">
                <Card className="error-card">
                    <h2>Unable to Load</h2>
                    <p>{error}</p>
                    <Button onClick={fetchDynamics}>Retry</Button>
                </Card>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="team-dynamics-page">
            <style>{`
                .team-dynamics-page {
                    min-height: 100vh;
                    padding: 2rem;
                    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%);
                    color: #fff;
                }
                
                .team-dynamics-page.loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }
                
                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 3px solid rgba(138, 110, 220, 0.3);
                    border-top-color: #8a6edc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .team-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }
                
                .team-header h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #8a6edc, #6ee7dc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 0.5rem;
                }
                
                .team-header .subtitle {
                    color: rgba(255,255,255,0.6);
                    font-size: 1.1rem;
                }
                
                .scores-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                
                .score-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                    text-align: center;
                    backdrop-filter: blur(10px);
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                
                .score-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(138,110,220,0.2);
                }
                
                .score-value {
                    font-size: 3rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #8a6edc, #6ee7dc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .score-label {
                    color: rgba(255,255,255,0.7);
                    margin-top: 0.5rem;
                }
                
                .section {
                    margin-bottom: 2.5rem;
                }
                
                .section h2 {
                    font-size: 1.5rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .section h2::before {
                    content: '';
                    width: 4px;
                    height: 24px;
                    background: linear-gradient(to bottom, #8a6edc, #6ee7dc);
                    border-radius: 2px;
                }
                
                .strengths-list {
                    display: grid;
                    gap: 1rem;
                }
                
                .strength-item {
                    background: rgba(110, 231, 183, 0.1);
                    border: 1px solid rgba(110, 231, 183, 0.3);
                    border-radius: 12px;
                    padding: 1.25rem;
                }
                
                .strength-item h3 {
                    color: #6ee7b7;
                    margin-bottom: 0.5rem;
                }
                
                .prevalence-bar {
                    height: 6px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                    margin-top: 0.75rem;
                    overflow: hidden;
                }
                
                .prevalence-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #6ee7b7, #34d399);
                    border-radius: 3px;
                }
                
                .gaps-list {
                    display: grid;
                    gap: 1rem;
                }
                
                .gap-item {
                    background: rgba(251, 146, 60, 0.1);
                    border: 1px solid rgba(251, 146, 60, 0.3);
                    border-radius: 12px;
                    padding: 1.25rem;
                }
                
                .gap-item.high {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                }
                
                .gap-item h3 {
                    color: #fb923c;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .gap-item.high h3 {
                    color: #ef4444;
                }
                
                .severity-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                
                .severity-badge.high { background: rgba(239,68,68,0.2); color: #ef4444; }
                .severity-badge.medium { background: rgba(251,146,60,0.2); color: #fb923c; }
                .severity-badge.low { background: rgba(250,204,21,0.2); color: #facc15; }
                
                .recommendation {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    font-style: italic;
                }
                
                .ai-section {
                    background: linear-gradient(135deg, rgba(138,110,220,0.1), rgba(110,231,220,0.1));
                    border: 1px solid rgba(138,110,220,0.3);
                    border-radius: 20px;
                    padding: 2rem;
                    text-align: center;
                }
                
                .ai-section h2 {
                    justify-content: center;
                }
                
                .ai-report {
                    text-align: left;
                }
                
                .ai-report .summary {
                    font-size: 1.2rem;
                    line-height: 1.8;
                    margin-bottom: 2rem;
                    color: rgba(255,255,255,0.9);
                }
                
                .ai-report .personality {
                    background: rgba(138,110,220,0.2);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .ai-report .personality h3 {
                    color: #8a6edc;
                    margin-bottom: 0.75rem;
                }
                
                .recommendations-list {
                    display: grid;
                    gap: 1rem;
                }
                
                .rec-item {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 1.25rem;
                    border-left: 4px solid #8a6edc;
                }
                
                .rec-item.high { border-left-color: #ef4444; }
                .rec-item.medium { border-left-color: #fb923c; }
                
                .generate-btn {
                    background: linear-gradient(135deg, #8a6edc, #6ee7dc);
                    border: none;
                    color: #fff;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .generate-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(138,110,220,0.4);
                }
                
                .generate-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .credit-note {
                    margin-top: 0.75rem;
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                }
                
                @media (max-width: 768px) {
                    .scores-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <header className="team-header">
                <h1>{profile.teamName}</h1>
                <p className="subtitle">{profile.memberCount} members • Updated {new Date(profile.aggregatedAt).toLocaleDateString()}</p>
            </header>

            <div className="scores-grid">
                <div className="score-card">
                    <div className="score-value">{profile.cohesionScore}</div>
                    <div className="score-label">Cohesion Score</div>
                </div>
                <div className="score-card">
                    <div className="score-value">{profile.diversityScore}</div>
                    <div className="score-label">Diversity Index</div>
                </div>
                <div className="score-card">
                    <div className="score-value">{profile.balanceScore}</div>
                    <div className="score-label">Balance Score</div>
                </div>
            </div>

            <section className="section">
                <h2>Collective Strengths</h2>
                <div className="strengths-list">
                    {profile.collectiveStrengths.map((s, i) => (
                        <div key={i} className="strength-item">
                            <h3>{s.name}</h3>
                            <p>{s.description}</p>
                            <div className="prevalence-bar">
                                <div className="prevalence-fill" style={{ width: `${s.prevalence * 100}%` }} />
                            </div>
                        </div>
                    ))}
                    {profile.collectiveStrengths.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No collective strengths identified yet. More member data needed.</p>
                    )}
                </div>
            </section>

            <section className="section">
                <h2>Potential Gaps</h2>
                <div className="gaps-list">
                    {profile.potentialGaps.map((g, i) => (
                        <div key={i} className={`gap-item ${g.severity}`}>
                            <h3>
                                {g.area}
                                <span className={`severity-badge ${g.severity}`}>{g.severity}</span>
                            </h3>
                            <p>{g.description}</p>
                            {g.recommendation && (
                                <p className="recommendation">💡 {g.recommendation}</p>
                            )}
                        </div>
                    ))}
                    {profile.potentialGaps.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No significant gaps identified. Great team composition!</p>
                    )}
                </div>
            </section>

            <section className="section ai-section">
                <h2>✨ AI-Powered Team Analysis</h2>

                {aiReport ? (
                    <div className="ai-report">
                        <p className="summary">{aiReport.executiveSummary}</p>

                        <div className="personality">
                            <h3>Team Personality</h3>
                            <p>{aiReport.teamPersonality}</p>
                        </div>

                        <h3 style={{ marginBottom: '1rem' }}>Recommendations</h3>
                        <div className="recommendations-list">
                            {aiReport.recommendations.map((r, i) => (
                                <div key={i} className={`rec-item ${r.priority}`}>
                                    <h4>{r.title}</h4>
                                    <p>{r.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                            Get deep AI insights into your team's dynamics, communication patterns, and growth opportunities.
                        </p>
                        <button
                            className="generate-btn"
                            onClick={generateAIReport}
                            disabled={generating}
                        >
                            {generating ? 'Generating...' : 'Generate AI Report'}
                        </button>
                        <p className="credit-note">Costs 10 credits</p>
                    </>
                )}
            </section>
        </div>
    );
}

export default TeamDynamicsPage;
