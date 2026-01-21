import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';

interface Nudge {
    id: string;
    text: string;
    context: string;
    priority: 'low' | 'medium' | 'high';
    actionSuggestion?: string;
    dismissed?: boolean;
    completed?: boolean;
}

interface NudgeCardProps {
    className?: string;
    showRefresh?: boolean;
}

export function NudgeCard({ className = '', showRefresh = true }: NudgeCardProps) {
    const { auth } = useAuth();
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetchNudges();
    }, []);

    const fetchNudges = async () => {
        setLoading(true);
        try {
            const token = auth.token;
            const res = await fetch('/api/nudges', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNudges(data.nudges || []);
            }
        } catch (e) {
            console.error('Failed to fetch nudges:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (nudgeId: string) => {
        try {
            const token = auth.token;
            await fetch(`/api/nudges/${nudgeId}/dismiss`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNudges(prev => prev.filter(n => n.id !== nudgeId));
            if (currentIndex >= nudges.length - 1) {
                setCurrentIndex(Math.max(0, currentIndex - 1));
            }
        } catch (e) {
            console.error('Failed to dismiss nudge:', e);
        }
    };

    const handleComplete = async (nudgeId: string) => {
        try {
            const token = auth.token;
            await fetch(`/api/nudges/${nudgeId}/complete`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNudges(prev => prev.filter(n => n.id !== nudgeId));
            if (currentIndex >= nudges.length - 1) {
                setCurrentIndex(Math.max(0, currentIndex - 1));
            }
        } catch (e) {
            console.error('Failed to complete nudge:', e);
        }
    };

    const currentNudge = nudges[currentIndex];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', accent: '#a855f7' };
            case 'medium': return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', accent: '#3b82f6' };
            default: return { bg: 'rgba(110, 231, 183, 0.1)', border: 'rgba(110, 231, 183, 0.3)', accent: '#6ee7b7' };
        }
    };

    if (loading) {
        return (
            <div className={`nudge-card loading ${className}`}>
                <style>{styles}</style>
                <div className="nudge-skeleton" />
            </div>
        );
    }

    if (nudges.length === 0) {
        return (
            <div className={`nudge-card empty ${className}`}>
                <style>{styles}</style>
                <p className="empty-message">✨ No nudges right now. Check back later!</p>
            </div>
        );
    }

    const colors = getPriorityColor(currentNudge.priority);

    return (
        <div
            className={`nudge-card ${className}`}
            style={{
                background: colors.bg,
                borderColor: colors.border
            }}
        >
            <style>{styles}</style>

            <div className="nudge-header">
                <span className="nudge-context" style={{ color: colors.accent }}>
                    {getContextIcon(currentNudge.context)} {currentNudge.context}
                </span>
                <span className="nudge-count">
                    {currentIndex + 1} / {nudges.length}
                </span>
            </div>

            <p className="nudge-text">{currentNudge.text}</p>

            {currentNudge.actionSuggestion && (
                <p className="nudge-action">
                    💡 {currentNudge.actionSuggestion}
                </p>
            )}

            <div className="nudge-actions">
                <button
                    className="nudge-btn dismiss"
                    onClick={() => handleDismiss(currentNudge.id)}
                >
                    Dismiss
                </button>
                <button
                    className="nudge-btn complete"
                    onClick={() => handleComplete(currentNudge.id)}
                    style={{ background: colors.accent }}
                >
                    ✓ Done
                </button>
            </div>

            {nudges.length > 1 && (
                <div className="nudge-nav">
                    <button
                        className="nav-btn"
                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                    >
                        ←
                    </button>
                    <div className="nav-dots">
                        {nudges.map((_, i) => (
                            <span
                                key={i}
                                className={`dot ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(i)}
                                style={i === currentIndex ? { background: colors.accent } : {}}
                            />
                        ))}
                    </div>
                    <button
                        className="nav-btn"
                        onClick={() => setCurrentIndex(i => Math.min(nudges.length - 1, i + 1))}
                        disabled={currentIndex === nudges.length - 1}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}

function getContextIcon(context: string): string {
    switch (context) {
        case 'morning': return '🌅';
        case 'work': return '💼';
        case 'relationship': return '💫';
        case 'stress': return '🧘';
        case 'growth': return '🌱';
        default: return '✨';
    }
}

const styles = `
    .nudge-card {
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 1.25rem;
        transition: all 0.3s;
    }
    
    .nudge-card.loading, .nudge-card.empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
    }
    
    .nudge-skeleton {
        width: 80%;
        height: 20px;
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
    
    .empty-message {
        color: rgba(255,255,255,0.5);
        font-style: italic;
    }
    
    .nudge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    
    .nudge-context {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .nudge-count {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.4);
    }
    
    .nudge-text {
        font-size: 1.05rem;
        line-height: 1.6;
        color: rgba(255,255,255,0.9);
        margin: 0 0 0.75rem 0;
    }
    
    .nudge-action {
        font-size: 0.9rem;
        color: rgba(255,255,255,0.6);
        margin: 0 0 1rem 0;
        padding-left: 0.5rem;
        border-left: 2px solid rgba(255,255,255,0.2);
    }
    
    .nudge-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .nudge-btn {
        flex: 1;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .nudge-btn.dismiss {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.6);
    }
    
    .nudge-btn.dismiss:hover {
        background: rgba(255,255,255,0.05);
        color: #fff;
    }
    
    .nudge-btn.complete {
        border: none;
        color: #fff;
    }
    
    .nudge-btn.complete:hover {
        transform: scale(1.02);
        filter: brightness(1.1);
    }
    
    .nudge-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .nav-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.6);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .nav-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.1);
        color: #fff;
    }
    
    .nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    
    .nav-dots {
        display: flex;
        gap: 6px;
    }
    
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .dot:hover {
        background: rgba(255,255,255,0.4);
    }
`;

export default NudgeCard;
