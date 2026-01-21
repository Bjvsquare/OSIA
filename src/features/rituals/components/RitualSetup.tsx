import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, Bell, Sparkles } from 'lucide-react';
import { api } from '../../../services/api';

interface RitualSetupProps {
    ritual: {
        id: string;
        title: string;
        description: string;
        type: string;
        duration: string;
    };
    onComplete: () => void;
}

export function RitualSetup({ ritual, onComplete }: RitualSetupProps) {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        frequency: 'Daily',
        time: 'Morning',
        nudgeStyle: 'Gentle reminder'
    });

    const handleNext = () => setStep(step + 1);

    const handleSave = async () => {
        await api.saveRitual({ ...ritual, ...config });
        setStep(4);
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
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-osia-teal-400" />
                                When would you like to practice?
                            </Label>
                            <p className="text-sm text-osia-neutral-400">Choose a time that fits your natural energy flow.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['Morning', 'Mid-day', 'Evening', 'On-demand'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setConfig({ ...config, time: t }); handleNext(); }}
                                    className={`p-4 rounded-xl border text-left transition-all ${config.time === t
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                        : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {t}
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
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-osia-teal-400" />
                                How should we nudge you?
                            </Label>
                            <p className="text-sm text-osia-neutral-400">OSIA nudges are light-touch and non-gamified.</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Gentle reminder', desc: 'A simple notification at your chosen time.' },
                                { label: 'One question check-in', desc: 'A single prompt to spark reflection.' },
                                { label: 'Show me one insight', desc: 'A relevant hypothesis from your twin.' },
                                { label: 'None', desc: 'I will initiate the ritual myself.' }
                            ].map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => setConfig({ ...config, nudgeStyle: s.label })}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${config.nudgeStyle === s.label
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                        : 'border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`font-medium ${config.nudgeStyle === s.label ? 'text-osia-teal-300' : 'text-white'}`}>{s.label}</div>
                                    <div className="text-xs text-osia-neutral-500">{s.desc}</div>
                                </button>
                            ))}
                        </div>
                        <Button className="w-full bg-osia-teal-600" onClick={handleNext}>
                            Finalize Setup <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-2xl bg-osia-teal-500/5 border border-osia-teal-500/20 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-osia-teal-500/20">
                                    <Sparkles className="w-5 h-5 text-osia-teal-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{ritual.title}</h3>
                                    <p className="text-xs text-osia-neutral-400">{ritual.duration} • {config.frequency}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-osia-neutral-500">Timing</span>
                                    <span className="text-osia-neutral-200">{config.time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-osia-neutral-500">Nudge Style</span>
                                    <span className="text-osia-neutral-200">{config.nudgeStyle}</span>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full bg-osia-teal-600" onClick={handleSave}>
                            Confirm Ritual
                        </Button>
                    </motion.div>
                );
            case 4:
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
                            <h2 className="text-2xl font-bold text-white">Ritual Active</h2>
                            <p className="text-osia-neutral-400">
                                Your {ritual.title} has been integrated into your growth journey.
                            </p>
                        </div>
                        <Button variant="outline" onClick={onComplete} className="mt-4">
                            Back to Rituals
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
