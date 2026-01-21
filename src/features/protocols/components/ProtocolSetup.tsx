import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, Bell, Sparkles, Brain, Target, Zap, ChevronLeft, Heart, BarChart3 } from 'lucide-react';
import { api } from '../../../services/api';

interface ProtocolSetupProps {
    protocol: {
        id: string;
        title: string;
        description: string;
        type: string;
        duration: string;
        complexity?: string;
        blueprintImpact?: string[];
    };
    onComplete: () => void;
}

const COMPLEXITY_OPTIONS = [
    {
        value: 'guided',
        label: 'Fully Guided',
        description: 'Step-by-step guidance with timers and prompts',
        icon: Target
    },
    {
        value: 'structured',
        label: 'Structured',
        description: 'Key checkpoints with flexibility in between',
        icon: BarChart3
    },
    {
        value: 'freeform',
        label: 'Freeform',
        description: 'Set your own pace with minimal structure',
        icon: Sparkles
    }
];

const BLUEPRINT_LAYERS = [
    { id: 'decision_quality', label: 'Decision Quality', color: 'bg-purple-500' },
    { id: 'stress_resilience', label: 'Stress Resilience', color: 'bg-pink-500' },
    { id: 'peak_performance', label: 'Peak Performance', color: 'bg-red-500' },
    { id: 'network_capital', label: 'Network Capital', color: 'bg-blue-500' },
    { id: 'execution_focus', label: 'Execution Focus', color: 'bg-green-500' },
    { id: 'sustained_output', label: 'Sustained Output', color: 'bg-orange-500' }
];

const INTENSITY_LEVELS = [
    { value: 1, label: 'Light', description: 'Quick calibration (2-3 min)' },
    { value: 2, label: 'Standard', description: 'Full protocol with key checkpoints' },
    { value: 3, label: 'Deep', description: 'Extended session with documentation' },
    { value: 4, label: 'Intensive', description: 'Comprehensive review with action planning' }
];

