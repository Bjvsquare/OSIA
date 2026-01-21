import { useState } from 'react';
import { api } from '../../services/api';

interface ResonanceVoteProps {
    claimId: string;
    initialVote?: 'fits' | 'partial' | 'doesnt_fit' | null;
    onVoteChange?: (claimId: string, vote: 'fits' | 'partial' | 'doesnt_fit') => void;
    size?: 'sm' | 'md';
    showLabels?: boolean;
}

/**
 * Reusable resonance voting component for OSIA claims
 * Allows users to indicate how well a claim fits them
 */
export function ResonanceVote({
    claimId,
    initialVote = null,
    onVoteChange,
    size = 'md',
    showLabels = true
}: ResonanceVoteProps) {
    const [vote, setVote] = useState<'fits' | 'partial' | 'doesnt_fit' | null>(initialVote);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVote = async (newVote: 'fits' | 'partial' | 'doesnt_fit') => {
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            await api.submitClaimFeedback(claimId, newVote);
            setVote(newVote);
            onVoteChange?.(claimId, newVote);
        } catch (err: any) {
            setError('Failed to save');
            console.error('Vote error:', err);
        } finally {
            setLoading(false);
        }
    };

    const buttonClass = (type: 'fits' | 'partial' | 'doesnt_fit') => {
        const isActive = vote === type;
        const baseClass = size === 'sm'
            ? 'px-2 py-1 text-[9px]'
            : 'px-3 py-2 text-[10px]';

        const colors = {
            fits: isActive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-white/5 text-osia-neutral-400 border-transparent hover:bg-emerald-500/10 hover:text-emerald-400',
            partial: isActive
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-white/5 text-osia-neutral-400 border-transparent hover:bg-amber-500/10 hover:text-amber-400',
            doesnt_fit: isActive
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                : 'bg-white/5 text-osia-neutral-400 border-transparent hover:bg-rose-500/10 hover:text-rose-400'
        };

        return `${baseClass} ${colors[type]} font-black uppercase tracking-wider rounded-lg border transition-all duration-200 disabled:opacity-50`;
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
                <button
                    onClick={() => handleVote('fits')}
                    disabled={loading}
                    className={buttonClass('fits')}
                    title="This fits me well"
                >
                    {showLabels ? 'Fits' : '✓'}
                </button>
                <button
                    onClick={() => handleVote('partial')}
                    disabled={loading}
                    className={buttonClass('partial')}
                    title="This partially fits"
                >
                    {showLabels ? 'Partial' : '~'}
                </button>
                <button
                    onClick={() => handleVote('doesnt_fit')}
                    disabled={loading}
                    className={buttonClass('doesnt_fit')}
                    title="This doesn't fit me"
                >
                    {showLabels ? "Doesn't Fit" : '✗'}
                </button>
            </div>

            {error && (
                <span className="text-[9px] text-rose-400">{error}</span>
            )}

            {loading && (
                <span className="text-[9px] text-osia-neutral-500 animate-pulse">Saving...</span>
            )}
        </div>
    );
}
