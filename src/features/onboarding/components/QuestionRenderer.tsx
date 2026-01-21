import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../../auth/AuthContext';
import type { Question, Answer, EventSchema } from '../../../core/models';
import { ChevronLeft, Save, HelpCircle, ChevronRight, Loader2 } from 'lucide-react';

interface QuestionRendererProps {
    question: Question;
    screenId: string;
    onNext?: () => void;
    onBack?: () => void;
    onSaveExit?: () => void;
}

export function QuestionRenderer({ question, screenId, onNext, onBack, onSaveExit }: QuestionRendererProps) {
    const { state, dispatch } = useOnboarding();
    const { userProfile } = useAuth();
    const getInitialValue = () => {
        const saved = state.answers[question.question_id]?.value;
        if (saved !== undefined) return saved;

        if (question.type === 'multi_select' || question.type === 'word_list_n' || question.type === 'text_list') return [];
        if (question.type === 'consent_toggle') return false;
        return '';
    };

    const [value, setValue] = useState<any>(getInitialValue());
    const [confidence] = useState<string>(state.answers[question.question_id]?.confidence || 'Sure');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWhy, setShowWhy] = useState(false);

    useEffect(() => {
        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'onboarding_question_viewed',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: screenId,
                consent_snapshot: {}, // Will be populated by state
                properties: { question_id: question.question_id, stage: question.stage_id }
            }
        });
    }, [question.question_id]);

    const handleChange = (newValue: any) => {
        setValue(newValue);
    };

    const handleNext = async () => {
        setIsSubmitting(true);

        // Mock derived calculations
        const derived: any = {};
        if (typeof value === 'string') {
            derived.word_count = value.trim().split(/\s+/).length;
        } else if (Array.isArray(value)) {
            derived.selected_count = value.length;
        }

        const answer: Answer = {
            user_id: userProfile?.id || 'anonymous',
            question_id: question.question_id,
            answered_at: new Date().toISOString(),
            value,
            confidence,
            derived
        };

        dispatch({ type: 'SET_ANSWER', payload: answer });

        // Emit Canonical Event
        const event: EventSchema = {
            event_id: crypto.randomUUID(),
            event_name: 'onboarding_answer_submitted',
            occurred_at: new Date().toISOString(),
            user_id: userProfile?.id || 'anonymous',
            session_id: state.sessionId,
            screen_id: screenId,
            consent_snapshot: {},
            properties: {
                question_id: question.question_id,
                type: question.type,
                is_skip: false,
                value_meta: derived
            }
        };

        dispatch({ type: 'RECORD_EVENT', payload: event });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));

        setIsSubmitting(false);
        onNext?.();
    };

    const handleSkip = () => {
        const event: EventSchema = {
            event_id: crypto.randomUUID(),
            event_name: 'onboarding_answer_submitted',
            occurred_at: new Date().toISOString(),
            user_id: userProfile?.id || 'anonymous',
            session_id: state.sessionId,
            screen_id: screenId,
            consent_snapshot: {},
            properties: {
                question_id: question.question_id,
                type: question.type,
                is_skip: true,
                value_meta: {}
            }
        };
        dispatch({ type: 'RECORD_EVENT', payload: event });
        onNext?.();
    };

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col h-full min-h-[80vh]">
            {/* Top Bar */}
            <div className="flex items-center justify-between py-4 px-2 border-b border-white/5 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/5 rounded-full text-osia-neutral-400 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-sm font-medium text-osia-neutral-500">
                    {question.stage_id.replace('_', ' ')}
                </div>
                <button
                    onClick={onSaveExit}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-medium text-osia-neutral-400 transition-colors"
                >
                    <Save size={14} />
                    Save & exit
                </button>
            </div>

            {/* Prompt Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 space-y-8"
            >
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white leading-tight">{question.prompt}</h2>
                    <p className="text-osia-neutral-400 text-sm">Provide your honest reflection. There are no wrong answers.</p>
                </div>

                {/* Input Module */}
                <div className="py-4">
                    {question.type === 'short_text' && (
                        <Input
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Type your response..."
                            className="bg-black/40 border-white/10 text-lg py-6 focus:border-osia-teal-500"
                            disabled={isSubmitting}
                        />
                    )}
                    {question.type === 'long_text' && (
                        <textarea
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Type your response..."
                            className="w-full min-h-[200px] bg-black/40 border-white/10 rounded-2xl p-4 text-white placeholder-osia-neutral-600 focus:outline-none focus:border-osia-teal-500 transition-colors resize-none"
                            disabled={isSubmitting}
                        />
                    )}
                    {(question.type === 'single_select' || question.type === 'multi_select') && (
                        <div className="space-y-3">
                            {(question.options || []).map((option: string) => {
                                const isSelected = question.type === 'multi_select'
                                    ? (Array.isArray(value) && value.includes(option))
                                    : value === option;

                                return (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            if (question.type === 'multi_select') {
                                                const current = Array.isArray(value) ? value : [];
                                                if (current.includes(option)) {
                                                    handleChange(current.filter(i => i !== option));
                                                } else {
                                                    const max = question.constraints?.max_select || 99;
                                                    if (current.length < max) {
                                                        handleChange([...current, option]);
                                                    }
                                                }
                                            } else {
                                                handleChange(option);
                                            }
                                        }}
                                        className={`w-full p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group ${isSelected
                                            ? 'bg-osia-teal-500/10 border-osia-teal-500 text-white shadow-[0_0_20px_rgba(56,163,165,0.2)]'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-400 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-medium">{option}</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-osia-teal-500 bg-osia-teal-500' : 'border-white/20'
                                            }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {question.type === 'likert_1_5' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleChange(num)}
                                        className={`w-12 h-12 rounded-xl border font-bold transition-all duration-300 ${value === num
                                            ? 'bg-osia-teal-500 border-osia-teal-500 text-white shadow-[0_0_20px_rgba(56,163,165,0.4)]'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-500 hover:border-white/20'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-osia-neutral-600 font-bold uppercase tracking-widest px-1">
                                <span>Not at all</span>
                                <span>Extremely</span>
                            </div>
                        </div>
                    )}
                    {question.type === 'word_list_n' && (
                        <div className="space-y-3">
                            {Array.from({ length: question.constraints?.exact_items || 3 }).map((_, i) => (
                                <Input
                                    key={i}
                                    value={value[i] || ''}
                                    onChange={(e) => {
                                        const newList = [...(Array.isArray(value) ? value : [])];
                                        newList[i] = e.target.value;
                                        handleChange(newList);
                                    }}
                                    placeholder={`Item ${i + 1}`}
                                    className="bg-black/40 border-white/10"
                                    disabled={isSubmitting}
                                />
                            ))}
                        </div>
                    )}
                    {question.type === 'text_list' && (
                        <div className="space-y-3">
                            {Array.from({ length: question.constraints?.max_items || 3 }).map((_, i) => (
                                <Input
                                    key={i}
                                    value={value[i] || ''}
                                    onChange={(e) => {
                                        const newList = [...(Array.isArray(value) ? value : [])];
                                        newList[i] = e.target.value;
                                        handleChange(newList);
                                    }}
                                    placeholder={`Situation ${i + 1}`}
                                    className="bg-black/40 border-white/10"
                                    disabled={isSubmitting}
                                />
                            ))}
                        </div>
                    )}
                    {question.type === 'tag_select' && (
                        <div className="flex flex-wrap gap-3">
                            {(question.options || []).map((option: string) => {
                                const isSelected = value === option;
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleChange(option)}
                                        className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isSelected
                                            ? 'bg-osia-teal-500 border-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-400 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {question.type === 'consent_toggle' && (
                        <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group cursor-pointer" onClick={() => handleChange(!value)}>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold text-white group-hover:text-osia-teal-400 transition-colors">Confirm Consent</p>
                                <p className="text-[10px] text-osia-neutral-500">Enable processing for this cognitive domain</p>
                            </div>
                            <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? 'bg-osia-teal-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Why we ask */}
                <div className="border-t border-white/5 pt-6">
                    <button
                        onClick={() => setShowWhy(!showWhy)}
                        className="flex items-center gap-2 text-xs font-medium text-osia-neutral-500 hover:text-white transition-colors"
                    >
                        <HelpCircle size={14} />
                        Why we ask
                    </button>
                    <AnimatePresence>
                        {showWhy && (
                            <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 text-xs text-osia-neutral-500 leading-relaxed overflow-hidden"
                            >
                                This signal helps us map your {question.consent_domain.replace('_', ' ')} layer,
                                which is foundational for understanding your {question.stage_id.toLowerCase()} patterns.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* CTA Row */}
            <div className="py-8 flex gap-4">
                <Button
                    variant="secondary"
                    className="flex-1 py-6 text-lg"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                >
                    Not sure yet
                </Button>
                <Button
                    variant="primary"
                    className="flex-1 py-6 text-lg group"
                    onClick={handleNext}
                    disabled={isSubmitting || (question.required && !value)}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            Next
                            <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