export function ProtocolSetup({ protocol, onComplete }: ProtocolSetupProps) {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        frequency: 'Daily',
        time: 'Morning',
        nudgeStyle: 'Gentle reminder',
        mode: 'guided',
        intensity: 2,
        blueprintFocus: protocol.blueprintImpact?.[0]?.toLowerCase().replace(' ', '_') || 'self_awareness',
        reminderTime: '08:00',
        weekdays: [1, 2, 3, 4, 5] // Mon-Fri
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSave = async () => {
        try {
            await api.createProtocol({
                ...protocol,
                ...config,
                status: 'active'
            });
            setStep(6);
        } catch (error) {
            console.error('Failed to create protocol', error);
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
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-osia-teal-400" />
                                Choose Your Practice Mode
                            </Label>
                            <p className="text-sm text-osia-neutral-400">How much guidance do you want during the protocol?</p>
                        </div>
                        <div className="space-y-3">
                            {COMPLEXITY_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => { setConfig({ ...config, mode: option.value }); handleNext(); }}
                                        className={`w-full p-5 rounded-xl border text-left transition-all flex items-start gap-4 ${config.mode === option.value
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                            : 'border-white/10 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.mode === option.value ? 'bg-osia-teal-500' : 'bg-white/10'}`}>
                                            <Icon className={`w-5 h-5 ${config.mode === option.value ? 'text-white' : 'text-osia-neutral-400'}`} />
                                        </div>
                                        <div>
                                            <div className={`font-medium ${config.mode === option.value ? 'text-osia-teal-300' : 'text-white'}`}>{option.label}</div>
                                            <div className="text-xs text-osia-neutral-500">{option.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
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
                                <Zap className="w-5 h-5 text-osia-teal-400" />
                                Set Your Intensity Level
                            </Label>
                            <p className="text-sm text-osia-neutral-400">How deep do you want to go?</p>
                        </div>
                        <div className="space-y-3">
                            {INTENSITY_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => setConfig({ ...config, intensity: level.value })}
                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${config.intensity === level.value
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                        : 'border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`w-2 h-6 rounded-full ${i <= level.value
                                                    ? 'bg-osia-teal-500'
                                                    : 'bg-white/10'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium ${config.intensity === level.value ? 'text-osia-teal-300' : 'text-white'}`}>{level.label}</div>
                                        <div className="text-xs text-osia-neutral-500">{level.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleBack}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button className="flex-1 bg-osia-teal-600" onClick={handleNext}>
                                Next <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
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
                        <div className="space-y-2">
                            <Label className="text-lg font-medium text-white flex items-center gap-2">
                                <Heart className="w-5 h-5 text-osia-teal-400" />
                                Blueprint Focus Area
                            </Label>
                            <p className="text-sm text-osia-neutral-400">Which aspect of your growth should this protocol strengthen?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {BLUEPRINT_LAYERS.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() => setConfig({ ...config, blueprintFocus: layer.id })}
                                    className={`p-4 rounded-xl border text-left transition-all ${config.blueprintFocus === layer.id
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                        : 'border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${layer.color}`} />
                                        <span className={`text-sm font-medium ${config.blueprintFocus === layer.id ? 'text-osia-teal-300' : 'text-white'}`}>
                                            {layer.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleBack}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button className="flex-1 bg-osia-teal-600" onClick={handleNext}>
                                Next <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                );

            case 4:
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
                                Schedule Your Practice
                            </Label>
                            <p className="text-sm text-osia-neutral-400">When works best for your natural rhythm?</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {['Morning', 'Mid-day', 'Evening', 'On-demand'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setConfig({ ...config, time: t })}
                                        className={`p-4 rounded-xl border text-center transition-all ${config.time === t
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <Label className="text-sm text-osia-neutral-400 block mb-3">Frequency</Label>
                                <div className="flex gap-2">
                                    {['Daily', 'Weekdays', 'Custom'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setConfig({ ...config, frequency: f })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${config.frequency === f
                                                ? 'bg-osia-teal-500 text-white'
                                                : 'bg-white/10 text-osia-neutral-400 hover:text-white'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleBack}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button className="flex-1 bg-osia-teal-600" onClick={handleNext}>
                                Next <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                );

            case 5:
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
                                Nudge Preferences
                            </Label>
                            <p className="text-sm text-osia-neutral-400">How should we remind you? OSIA nudges are light-touch.</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Gentle reminder', desc: 'A simple notification at your chosen time.' },
                                { label: 'One question check-in', desc: 'A single prompt to spark reflection.' },
                                { label: 'Show me one insight', desc: 'A relevant hypothesis from your twin.' },
                                { label: 'None', desc: 'I will initiate the protocol myself.' }
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

                        {/* Summary Preview */}
                        <div className="p-4 rounded-xl bg-osia-teal-500/5 border border-osia-teal-500/20 space-y-3">
                            <h4 className="text-sm font-medium text-osia-teal-300">Protocol Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-osia-neutral-500">Mode</div>
                                <div className="text-white capitalize">{config.mode}</div>
                                <div className="text-osia-neutral-500">Intensity</div>
                                <div className="text-white">{INTENSITY_LEVELS[config.intensity - 1].label}</div>
                                <div className="text-osia-neutral-500">Focus</div>
                                <div className="text-white">{BLUEPRINT_LAYERS.find(l => l.id === config.blueprintFocus)?.label}</div>
                                <div className="text-osia-neutral-500">Schedule</div>
                                <div className="text-white">{config.time} • {config.frequency}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleBack}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button className="flex-1 bg-gradient-to-r from-osia-teal-600 to-purple-600" onClick={handleSave}>
                                Activate Protocol <Sparkles className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                );

            case 6:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 space-y-6"
                    >
                        <div className="flex justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </motion.div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Protocol Activated!</h2>
                            <p className="text-osia-neutral-400">
                                Your <span className="text-osia-teal-300">{protocol.title}</span> is now part of your growth journey.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
                            <p className="text-osia-neutral-400">
                                Each completed session earns you <span className="text-green-400 font-medium">+3 credits</span> toward your subscription discount.
                            </p>
                        </div>
                        <Button variant="outline" onClick={onComplete} className="mt-4">
                            Back to Protocols
                        </Button>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            {/* Progress Indicator */}
            {step < 6 && (
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-osia-neutral-500 mb-2">
                        <span>Step {step} of 5</span>
                        <span>{Math.round((step / 5) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-osia-teal-500 to-purple-500 transition-all"
                            style={{ width: `${(step / 5) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <Card className="p-8">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </Card>
        </div>
    );
}
