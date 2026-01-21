import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { MessageSquare, Heart, RefreshCcw, AlertCircle, Sparkles } from 'lucide-react';

interface RelationalCheckInProps {
    collaboratorName: string;
    onComplete: () => void;
}

const CONFLICT_DEFAULTS = [
    "Pursue", "Withdraw", "Explain", "Go silent", "Get blunt", "Seek repair", "Other"
];

const SUPPORT_NEEDS = [
    "Space", "Reassurance", "Clarity", "Practical help", "Gentle check-in", "Time", "Other"
];

const REPAIR_STYLES = [
    "Talk now", "Pause then return", "Written first", "Physical reset first", "Other"
];

export function RelationalCheckIn({ collaboratorName, onComplete }: RelationalCheckInProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        conflictDefault: '',
        supportNeed: [] as string[],
        repairStyle: '',
        frictionExample: ''
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const toggleSupportNeed = (need: string) => {
        setData(prev => ({
            ...prev,
            supportNeed: prev.supportNeed.includes(need)
                ? prev.supportNeed.filter(n => n !== need)
                : [...prev.supportNeed, need]
        }));
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <MessageSquare className="w-5 h-5" />
                            <h4 className="font-semibold">Conflict Style</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">When we disagree, I tend to...</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {CONFLICT_DEFAULTS.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setData({ ...data, conflictDefault: style })}
                                    className={`p-3 rounded-lg border text-sm transition-all ${data.conflictDefault === style
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleNext} disabled={!data.conflictDefault} className="w-full">Next</Button>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <Heart className="w-5 h-5" />
                            <h4 className="font-semibold">Support Needs</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">When I'm stressed, I usually need...</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {SUPPORT_NEEDS.map(need => (
                                <button
                                    key={need}
                                    onClick={() => toggleSupportNeed(need)}
                                    className={`p-3 rounded-lg border text-sm transition-all ${data.supportNeed.includes(need)
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {need}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={data.supportNeed.length === 0} className="flex-1">Next</Button>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <RefreshCcw className="w-5 h-5" />
                            <h4 className="font-semibold">Repair Style</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">After tension, I usually prefer...</Label>
                        <div className="space-y-2">
                            {REPAIR_STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setData({ ...data, repairStyle: style })}
                                    className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${data.repairStyle === style
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={!data.repairStyle} className="flex-1">Next</Button>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <AlertCircle className="w-5 h-5" />
                            <h4 className="font-semibold">Recent Friction</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">Describe a recent moment of friction (optional)</Label>
                        <textarea
                            className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-osia-teal-500 transition-colors placeholder:text-osia-neutral-600"
                            placeholder="Before -> During -> After..."
                            value={data.frictionExample}
                            onChange={(e) => setData({ ...data, frictionExample: e.target.value })}
                        />
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} className="flex-1">Complete</Button>
                        </div>
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6 text-center py-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-osia-teal-500/20 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-osia-teal-500" />
                        </div>
                        <h4 className="text-xl font-semibold text-white">Relational Sync Complete</h4>
                        <p className="text-sm text-osia-neutral-400 leading-relaxed">
                            "I've noted your preferences for interacting with {collaboratorName}.
                            Once they complete their check-in, I'll generate a composite Relational Blueprint for you both."
                        </p>
                        <Button onClick={onComplete} className="w-full">Done</Button>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-osia-deep-900 to-black border-white/5">
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </Card>
    );
}
