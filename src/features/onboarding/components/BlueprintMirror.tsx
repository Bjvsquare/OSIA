import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../../auth/AuthContext';
import { Sparkles, Info, ThumbsUp, HelpCircle, ThumbsDown, ArrowRight, Home, Loader2 } from 'lucide-react';
import type { InsightCard } from '../../../core/models';

export function BlueprintMirror({ onComplete }: { onComplete: () => void }) {
    const { state, dispatch } = useOnboarding();
    const { userProfile } = useAuth();
    const [insights, setInsights] = useState<InsightCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [isCalibrating, setIsCalibrating] = useState<string | null>(null);

    useEffect(() => {
        const generate = async () => {
            setLoading(true);
            // In a real app, we'd call the intelligence service here
            // For now, we'll mock the generation delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock insights based on Spec v1.0
            const mockInsights: InsightCard[] = [
                {
                    insight_id: 'insight-1',
                    user_id: userProfile?.id || 'anonymous',
                    layer_refs: [1],
                    text: "You demonstrate high energy resilience, likely processing pressure as a catalyst for focus rather than a drain.",
                    confidence_band: 'medium',
                    created_at: new Date().toISOString(),
                    provenance: ['BLUEPRINT.04', 'BLUEPRINT.05']
                },
                {
                    insight_id: 'insight-2',
                    user_id: userProfile?.id || 'anonymous',
                    layer_refs: [2],
                    text: "Your self-articulation suggests a highly developed internal vocabulary for emotional states.",
                    confidence_band: 'low',
                    created_at: new Date().toISOString(),
                    provenance: ['BLUEPRINT.01', 'BLUEPRINT.02']
                }
            ];
            setInsights(mockInsights);
            setLoading(false);

            dispatch({
                type: 'RECORD_EVENT',
                payload: {
                    event_id: crypto.randomUUID(),
                    event_name: 'first_insight_viewed',
                    occurred_at: new Date().toISOString(),
                    user_id: userProfile?.id || 'anonymous',
                    session_id: state.sessionId,
                    screen_id: 'FIRST_INSIGHT',
                    consent_snapshot: {},
                    properties: { insight_ids: mockInsights.map(i => i.insight_id) }
                }
            });
        };
        generate();
    }, []);

    const handleFeedback = async (insightId: string, rating: string) => {
        setIsCalibrating(insightId);
        setFeedback(prev => ({ ...prev, [insightId]: rating }));

        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'insight_feedback_submitted',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'FIRST_INSIGHT',
                consent_snapshot: {},
                properties: { insight_id: insightId, rating }
            }
        });

        // Simulate calibration delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsCalibrating(null);
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-osia-teal-500 animate-spin mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Assembling your first map...</h2>
                    <p className="text-osia-neutral-400">We're mapping your signals to foundational layers.</p>
                </div>
                <div className="space-y-4">
                    <Card className="p-6 bg-white/5 border-white/10 animate-pulse h-40" />
                    <Card className="p-6 bg-white/5 border-white/10 animate-pulse h-40" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 space-y-10">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-white tracking-tight">Your first map</h1>
                <p className="text-osia-neutral-400">These are early hypotheses based on your baseline signals.</p>
            </div>

            {/* Twin Preview Tile */}
            <Card className="p-6 border-osia-teal-500/20 bg-osia-teal-500/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-osia-teal-500/20 rounded-full flex items-center justify-center">
                        <Sparkles className="text-osia-teal-400 w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Seed twin</span>
                            <span className="text-[10px] bg-osia-teal-500/20 text-osia-teal-400 px-1.5 py-0.5 rounded uppercase font-bold">Developing</span>
                        </div>
                        <button className="text-xs text-osia-teal-500 hover:underline flex items-center gap-1">
                            <HelpCircle size={12} />
                            What am I looking at?
                        </button>
                    </div>
                </div>
            </Card>

            {/* Insight Cards */}
            <div className="space-y-6">
                {insights.map((insight) => (
                    <motion.div
                        key={insight.insight_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card className="p-6 border-white/10 bg-osia-deep-800/50 space-y-6 relative overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] bg-white/10 text-osia-neutral-400 px-2 py-1 rounded uppercase font-bold tracking-wider">
                                        Hypothesis
                                    </span>
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${insight.confidence_band === 'high' ? 'bg-osia-teal-500/20 text-osia-teal-400' :
                                        insight.confidence_band === 'medium' ? 'bg-osia-purple-500/20 text-osia-purple-400' :
                                            'bg-white/10 text-osia-neutral-500'
                                        }`}>
                                        Confidence: {insight.confidence_band}
                                    </span>
                                </div>
                                <p className="text-lg text-white leading-relaxed">{insight.text}</p>

                                <div className="pt-4 border-t border-white/5">
                                    <button className="text-xs text-osia-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                                        <Info size={14} />
                                        Why am I seeing this?
                                    </button>
                                </div>
                            </div>

                            {/* Feedback Control */}
                            <div className="flex gap-2">
                                {[
                                    { label: 'Resonates', icon: ThumbsUp, color: 'osia-teal' },
                                    { label: 'Somewhat', icon: HelpCircle, color: 'osia-purple' },
                                    { label: "Doesn't fit", icon: ThumbsDown, color: 'red' }
                                ].map((btn) => (
                                    <button
                                        key={btn.label}
                                        onClick={() => handleFeedback(insight.insight_id, btn.label)}
                                        disabled={!!isCalibrating}
                                        className={`flex-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-2 ${feedback[insight.insight_id] === btn.label
                                            ? `bg-${btn.color}-500/20 border-${btn.color}-500/50 text-${btn.color}-400`
                                            : 'bg-white/5 border-white/5 text-osia-neutral-500 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <btn.icon size={16} />
                                        {isCalibrating === insight.insight_id && feedback[insight.insight_id] === btn.label ? 'Calibrating...' : btn.label}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Next Step Block */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                    variant="primary"
                    className="flex-1 py-6 text-lg group"
                    onClick={() => {
                        dispatch({ type: 'RECORD_EVENT', payload: { event_id: crypto.randomUUID(), event_name: 'first_insight_refine_clicked', occurred_at: new Date().toISOString(), user_id: userProfile?.id || 'anonymous', session_id: state.sessionId, screen_id: 'FIRST_INSIGHT', consent_snapshot: {}, properties: {} } });
                        onComplete();
                    }}
                >
                    Answer 1 more prompt
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                    variant="secondary"
                    className="flex-1 py-6 text-lg"
                    onClick={() => {
                        onComplete();
                    }}
                >
                    <Home className="mr-2" />
                    Go to Home
                </Button>
            </div>
        </div>
    );
}
