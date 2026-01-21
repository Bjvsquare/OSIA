import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { X, Play, Pause, CheckCircle, Clock, Brain, Heart, Target, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';

interface ProtocolExecutionProps {
    protocol: any;
    onComplete: (notes: string) => void;
    onClose: () => void;
}

const PROTOCOL_STEPS = {
    reflection: [
        { id: 1, title: 'Calibrate', instruction: 'Clear your mental queue. Establish your baseline operational state.', duration: 30 },
        { id: 2, title: 'Assess', instruction: 'What is your current state? What factors are influencing your clarity?', duration: 60 },
        { id: 3, title: 'Pattern Scan', instruction: 'What recurring dynamic is affecting your decisions today?', duration: 90 },
        { id: 4, title: 'Root Cause', instruction: 'What underlying driver is shaping this pattern?', duration: 60 },
        { id: 5, title: 'Action Map', instruction: 'Define one tactical adjustment you will implement today.', duration: 30 }
    ],
    energy: [
        { id: 1, title: 'Status Check', instruction: 'Rate your operational capacity from 1-10.', duration: 20 },
        { id: 2, title: 'Resource Audit', instruction: 'Where are you overextended? Where is capacity available?', duration: 60 },
        { id: 3, title: 'Physical Reset', instruction: 'Two minutes of movement to shift state. Stand, stretch, move.', duration: 90 },
        { id: 4, title: 'System Reset', instruction: 'Five rounds of tactical breathing: 4 seconds in, 4 hold, 4 out, 4 hold.', duration: 80 },
        { id: 5, title: 'Post-Assessment', instruction: 'New capacity rating. What shifted?', duration: 20 }
    ],
    connection: [
        { id: 1, title: 'Objective Set', instruction: 'Define one relationship outcome you want to achieve today.', duration: 30 },
        { id: 2, title: 'Stakeholder Analysis', instruction: 'Who in your network deserves acknowledgment? What value do they bring?', duration: 60 },
        { id: 3, title: 'Communication Strategy', instruction: 'How will you deliver this acknowledgment? What medium, what message?', duration: 45 },
        { id: 4, title: 'Reciprocity Map', instruction: 'What support do you need from your network right now?', duration: 45 },
        { id: 5, title: 'Commitment', instruction: 'Name one specific outreach you will execute today.', duration: 30 }
    ],
    focus: [
        { id: 1, title: 'Mental Dump', instruction: 'Externalize all open loops. Write down everything occupying mental space.', duration: 60 },
        { id: 2, title: 'Critical Path', instruction: 'What single deliverable moves the most value today?', duration: 45 },
        { id: 3, title: 'Success Visualization', instruction: 'See the completed state of your priority. What does done look like?', duration: 60 },
        { id: 4, title: 'Risk Assessment', instruction: 'What threatens execution? Define your countermeasures.', duration: 45 },
        { id: 5, title: 'Initiation Point', instruction: 'State the exact first action to begin. Be specific.', duration: 20 }
    ]
};

export function ProtocolExecution({ protocol, onComplete, onClose }: ProtocolExecutionProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
    const [isComplete, setIsComplete] = useState(false);

    const steps = PROTOCOL_STEPS[protocol.type as keyof typeof PROTOCOL_STEPS] || PROTOCOL_STEPS.reflection;
    const step = steps[currentStep];
    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
    const elapsedDuration = steps.slice(0, currentStep).reduce((sum, s) => sum + s.duration, 0);
    const progress = ((elapsedDuration + (step.duration - timeLeft)) / totalDuration) * 100;

    useEffect(() => {
        if (step) {
            setTimeLeft(step.duration);
        }
    }, [currentStep]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0 && currentStep < steps.length - 1) {
            // Auto-advance when timer completes
            setCurrentStep(prev => prev + 1);
        } else if (isRunning && timeLeft === 0 && currentStep === steps.length - 1) {
            setIsRunning(false);
            setIsComplete(true);
        }
        return () => clearInterval(timer);
    }, [isRunning, timeLeft, currentStep, steps.length]);

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsComplete(true);
        }
    };
    const handleRestart = () => {
        setCurrentStep(0);
        setTimeLeft(steps[0].duration);
        setIsRunning(false);
        setIsComplete(false);
        setStepNotes({});
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTypeIcon = () => {
        switch (protocol.type) {
            case 'energy': return <Heart className="w-6 h-6" />;
            case 'connection': return <Target className="w-6 h-6" />;
            case 'focus': return <Brain className="w-6 h-6" />;
            default: return <Sparkles className="w-6 h-6" />;
        }
    };

    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="p-10 bg-gradient-to-br from-green-500/10 to-osia-teal-500/10 border-green-500/30">
                        <div className="text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-osia-teal-500 flex items-center justify-center mx-auto"
                            >
                                <CheckCircle className="w-14 h-14 text-white" />
                            </motion.div>

                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Protocol Complete</h2>
                                <p className="text-osia-neutral-400">{protocol.title}</p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-6 text-left">
                                <label className="text-sm text-osia-neutral-400 block mb-3">
                                    Reflection Notes (Optional)
                                </label>
                                <textarea
                                    value={stepNotes[999] || ''}
                                    onChange={(e) => setStepNotes({ ...stepNotes, 999: e.target.value })}
                                    placeholder="What insights or observations came up during this session?"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white placeholder:text-osia-neutral-600 min-h-[120px] resize-none focus:border-osia-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{steps.length}</p>
                                    <p className="text-xs text-osia-neutral-500">Steps Completed</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{formatTime(totalDuration)}</p>
                                    <p className="text-xs text-osia-neutral-500">Total Time</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-400">+3</p>
                                    <p className="text-xs text-osia-neutral-500">Credits Earned</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleRestart}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Repeat
                                </Button>
                                <Button
                                    className="flex-1 bg-gradient-to-r from-green-600 to-osia-teal-600"
                                    onClick={() => onComplete(stepNotes[999] || '')}
                                >
                                    Save & Exit
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

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
                            {getTypeIcon()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{protocol.title}</h2>
                            <p className="text-sm text-osia-neutral-500">{protocol.type} protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-6 h-6 text-osia-neutral-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-osia-neutral-500 mb-2">
                        <span>Step {currentStep + 1} of {steps.length}</span>
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

                {/* Step Indicators */}
                <div className="flex justify-center gap-2 mb-10">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.id}
                            className={`w-3 h-3 rounded-full transition-all ${i < currentStep ? 'bg-green-500' :
                                i === currentStep ? 'bg-osia-teal-500 ring-4 ring-osia-teal-500/20' :
                                    'bg-white/20'
                                }`}
                            whileHover={{ scale: 1.2 }}
                            onClick={() => !isRunning && setCurrentStep(i)}
                            style={{ cursor: !isRunning ? 'pointer' : 'default' }}
                        />
                    ))}
                </div>

                {/* Current Step */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center mb-10"
                    >
                        <Card className="p-10 bg-gradient-to-br from-osia-teal-500/5 to-purple-500/5 border-osia-teal-500/20">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-osia-teal-500/20 text-osia-teal-300 text-sm font-medium">
                                    <span className="w-6 h-6 rounded-full bg-osia-teal-500 text-white flex items-center justify-center text-xs font-bold">
                                        {currentStep + 1}
                                    </span>
                                    {step.title}
                                </div>

                                <p className="text-2xl text-white leading-relaxed max-w-xl mx-auto">
                                    {step.instruction}
                                </p>

                                {/* Timer */}
                                <div className="flex items-center justify-center gap-4 pt-6">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="64" cy="64" r="56"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="8"
                                            />
                                            <circle
                                                cx="64" cy="64" r="56"
                                                fill="none"
                                                stroke="url(#timerGradient)"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(timeLeft / step.duration) * 352} 352`}
                                            />
                                            <defs>
                                                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#38A3A5" />
                                                    <stop offset="100%" stopColor="#8B5CF6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <Clock className="w-5 h-5 text-osia-neutral-500 mb-1" />
                                            <span className="text-2xl font-bold text-white">{formatTime(timeLeft)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Note Input */}
                                <div className="pt-4">
                                    <input
                                        type="text"
                                        value={stepNotes[currentStep] || ''}
                                        onChange={(e) => setStepNotes({ ...stepNotes, [currentStep]: e.target.value })}
                                        placeholder="Quick note for this step (optional)..."
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-osia-neutral-600 text-center focus:border-osia-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    {!isRunning ? (
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-osia-teal-600 to-purple-600 px-12"
                            onClick={handleStart}
                        >
                            <Play className="w-5 h-5 mr-2" />
                            {currentStep === 0 ? 'Begin' : 'Resume'}
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            variant="outline"
                            className="px-12"
                            onClick={handlePause}
                        >
                            <Pause className="w-5 h-5 mr-2" />
                            Pause
                        </Button>
                    )}

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleNext}
                        disabled={isRunning}
                    >
                        Skip <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
