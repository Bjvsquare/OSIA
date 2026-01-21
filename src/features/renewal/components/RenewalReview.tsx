import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

interface RenewalReviewProps {
    onComplete: () => void;
}

export function RenewalReview({ onComplete }: RenewalReviewProps) {
    const [step, setStep] = useState(1);
    const [updates, setUpdates] = useState<any>({
        contextChange: '',
        insightValidation: 'Still resonates'
    });

    const handleNext = () => setStep(step + 1);

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
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-osia-teal-400" />
                                Has your context changed?
                            </Label>
                            <p className="text-sm text-osia-neutral-400">Significant life changes (new role, relocation, etc.) can shift your digital twin foundation.</p>
                        </div>
                        <Input
                            placeholder="e.g., Started a new leadership role..."
                            value={updates.contextChange}
                            onChange={(e: any) => setUpdates({ ...updates, contextChange: e.target.value })}
                        />
                        <Button className="w-full bg-osia-teal-600" onClick={handleNext}>
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
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
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-osia-teal-400" />
                                Re-validate Core Insights
                            </Label>
                            <p className="text-sm text-osia-neutral-400">Do your primary energy patterns still feel accurate?</p>
                        </div>
                        <div className="space-y-3">
                            {['Still resonates', 'Needs adjustment', 'No longer fits'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => { setUpdates({ ...updates, insightValidation: option }); handleNext(); }}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${updates.insightValidation === option
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
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 space-y-6"
                    >
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-osia-teal-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-osia-teal-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Renewal Complete</h2>
                            <p className="text-osia-neutral-400">
                                Your digital twin foundation has been refreshed and aligned with your current context.
                            </p>
                        </div>
                        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-osia-neutral-500">
                            <ShieldCheck className="w-3 h-3" />
                            Next scheduled renewal: 90 days.
                        </div>
                        <Button variant="outline" onClick={onComplete} className="mt-4">
                            Back to Renewal Hub
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
