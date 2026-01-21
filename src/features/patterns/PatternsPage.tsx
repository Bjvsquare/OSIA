import { useState, useMemo, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Check, Minus, X, ArrowRight, Loader2 } from 'lucide-react';

interface UserTrait {
    traitId: string;
    layerId: number;
    score: number;
    confidence: number;
    description: string;
}

type FeedbackState = 'idle' | 'submitting' | 'submitted';
type Resonance = 'fits' | 'partial' | 'doesnt_fit';

export function PatternsPage() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [feedbackStates, setFeedbackStates] = useState<Record<number, FeedbackState>>({});
    const [feedbackValues, setFeedbackValues] = useState<Record<number, Resonance>>({});

    const traits = useMemo(() => {
        return (userProfile?.origin_seed_profile?.traits || []) as UserTrait[];
    }, [userProfile]);

    const patternData = useMemo(() => {
        const getLayer = (id: string) => traits.find((t: UserTrait) => t.traitId === id);

        const l1 = getLayer('L01_CORE_DISPOSITION');
        const l2 = getLayer('L02_ENERGY_ORIENTATION');
        const l4 = getLayer('L04_INTERNAL_FOUNDATION');
        const l10 = getLayer('L10_ARCHITECTURAL_FOCUS');

        const formatDescription = (desc: string) => {
            if (!desc) return { insight: 'Signal stabilizing...', showsUp: [], prompt: 'Continue check-ins.' };
            const parts = desc.split('\n\n').filter(Boolean);
            return {
                insight: parts[0] || 'Awaiting deeper signal analysis...',
                showsUp: parts.length > 1 ? [parts[1]] : ['Awaiting behavioral resonance...'],
                prompt: parts.length > 2 ? parts[2].replace(/[".]/g, '') : 'How does this manifest in your daily flow?'
            };
        };

        return {
            summary: formatDescription(l1?.description || '').insight,
            confidence: (l1?.confidence ?? 0) > 0.8 ? 'Stable' : 'Emerging',
            density: traits.length > 10 ? 'High' : 'Low',
            cards: [
                {
                    title: 'Energy Orientation',
                    layer: 'developed',
                    layerId: 2,
                    traitId: 'L02_ENERGY_ORIENTATION',
                    ...formatDescription(l2?.description || '')
                },
                {
                    title: 'Decision Logic',
                    layer: 'emerging',
                    layerId: 4,
                    traitId: 'L04_INTERNAL_FOUNDATION',
                    ...formatDescription(l4?.description || '')
                },
                {
                    title: 'Architectural Focus',
                    layer: 'developing',
                    layerId: 10,
                    traitId: 'L10_ARCHITECTURAL_FOCUS',
                    ...formatDescription(l10?.description || '')
                }
            ]
        };
    }, [traits]);

    /**
     * Submit pattern feedback — wired to the OSIA claim feedback API.
     */
    const handleFeedback = useCallback(async (cardIndex: number, resonance: Resonance, traitId: string) => {
        if (feedbackStates[cardIndex] === 'submitting') return;

        setFeedbackStates(prev => ({ ...prev, [cardIndex]: 'submitting' }));
        setFeedbackValues(prev => ({ ...prev, [cardIndex]: resonance }));

        try {
            await api.submitClaimFeedback(traitId, resonance, ['patterns_page']);
            setFeedbackStates(prev => ({ ...prev, [cardIndex]: 'submitted' }));
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            setFeedbackStates(prev => ({ ...prev, [cardIndex]: 'idle' }));
        }
    }, [feedbackStates]);

    const getFeedbackLabel = (resonance: Resonance) => {
        switch (resonance) {
            case 'fits': return 'Confirmed';
            case 'partial': return 'Noted';
            case 'doesnt_fit': return 'Flagged';
        }
    };

    return (
        <div className="min-h-full text-white relative flex flex-col group/patterns pb-12">
            {/* Soft Neural Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-osia-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-osia-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Cross-navigation tabs */}
            <div className="relative z-10 flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit mb-4">
                <button
                    onClick={() => navigate('/thesis')}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    Thesis
                </button>
                <span className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]">
                    Patterns
                </span>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-6 relative z-10 shrink-0">
                <span className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.6em] text-glow mb-1 block">Foundational Patterns</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Here's what's starting to emerge<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-xs font-medium max-w-xl mx-auto opacity-70">
                    Your feedback shapes how your digital twin evolves. Tell it what resonates.
                </p>
            </div>

            {/* Pattern Grid */}
            <div data-tour="patterns-overview" className="flex-1 relative z-20 px-1">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 pb-1">
                    {/* Summary Box */}
                    <Card className="p-6 border-osia-teal-500/20 bg-osia-teal-500/[0.02] flex flex-col justify-between hover:bg-osia-teal-500/[0.04] transition-colors">
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-osia-teal-500 animate-pulse shadow-[0_0_10px_rgba(56,163,165,0.5)]" />
                                Resonance Summary
                            </h3>
                            <p className="text-xs text-osia-neutral-300 leading-relaxed italic pr-2 font-medium opacity-90">
                                "{patternData.summary}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 shrink-0">
                            <div>
                                <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-1 font-bold">Confidence</div>
                                <div className="text-xs font-black text-osia-teal-400">{patternData.confidence}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-osia-neutral-500 uppercase tracking-widest mb-1 font-bold">Density</div>
                                <div className="text-xs font-black text-white">{patternData.density}</div>
                            </div>
                        </div>
                    </Card>

                    {/* Dynamic Pattern Cards */}
                    {patternData.cards.map((p, idx) => {
                        const cardState = feedbackStates[idx] || 'idle';
                        const cardValue = feedbackValues[idx];

                        return (
                            <Card key={idx} className="p-6 flex flex-col group hover:border-osia-teal-500/30 transition-all duration-500 bg-osia-deep-800/40 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-5 shrink-0">
                                    <h4 className="text-[10px] font-black text-osia-teal-300/80 tracking-[0.2em] uppercase">{p.title}</h4>
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-osia-neutral-500 tracking-tighter shadow-sm">Verified Signal</span>
                                </div>

                                {/* Content */}
                                <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar mask-fade-bottom">
                                    <div>
                                        <div className="text-[10px] text-osia-neutral-600 uppercase tracking-[0.15em] mb-1.5 font-black">Hypothesis</div>
                                        <p className="text-sm text-osia-neutral-300 leading-relaxed font-medium">{p.insight}</p>
                                    </div>

                                    <div className="pt-2">
                                        <div className="text-[10px] text-osia-neutral-600 uppercase tracking-[0.15em] mb-2 font-black">Emergence Context</div>
                                        <ul className="space-y-2">
                                            {p.showsUp.map((item, i) => (
                                                <li key={i} className="flex gap-2.5 text-xs text-osia-neutral-400 leading-snug items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-osia-teal-500/40 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 pb-2">
                                        <div className="text-[10px] text-osia-neutral-600 uppercase tracking-[0.15em] mb-1.5 font-black">Inner Prompt</div>
                                        <p className="text-xs text-osia-teal-500/80 italic leading-relaxed font-medium">"{p.prompt}"</p>
                                    </div>
                                </div>

                                {/* Wired Feedback Actions */}
                                <div className="mt-5 shrink-0 pt-4 border-t border-white/10">
                                    {cardState === 'submitted' ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-osia-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Check className="w-3 h-3" />
                                                {getFeedbackLabel(cardValue!)} — shaping your twin
                                            </span>
                                            <button
                                                onClick={() => navigate('/refinement')}
                                                className="text-[9px] font-bold text-osia-neutral-500 hover:text-osia-teal-400 transition-colors flex items-center gap-1 uppercase tracking-wider"
                                            >
                                                Refine <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFeedback(idx, 'fits', p.traitId)}
                                                disabled={cardState === 'submitting'}
                                                className="flex-1 py-2 text-[10px] font-black text-osia-neutral-400 hover:text-green-400 rounded-xl bg-white/5 hover:bg-green-500/10 border border-transparent hover:border-green-500/30 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {cardState === 'submitting' && cardValue === 'fits' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                Matches
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(idx, 'partial', p.traitId)}
                                                disabled={cardState === 'submitting'}
                                                className="flex-1 py-2 text-[10px] font-black text-osia-neutral-400 hover:text-yellow-400 rounded-xl bg-white/5 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/30 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {cardState === 'submitting' && cardValue === 'partial' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />}
                                                Neutral
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(idx, 'doesnt_fit', p.traitId)}
                                                disabled={cardState === 'submitting'}
                                                className="flex-1 py-2 text-[10px] font-black text-osia-neutral-400 hover:text-red-400 rounded-xl bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {cardState === 'submitting' && cardValue === 'doesnt_fit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                                Doesn't Fit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 shrink-0 flex items-center justify-between border-t border-white/10 pt-6 pb-2 relative z-30">
                <div className="text-[10px] text-osia-neutral-500 max-w-[200px] leading-relaxed">
                    Your digital twin evolves as you interact. Every response refines your profile.
                </div>
                <div className="flex gap-8 items-center">
                    <button onClick={() => navigate('/')} className="text-xs font-bold text-osia-neutral-400 hover:text-white transition-colors uppercase tracking-widest pb-1 border-b border-transparent hover:border-white/20">
                        Skip
                    </button>
                    <Button onClick={() => navigate('/')} variant="primary" size="lg" className="shadow-[0_0_30px_rgba(56,163,165,0.25)] px-14 h-11 text-xs">
                        Merge with Digital Twin
                    </Button>
                </div>
            </div>
        </div>
    );
}
