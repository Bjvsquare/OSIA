import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LikertQuestion } from './LikertQuestion';
import { X, CheckCircle, Brain, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '../../../services/api';

interface RecalibrationQuestionnaireProps {
    protocolType: string;
    onComplete: () => void;
    onClose: () => void;
}

export function RecalibrationQuestionnaire({ protocolType, onComplete, onClose }: RecalibrationQuestionnaireProps) {
    const [session, setSession] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [adjustmentFeedback, setAdjustmentFeedback] = useState<{ trait: string; direction: string } | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startSession();
    }, [protocolType]);

    const startSession = async () => {
        try {
            setLoading(true);
            const sessionData = await api.startRecalibrationSession(protocolType);
            setSession(sessionData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (value: number) => {
        if (!session || submitting) return;

        const question = session.questions[currentQuestionIndex];
        setSubmitting(true);

        try {
            const result = await api.submitRecalibrationResponse(session.id, question.id, value);

            // Show brief feedback about the adjustment
            if (result.traitAdjusted) {
                setAdjustmentFeedback({
                    trait: result.traitAdjusted,
                    direction: result.adjustmentDirection
                });

                // Clear feedback and move to next question after delay
                setTimeout(() => {
                    setAdjustmentFeedback(null);
                    if (currentQuestionIndex < session.questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        completeSession();
                    }
                }, 1000);
            } else {
                if (currentQuestionIndex < session.questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    completeSession();
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const completeSession = async () => {
        try {
            await api.completeRecalibrationSession(session.id);
            setIsComplete(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'increased': return <TrendingUp className="w-5 h-5 text-green-400" />;
            case 'decreased': return <TrendingDown className="w-5 h-5 text-orange-400" />;
            default: return <Minus className="w-5 h-5 text-osia-neutral-400" />;
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Brain className="w-16 h-16 text-osia-teal-400 mx-auto animate-pulse" />
                    <p className="text-osia-neutral-400">Preparing personalized questions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                <Card className="p-8 max-w-md text-center space-y-4">
                    <p className="text-red-400">{error}</p>
                    <Button onClick={onClose}>Close</Button>
                </Card>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-lg"
                >
                    <Card className="p-10 bg-gradient-to-br from-green-500/10 to-osia-teal-500/10 border-green-500/30">
                        <div className="text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-osia-teal-500 flex items-center justify-center mx-auto"
                            >
                                <CheckCircle className="w-12 h-12 text-white" />
                            </motion.div>

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Blueprint Updated</h2>
                                <p className="text-osia-neutral-400">
                                    Your responses have been used to refine your personal Blueprint.
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-6 text-left space-y-3">
                                <p className="text-sm text-osia-neutral-500">Questions Answered</p>
                                <p className="text-3xl font-bold text-white">{session?.questions?.length || 0}</p>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-green-600 to-osia-teal-600"
                                onClick={() => {
                                    onComplete();
                                    onClose();
                                }}
                            >
                                Continue
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = session?.questions?.[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / (session?.questions?.length || 1)) * 100;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-osia-teal-500/20 flex items-center justify-center text-osia-teal-400">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Recalibration</h2>
                            <p className="text-sm text-osia-neutral-500 capitalize">{protocolType} protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-6 h-6 text-osia-neutral-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-osia-neutral-500 mb-2">
                        <span>Question {currentQuestionIndex + 1} of {session?.questions?.length || 0}</span>
                        <span>{Math.round(progress)}% complete</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-osia-teal-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <Card className="p-10 bg-gradient-to-br from-osia-teal-500/5 to-purple-500/5 border-osia-teal-500/20">
                    <AnimatePresence mode="wait">
                        {adjustmentFeedback ? (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="text-center py-8 space-y-4"
                            >
                                <div className="w-16 h-16 mx-auto rounded-full bg-osia-teal-500/20 flex items-center justify-center">
                                    {getDirectionIcon(adjustmentFeedback.direction)}
                                </div>
                                <p className="text-lg text-white">
                                    <span className="text-osia-teal-400">{adjustmentFeedback.trait}</span> {adjustmentFeedback.direction}
                                </p>
                            </motion.div>
                        ) : currentQuestion && (
                            <LikertQuestion
                                key={currentQuestion.id}
                                question={currentQuestion}
                                onAnswer={handleAnswer}
                            />
                        )}
                    </AnimatePresence>
                </Card>

                {/* Skip Option */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            if (currentQuestionIndex < session.questions.length - 1) {
                                setCurrentQuestionIndex(prev => prev + 1);
                            } else {
                                completeSession();
                            }
                        }}
                        className="text-sm text-osia-neutral-500 hover:text-osia-neutral-300 transition-colors flex items-center gap-2 mx-auto"
                        disabled={submitting}
                    >
                        Skip this question <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
