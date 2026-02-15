import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding } from './context/OnboardingContext';
import { api } from '../../services/api';
import type { Question } from '../../core/models';
import { QuestionRenderer } from './components/QuestionRenderer';
import { HypothesisTester } from './components/HypothesisTester';
import { AnimatePresence, motion } from 'framer-motion';
import { ExpectationsScreen } from './components/ExpectationsScreen';
import { ConsentScreen } from './components/ConsentScreen';
import { SignalsEntryScreen } from './components/SignalsEntryScreen';
import { VoiceInteraction } from './components/VoiceInteraction';
import { Button } from '../../components/ui/Button';
import { Mic, Sparkles } from 'lucide-react';
import { OriginSyncScreen } from './components/OriginSyncScreen';
import { useAuth } from '../auth/AuthContext';

export function OnboardingFlow() {
    const { state, dispatch } = useOnboarding();
    const { userProfile, refreshProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [subStep, setSubStep] = useState<string>('initial');
    const [isVoiceInteraction, setIsVoiceInteraction] = useState(false);
    const [originSyncDone, setOriginSyncDone] = useState(() => {
        return sessionStorage.getItem('OSIA_origin_sync_done') === 'true';
    });

    const evaluateVisibility = (rule?: string) => {
        if (!rule) return true;

        if (rule === "consent.personal_twin == true") {
            return state.answers['ORIENT.04']?.value === true;
        }
        if (rule === "consent.relational_state == 'Yes'") {
            return state.answers['ORIENT.05']?.value === 'Yes';
        }
        if (rule === "consent.team_state == 'Yes'") {
            return state.answers['ORIENT.06']?.value === 'Yes';
        }
        if (rule === "stage_completed.BLUEPRINT == true") {
            return state.completedStages.includes('BLUEPRINT');
        }
        if (rule === "rel.mutual_link_confirmed == true") {
            return state.answers['REL.03']?.value === true;
        }

        return true;
    };

    const getScreenId = (stageId: string, questionId: string): string => {
        if (stageId === 'ORIENTATION_CONSENT') {
            if (questionId === 'ORIENT.01') return 'CONSENT_01';
            return 'CONSENT_02';
        }
        if (stageId === 'BLUEPRINT') {
            if (questionId === 'BLUEPRINT.01' || questionId === 'BLUEPRINT.02' || questionId === 'BLUEPRINT.03') return 'BLUEPRINT_02';
            if (questionId === 'BLUEPRINT.04' || questionId === 'BLUEPRINT.05' || questionId === 'BLUEPRINT.06') return 'BLUEPRINT_01';
            if (questionId === 'BLUEPRINT.14') return 'BLUEPRINT_03';
            return 'BLUEPRINT_04';
        }
        if (stageId === 'DEEPENING') {
            if (questionId === 'DEEP.01') return 'FOCUS_01';
            return 'FOCUS_02';
        }
        if (stageId === 'RELATIONAL_CONNECT') {
            if (questionId === 'REL.01' || questionId === 'REL.02' || questionId === 'REL.03') return 'CONNECT_01';
            return 'CONNECT_02';
        }
        if (stageId === 'TEAM_CONTEXT') {
            if (questionId === 'TEAM.01' || questionId === 'TEAM.02' || questionId === 'TEAM.03') return 'TEAM_01';
            return 'TEAM_02';
        }
        if (stageId === 'INTEGRATION_RITUALS') return 'RITUAL_01';
        if (stageId === 'RENEWAL_EXIT') return 'SETTINGS_01';
        return 'UNKNOWN';
    };

    useEffect(() => {
        // Redirect to welcome if no consent found and not already there
        const hasConsent = state.consentLedger.length > 0;
        if (!hasConsent && location.pathname !== '/welcome') {
            navigate('/welcome');
            return;
        }

        const loadQuestions = async () => {
            setLoading(true);
            try {
                const data = await api.getQuestions(state.currentStageId);
                const visibleQuestions = data.filter(q => evaluateVisibility(q.visibility_rule));

                // Fetch enums for questions that need them
                const questionsWithOptions = await Promise.all(visibleQuestions.map(async q => {
                    if (q.enum_ref) {
                        const options = await api.getEnums(q.enum_ref);
                        return { ...q, options };
                    }
                    if (q.constraints?.enum_ref) {
                        const options = await api.getEnums(q.constraints.enum_ref);
                        return { ...q, options };
                    }
                    return q;
                }));

                setQuestions(questionsWithOptions);
            } catch (error) {
                console.error('Failed to load questions', error);
            } finally {
                setLoading(false);
            }
        };
        loadQuestions();

        // Quality of Life: If we are in BLUEPRINT or earlier, we skip the low-value text questions
        // and jump straight to the Signals/Refinement phase.
        if (state.currentStageId === 'BLUEPRINT' || state.currentStageId === 'ORIENTATION_CONSENT') {
            setCurrentIndex(100); // Beyond question length to trigger SignalsEntryScreen or advance
        }
    }, [state.currentStageId, state.answers, state.consentLedger.length, location.pathname]);

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            const nextQuestion = questions[currentIndex + 1];
            if (nextQuestion) {
                navigate(`/onboarding/q/${nextQuestion.question_id}`);
                window.scrollTo(0, 0);
            }
        } else {
            if (state.currentStageId === 'BLUEPRINT') {
                // If there were questions, and we finished them, we move to the signals entry screen
                setCurrentIndex(questions.length);
            } else {
                handleStageComplete();
            }
        }
    };

    const handleMirrorComplete = () => {
        handleStageComplete();
    };

    const checkQualityGates = (stageId: string): boolean => {
        if (stageId === 'BLUEPRINT') {
            // High-Fidelity Signal IDs are checked here if needed
            // For the demo, we allow proceeding to show the visual synthesis
            return true;
        }
        return true;
    };

    const handleStageComplete = async (isSkip = false) => {
        if (!isSkip && !checkQualityGates(state.currentStageId)) {
            alert('Please complete all required fields to ensure blueprint quality.');
            return;
        }

        const stageSequence = [
            'BLUEPRINT',
            'DEEPENING',
            'RELATIONAL_CONNECT',
            'TEAM_CONTEXT',
            'INTEGRATION_RITUALS',
            'RENEWAL_EXIT'
        ];

        const idx = stageSequence.indexOf(state.currentStageId);

        if (idx !== -1 && idx < stageSequence.length - 1) {
            let nextStageId = stageSequence[idx + 1];

            if (nextStageId === 'RELATIONAL_CONNECT') {
                const hasRelationalConsent = state.consentLedger.some(e => e.domains.relational_connect && e.granted);
                const hasBlueprint = state.completedStages.includes('BLUEPRINT');
                if (!hasRelationalConsent || !hasBlueprint) {
                    nextStageId = stageSequence[idx + 2];
                }
            }

            if (nextStageId === 'TEAM_CONTEXT') {
                const hasTeamConsent = state.consentLedger.some(e => e.domains.team_views && e.granted);
                if (!hasTeamConsent) {
                    nextStageId = stageSequence[idx + 3];
                }
            }

            dispatch({ type: 'COMPLETE_STAGE', payload: state.currentStageId });
            dispatch({ type: 'SET_STAGE', payload: nextStageId });
            setCurrentIndex(0);

            if (nextStageId === 'RENEWAL_EXIT') {
                navigate('/onboarding'); // Stay on onboarding to show success screen
            } else {
                navigate('/onboarding');
            }
            window.scrollTo(0, 0);
        } else {
            dispatch({ type: 'COMPLETE_STAGE', payload: state.currentStageId });
            navigate('/home');
        }
    };

    const handleSaveExit = () => {
        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'onboarding_save_exit_clicked',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'ONBOARDING',
                consent_snapshot: {},
                properties: { question_id: questions[currentIndex]?.question_id || 'unknown' }
            }
        });

        navigate('/home');
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            const prevQuestion = questions[currentIndex - 1];
            if (prevQuestion) {
                navigate(`/onboarding/q/${prevQuestion.question_id}`);
            }
        } else {
            navigate('/welcome');
        }
    };

    // URL-based routing logic
    if (location.pathname === '/welcome') {
        const hasConsent = state.consentLedger.length > 0;
        const hasSignals = userProfile?.origin_seed_profile?.traits?.length ? userProfile.origin_seed_profile.traits.length > 0 : false;

        if (subStep === 'initial') {
            if (hasConsent) {
                // If origin sync already done (this session or signals exist), skip
                if (originSyncDone || hasSignals) {
                    navigate('/onboarding');
                    dispatch({ type: 'SET_STAGE', payload: 'BLUEPRINT' });
                    return null;
                }
                return (
                    <OriginSyncScreen onComplete={() => {
                        sessionStorage.setItem('OSIA_origin_sync_done', 'true');
                        setOriginSyncDone(true);
                        navigate('/onboarding');
                        setSubStep('initial');
                        dispatch({ type: 'SET_STAGE', payload: 'BLUEPRINT' });
                        window.scrollTo(0, 0);
                    }} />
                );
            }
            return <ExpectationsScreen onContinue={() => setSubStep('consent')} />;
        }
        if (subStep === 'consent') {
            return (
                <ConsentScreen
                    onContinue={async (consents) => {
                        dispatch({
                            type: 'RECORD_EVENT',
                            payload: {
                                event_id: crypto.randomUUID(),
                                event_name: 'consent_updated',
                                occurred_at: new Date().toISOString(),
                                user_id: userProfile?.id || 'anonymous',
                                session_id: state.sessionId,
                                screen_id: 'ONBOARDING',
                                consent_snapshot: {},
                                properties: {
                                    domains: {
                                        identity_view: consents.core,
                                        relational_connect: consents.relational,
                                        team_views: consents.team,
                                        product_research: consents.research
                                    }
                                }
                            }
                        });
                        dispatch({
                            type: 'UPDATE_CONSENT',
                            payload: {
                                entry_id: crypto.randomUUID(),
                                user_id: userProfile?.id || 'anonymous',
                                domains: {
                                    account: consents.core,
                                    personal_twin: consents.core,
                                    relational_connect: consents.relational,
                                    team_org: consents.team,
                                    research_validation: consents.research
                                },
                                granted: true,
                                policy: 'v1.1',
                                occurred_at: new Date().toISOString()
                            }
                        });

                        // Refresh profile to ensure we have traits if they were processed in background
                        await refreshProfile();
                        setSubStep('origin_sync');
                    }}
                />
            );
        }
        if (subStep === 'origin_sync') {
            // Check if already done
            if (originSyncDone || hasSignals) {
                navigate('/onboarding');
                setSubStep('initial');
                dispatch({ type: 'SET_STAGE', payload: 'BLUEPRINT' });
                window.scrollTo(0, 0);
                return null;
            }

            return (
                <OriginSyncScreen onComplete={() => {
                    sessionStorage.setItem('OSIA_origin_sync_done', 'true');
                    setOriginSyncDone(true);
                    navigate('/onboarding');
                    setSubStep('initial');
                    dispatch({ type: 'SET_STAGE', payload: 'BLUEPRINT' });
                    window.scrollTo(0, 0);
                }} />
            );
        }
    }

    if (location.pathname === '/insight/first') {
        return <HypothesisTester onComplete={() => {
            handleMirrorComplete();
        }} />;
    }

    if (state.currentStageId === 'RENEWAL_EXIT') {
        return (
            <div className="min-h-screen bg-osia-deep-900 flex flex-col items-center justify-center p-6 text-center space-y-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="w-24 h-24 rounded-[2.5rem] bg-osia-teal-500/20 flex items-center justify-center relative z-10">
                        <Sparkles className="w-12 h-12 text-osia-teal-500" />
                    </div>
                    <div className="absolute inset-0 bg-osia-teal-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                </motion.div>

                <div className="space-y-4 max-w-md">
                    <h1 className="text-4xl font-bold tracking-tight text-white">Your Map is Live.</h1>
                    <p className="text-osia-neutral-400">
                        The foundation of your digital twin is set. As you interact with OSIA daily, patterns will sharpen and resonance will deepen.
                    </p>
                </div>

                <div className="pt-8 w-full max-w-sm">
                    <Button
                        onClick={() => navigate('/home')}
                        variant="primary"
                        size="lg"
                        className="w-full rounded-full py-8 text-lg font-bold shadow-[0_0_40px_rgba(56,163,165,0.3)]"
                    >
                        Enter My OSIA
                    </Button>
                </div>

                <p className="text-[10px] text-osia-neutral-600 uppercase tracking-[0.3em]">Calibration Complete</p>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse text-osia-teal-500">Loading OSIA...</div>
            </div>
        );
    }

    if (state.currentStageId === 'BLUEPRINT') {
        const hasOriginSeed = originSyncDone || (userProfile?.origin_seed_profile && userProfile.origin_seed_profile.traits);

        if (!hasOriginSeed && location.pathname !== '/welcome') {
            return (
                <OriginSyncScreen onComplete={async () => {
                    sessionStorage.setItem('OSIA_origin_sync_done', 'true');
                    setOriginSyncDone(true);
                    await refreshProfile();
                }} />
            );
        }

        return (
            <div className="relative min-h-screen">
                <AnimatePresence mode="wait">
                    {isVoiceInteraction ? (
                        <VoiceInteraction
                            onComplete={(data) => {
                                // Save signals to state
                                Object.entries(data.selectedWords).forEach(([bucket, words]) => {
                                    dispatch({
                                        type: 'SET_ANSWER',
                                        payload: {
                                            question_id: `SIGNAL_${bucket.toUpperCase()}`,
                                            value: words,
                                            user_id: userProfile?.id || 'anonymous',
                                            answered_at: new Date().toISOString()
                                        }
                                    });
                                });
                                handleStageComplete(false);
                                setIsVoiceInteraction(false);
                            }}
                            onCancel={() => setIsVoiceInteraction(false)}
                        />
                    ) : (
                        <div className="relative">
                            {currentIndex < questions.length && currentQuestion ? (
                                // Show questions first if they exist
                                <QuestionRenderer
                                    key={currentQuestion.question_id}
                                    question={currentQuestion}
                                    screenId={getScreenId(state.currentStageId, currentQuestion.question_id)}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                    onSaveExit={handleSaveExit}
                                />
                            ) : (
                                <>
                                    <SignalsEntryScreen
                                        onComplete={(data) => {
                                            // Save signals to state
                                            Object.entries(data.selectedWords).forEach(([bucket, words]) => {
                                                dispatch({
                                                    type: 'SET_ANSWER',
                                                    payload: {
                                                        question_id: `SIGNAL_${bucket.toUpperCase()}`,
                                                        value: words,
                                                        user_id: userProfile?.id || 'anonymous',
                                                        answered_at: new Date().toISOString()
                                                    }
                                                });
                                            });
                                            // After signals, go to hypothesis testing
                                            navigate('/insight/first');
                                        }}
                                        onSkip={() => navigate('/insight/first')}
                                    />

                                    {/* Voice Trigger - Floating Action Button Style */}
                                    <div className="fixed bottom-8 right-8 z-40">
                                        <Button
                                            onClick={() => setIsVoiceInteraction(true)}
                                            variant="primary"
                                            className="w-16 h-16 rounded-full flex items-center justify-center bg-osia-teal-500 shadow-[0_0_30px_rgba(56,163,165,0.5)] hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Mic className="w-8 h-8 text-white" />
                                        </Button>
                                        <div className="absolute -top-12 right-0 bg-osia-deep-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-osia-teal-500 whitespace-nowrap animate-bounce shadow-xl">
                                            Try Voice Sync
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (!currentQuestion) {
        if (state.currentStageId === 'ORIENTATION_CONSENT') {
            dispatch({ type: 'SET_STAGE', payload: 'BLUEPRINT' });
            return null;
        }
        // Auto-advance to next stage instead of dead-end
        handleStageComplete(true);
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="animate-pulse text-osia-teal-500">Advancing...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-osia-deep-900 flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    <QuestionRenderer
                        key={currentQuestion.question_id}
                        question={currentQuestion}
                        screenId={getScreenId(state.currentStageId, currentQuestion.question_id)}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSaveExit={handleSaveExit}
                    />
                </AnimatePresence>
            </main>
        </div>
    );
}
