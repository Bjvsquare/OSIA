import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Calendar, Clock, Target, Bell, TrendingUp, Sparkles } from 'lucide-react';

interface IntegrationRitualsProps {
    onComplete: (data: any) => void;
}

const CADENCE_OPTIONS = ["Weekly", "Fortnightly", "Monthly", "Only when I prompt it"];
const TIME_PREFS = ["Morning", "Midday", "Evening", "Weekend"];
const FOCUS_AREAS = ["Energy", "Stress", "Decisions", "Boundaries", "Communication", "Relationship dynamic", "Team"];
const NUDGE_STYLES = ["None", "Gentle reminder", "Ask me one question", "Show me one insight"];

export function IntegrationRituals({ onComplete }: IntegrationRitualsProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        cadence: '',
        timePref: '',
        focusAreas: [] as string[],
        nudgeStyle: '',
        progressIndicator: ''
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const toggleFocusArea = (area: string) => {
        setData(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.includes(area)
                ? prev.focusAreas.filter(a => a !== area)
                : [...prev.focusAreas, area].slice(0, 2)
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
                            <Calendar className="w-5 h-5" />
                            <h4 className="font-semibold">Preferred Rhythm</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">How often should we sync on your growth?</Label>
                        <div className="grid grid-cols-1 gap-3">
                            {CADENCE_OPTIONS.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setData({ ...data, cadence: option })}
                                    className={`p-4 rounded-xl border text-left text-sm transition-all ${data.cadence === option
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleNext} disabled={!data.cadence} className="w-full">Next</Button>
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
                            <Clock className="w-5 h-5" />
                            <h4 className="font-semibold">Timing</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">When is the least annoying time to check in?</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {TIME_PREFS.map(pref => (
                                <button
                                    key={pref}
                                    onClick={() => setData({ ...data, timePref: pref })}
                                    className={`p-4 rounded-xl border text-center text-sm transition-all ${data.timePref === pref
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {pref}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={!data.timePref} className="flex-1">Next</Button>
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
                            <Target className="w-5 h-5" />
                            <h4 className="font-semibold">Focus Areas</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">Choose 1–2 areas to keep warm</Label>
                        <div className="flex flex-wrap gap-2">
                            {FOCUS_AREAS.map(area => (
                                <button
                                    key={area}
                                    onClick={() => toggleFocusArea(area)}
                                    className={`px-4 py-2 rounded-full border text-xs transition-all ${data.focusAreas.includes(area)
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={data.focusAreas.length === 0} className="flex-1">Next</Button>
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
                            <Bell className="w-5 h-5" />
                            <h4 className="font-semibold">Nudge Style</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">What kind of nudge is acceptable?</Label>
                        <div className="grid grid-cols-1 gap-3">
                            {NUDGE_STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setData({ ...data, nudgeStyle: style })}
                                    className={`p-4 rounded-xl border text-left text-sm transition-all ${data.nudgeStyle === style
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
                            <Button onClick={handleNext} disabled={!data.nudgeStyle} className="flex-1">Next</Button>
                        </div>
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="font-semibold">Progress Indicator</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">If you had to track one indicator of progress, what would it be?</Label>
                        <textarea
                            className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-osia-teal-500 transition-colors placeholder:text-osia-neutral-600"
                            placeholder="e.g. My ability to pause before reacting in high-stakes meetings..."
                            value={data.progressIndicator}
                            onChange={(e) => setData({ ...data, progressIndicator: e.target.value })}
                        />
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={() => onComplete(data)} disabled={!data.progressIndicator} className="flex-1">Complete Rituals</Button>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="p-8 bg-gradient-to-br from-osia-deep-900 to-black border-white/5">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-osia-teal-500" />
                    <h3 className="text-xl font-bold text-white">Integration Rituals</h3>
                </div>
                <div className="text-xs text-osia-neutral-500 uppercase tracking-widest">
                    Step {step} of 5
                </div>
            </div>
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
            <div className="mt-8 p-4 rounded-xl bg-osia-teal-500/5 border border-osia-teal-500/10">
                <p className="text-[10px] text-osia-neutral-500 leading-relaxed text-center">
                    Rituals help OSIA align with your natural rhythm.
                    You can adjust these settings at any time in your profile.
                </p>
            </div>
        </Card>
    );
}
