import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface TeamCheckInProps {
    onComplete?: (data: any) => void;
}

export function TeamCheckIn({ onComplete }: TeamCheckInProps) {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<any>({});

    const handleNext = () => setStep(step + 1);

    const handleFinish = () => {
        if (onComplete) {
            onComplete(answers);
        } else {
            setStep(1);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <Label className="text-lg font-medium text-white">How would you describe the team's current pace?</Label>
                            <p className="text-sm text-osia-neutral-400">This contributes to the aggregate "Team Pace" indicator.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['Sustainable', 'Intense', 'Overwhelming', 'Stagnant'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => { setAnswers({ ...answers, pace: option }); handleNext(); }}
                                    className={`p-4 rounded-xl border text-left transition-all ${answers.pace === option
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                        : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <Label className="text-lg font-medium text-white">What is the primary source of friction this week?</Label>
                            <p className="text-sm text-osia-neutral-400">Anonymized and aggregated into the team friction cloud.</p>
                        </div>
                        <Input
                            placeholder="e.g., Meeting fatigue, unclear scope..."
                            value={answers.friction || ''}
                            onChange={(e: any) => setAnswers({ ...answers, friction: e.target.value })}
                        />
                        <Button
                            className="w-full bg-osia-teal-600"
                            onClick={handleNext}
                            disabled={!answers.friction}
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 text-center py-8"
                    >
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-osia-teal-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-osia-teal-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Check-in Complete</h2>
                            <p className="text-osia-neutral-400">
                                Your contribution has been anonymized and added to the aggregate team pulse.
                            </p>
                        </div>
                        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-osia-neutral-500">
                            <ShieldCheck className="w-3 h-3" />
                            Privacy Guardrail: Individual responses are never stored.
                        </div>
                        <Button variant="outline" onClick={handleFinish} className="mt-4">
                            Back to Dashboard
                        </Button>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <Card className="p-8">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </Card>
        </div>
    );
}
