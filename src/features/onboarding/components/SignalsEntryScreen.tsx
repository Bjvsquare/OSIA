import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface SignalsEntryScreenProps {
    onComplete: (data: any) => void;
    onSkip: () => void;
}

export const SignalsEntryScreen: React.FC<SignalsEntryScreenProps> = ({ onComplete, onSkip }) => {
    const [selectedWords, setSelectedWords] = useState<Record<string, string[]>>({
        best: [],
        pressure: [],
        energize: [],
        drain: []
    });
    const [customWord, setCustomWord] = useState('');
    const [situation, setSituation] = useState('');

    const toggleWord = (bucket: string, word: string) => {
        setSelectedWords(prev => {
            const current = prev[bucket];
            if (current.includes(word)) {
                return { ...prev, [bucket]: current.filter(w => w !== word) };
            }
            return { ...prev, [bucket]: [...current, word] };
        });
    };

    const wordOptions = {
        best: ["Calm", "Curious", "Direct", "Warm", "Focused", "Playful", "Grounded", "Decisive", "Reflective", "Open", "Independent", "Collaborative"],
        pressure: ["Withdrawn", "Overthinking", "Impatient", "Reactive", "Guarded", "Avoidant", "Controlling", "Anxious", "Blunt", "Rigid", "Self-critical", "Tense"],
        energize: ["Open-ended conversations", "Clear goals", "Creative problem-solving", "Structure and routines", "Autonomy", "Collaboration", "Learning something new", "Helping others", "Quiet focus time"],
        drain: ["Ambiguity without context", "Conflict avoidance", "Constant urgency", "Micromanagement", "Unclear expectations", "Over-socialising", "Isolation", "Repetitive tasks", "High emotional tension"]
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 py-12 px-6 animate-in fade-in duration-700">
            {/* Header */}
            <header className="text-center space-y-6 max-w-2xl mx-auto">
                <img src="/logo.png" alt="OSIA" className="h-6 w-auto mx-auto opacity-80" />
                <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Let’s start with a<br />few small signals<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-sm font-medium">
                    There are no right answers here. Share what feels easy — you can skip anything.
                </p>
                <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest font-bold">
                    Step 1 of 3 — ~2 minutes
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bucket 1: Best */}
                <Card className="p-6 space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">When you’re at your best, which words fit you?</h4>
                        <p className="text-[10px] text-osia-neutral-500 italic">Choose up to 5. Go with what feels true, not ideal.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {wordOptions.best.map(word => (
                            <button
                                key={word}
                                onClick={() => toggleWord('best', word)}
                                className={`tag-glow ${selectedWords.best.includes(word) ? 'tag-glow-active' : ''}`}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <label className="text-[10px] text-osia-neutral-500 font-bold uppercase tracking-widest">You can add your own words if none fit.</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add your own word..."
                                value={customWord}
                                onChange={e => setCustomWord(e.target.value)}
                                className="h-9 text-xs bg-white/[0.02]"
                            />
                            <Button size="sm" variant="outline" className="h-9 px-4" onClick={() => {
                                if (customWord.trim()) {
                                    toggleWord('best', customWord.trim());
                                    setCustomWord('');
                                }
                            }}>Add</Button>
                        </div>
                    </div>
                </Card>

                {/* Bucket 3: Energize */}
                <Card className="p-6 space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">What tends to energise you?</h4>
                        <p className="text-[10px] text-osia-neutral-500 italic">Choose up to 3.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {wordOptions.energize.map(word => (
                            <button
                                key={word}
                                onClick={() => toggleWord('energize', word)}
                                className={`tag-glow ${selectedWords.energize.includes(word) ? 'tag-glow-active' : ''}`}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Bucket 2: Pressure */}
                <Card className="p-6 space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">When you’re under pressure, which words tend to show up?</h4>
                        <p className="text-[10px] text-osia-neutral-500 italic">Again, choose up to 5. This isn’t a flaw list — just noticing patterns.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {wordOptions.pressure.map(word => (
                            <button
                                key={word}
                                onClick={() => toggleWord('pressure', word)}
                                className={`tag-glow ${selectedWords.pressure.includes(word) ? 'tag-glow-active' : ''}`}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Bucket 4: Drain */}
                <Card className="p-6 space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">What tends to drain you?</h4>
                        <p className="text-[10px] text-osia-neutral-500 italic">Choose up to 3.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {wordOptions.drain.map(word => (
                            <button
                                key={word}
                                onClick={() => toggleWord('drain', word)}
                                className={`tag-glow ${selectedWords.drain.includes(word) ? 'tag-glow-active' : ''}`}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Optional Situation */}
                <Card className="p-6 space-y-4 md:col-span-2">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Optional: think of a recent situation that stands out.</h4>
                        <p className="text-[10px] text-osia-neutral-500 italic">A sentence or two is enough. You can also skip this.</p>
                    </div>
                    <Input
                        as="textarea"
                        placeholder="For example: a decision, a conversation, or a moment of friction..."
                        value={situation}
                        onChange={e => setSituation(e.target.value)}
                        className="bg-white/[0.02]"
                    />
                    <div className="text-[9px] text-osia-neutral-600 font-bold uppercase tracking-widest text-right">
                        1–3 sentences is plenty. This stays private unless you explicitly choose to share it later.
                    </div>
                </Card>
            </div>

            {/* Bottom Insight Box */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-osia-teal-500/5 border border-osia-teal-500/10 text-center">
                <p className="text-[10px] text-osia-neutral-400 font-medium italic">
                    OSIA looks for patterns only when signals repeat.<br />
                    Early insights are marked as emerging and change easily.
                </p>
            </div>

            {/* Actions */}
            <footer className="pt-8 text-center flex flex-col items-center gap-6">
                <Button variant="primary" size="lg" className="px-16" onClick={() => onComplete({ selectedWords, situation })}>
                    Generate my first insights
                </Button>
                <button onClick={onSkip} className="text-xs font-bold text-osia-neutral-400 hover:text-white underline underline-offset-8 decoration-white/10 transition-all">
                    Skip for now
                </button>
            </footer>
        </div>
    );
};
