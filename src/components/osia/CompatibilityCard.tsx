import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';

interface CompatibilityScore {
    userId1: string;
    userId2: string;
    overallScore: number;
    patternAlignment: number;
    themeResonance: number;
    claimComplementarity: number;
    breakdown: { category: string; score: number; details: string }[];
}

interface CompatibilityCardProps {
    targetUserId: string;
    targetName?: string;
    targetAvatar?: string;
    showDetails?: boolean;
    onAnalyze?: () => void;
}

export function CompatibilityCard({
    targetUserId,
    targetName = 'User',
    targetAvatar,
    showDetails = false,
    onAnalyze
}: CompatibilityCardProps) {
    const { auth } = useAuth();
    const [score, setScore] = useState<CompatibilityScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchScore();
    }, [targetUserId]);

    const fetchScore = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = auth.token;
            const res = await fetch(`/api/compatibility/${targetUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 404) {
                    setError('No OSIA data available');
                } else {
                    throw new Error('Failed to fetch');
                }
                return;
            }
            const data = await res.json();
            setScore(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 80) return '#22c55e';
        if (s >= 60) return '#3b82f6';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (s: number) => {
        if (s >= 80) return 'Excellent';
        if (s >= 60) return 'Good';
        if (s >= 40) return 'Moderate';
        return 'Low';
    };

    return (
        <div className="compatibility-card">
            <style>{`
                .compatibility-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 1.25rem;
                    transition: all 0.3s;
                }
                
                .compatibility-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(138,110,220,0.3);
                }
                
                .compat-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .compat-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #8a6edc, #6ee7dc);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: 600;
                    font-size: 1.2rem;
                }
                
                .compat-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                
                .compat-info {
                    flex: 1;
                }
                
                .compat-name {
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 0.25rem;
                }
                
                .compat-status {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5);
                }
                
                .compat-score {
                    text-align: center;
                    min-width: 80px;
                }
                
                .score-circle {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    font-size: 1.25rem;
                    font-weight: 700;
                    transition: all 0.3s;
                }
                
                .score-label {
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                    opacity: 0.7;
                }
                
                .compat-details {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                }
                
                .detail-label {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.9rem;
                }
                
                .detail-bar {
                    flex: 1;
                    margin: 0 1rem;
                    height: 6px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .detail-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.5s ease-out;
                }
                
                .detail-value {
                    font-weight: 600;
                    min-width: 40px;
                    text-align: right;
                }
                
                .compat-actions {
                    margin-top: 1rem;
                    display: flex;
                    gap: 0.75rem;
                }
                
                .compat-btn {
                    flex: 1;
                    padding: 0.6rem 1rem;
                    border: 1px solid rgba(255,255,255,0.2);
                    background: transparent;
                    color: #fff;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                
                .compat-btn:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .compat-btn.primary {
                    background: linear-gradient(135deg, #8a6edc, #6ee7dc);
                    border: none;
                }
                
                .compat-btn.primary:hover {
                    transform: scale(1.02);
                }
                
                .loading-skeleton {
                    background: linear-gradient(90deg, 
                        rgba(255,255,255,0.05) 0%, 
                        rgba(255,255,255,0.1) 50%, 
                        rgba(255,255,255,0.05) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }
                
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                
                .no-data {
                    text-align: center;
                    color: rgba(255,255,255,0.5);
                    padding: 1rem;
                }
            `}</style>

            <div className="compat-header">
                <div className="compat-avatar">
                    {targetAvatar ? (
                        <img src={targetAvatar} alt={targetName} />
                    ) : (
                        targetName.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="compat-info">
                    <div className="compat-name">{targetName}</div>
                    <div className="compat-status">
                        {loading ? 'Calculating...' : error ? 'No data' : 'Compatibility analyzed'}
                    </div>
                </div>
                <div className="compat-score">
                    {loading ? (
                        <div className="score-circle loading-skeleton" style={{ width: 56, height: 56 }} />
                    ) : score ? (
                        <>
                            <div
                                className="score-circle"
                                style={{
                                    background: `rgba(${getScoreColor(score.overallScore).slice(1).match(/.{2}/g)?.map(x => parseInt(x, 16)).join(',')}, 0.2)`,
                                    color: getScoreColor(score.overallScore),
                                    border: `2px solid ${getScoreColor(score.overallScore)}`
                                }}
                            >
                                {score.overallScore}
                            </div>
                            <div className="score-label" style={{ color: getScoreColor(score.overallScore) }}>
                                {getScoreLabel(score.overallScore)}
                            </div>
                        </>
                    ) : (
                        <div className="score-circle" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                            —
                        </div>
                    )}
                </div>
            </div>

            {score && showDetails && expanded && (
                <div className="compat-details">
                    {score.breakdown.map((b, i) => (
                        <div key={i} className="detail-row">
                            <span className="detail-label">{b.category}</span>
                            <div className="detail-bar">
                                <div
                                    className="detail-fill"
                                    style={{
                                        width: `${b.score}%`,
                                        background: getScoreColor(b.score)
                                    }}
                                />
                            </div>
                            <span className="detail-value" style={{ color: getScoreColor(b.score) }}>
                                {b.score}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && score && (
                <div className="compat-actions">
                    {showDetails && (
                        <button
                            className="compat-btn"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? 'Hide Details' : 'View Details'}
                        </button>
                    )}
                    {onAnalyze && (
                        <button className="compat-btn primary" onClick={onAnalyze}>
                            Deep Analysis
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="no-data">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}

export default CompatibilityCard;
