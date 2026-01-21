import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Zap, Activity, MapPin, Sparkles } from 'lucide-react';

export function DeepeningCheckIn() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        energy: 3,
        pressure: 3,
        context: '',
        trigger: ''
    });

    const handleNext = () => setStep(s => s + 1);
    const handleReset = () => {
        setStep(1);
        setData({ energy: 3, pressure: 3, context: '', trigger: '' });
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <Zap className="w-5 h-5" />
                            <h4 className="font-semibold">Energy & Pressure</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-osia-neutral-400">Energy Level (1-5)</Label>
                                <div className="flex justify-between mt-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setData({ ...data, energy: n })}
                                            className={`w-10 h-10 rounded-full border transition-all ${data.energy === n
                                                    ? 'border-osia-teal-500 bg-osia-teal-500 text-white'
                                                    : 'border-white/10 hover:border-white/30 text-osia-neutral-400'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm text-osia-neutral-400">Pressure/Stress (1-5)</Label>
                                <div className="flex justify-between mt-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setData({ ...data, pressure: n })}
                                            className={`w-10 h-10 rounded-full border transition-all ${data.pressure === n
                                                    ? 'border-amber-500 bg-amber-500 text-white'
                                                    : 'border-white/10 hover:border-white/30 text-osia-neutral-400'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleNext} className="w-full">Next</Button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <MapPin className="w-5 h-5" />
                            <h4 className="font-semibold">Context</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['Work', 'Home', 'Relationship', 'Team', 'Social', 'Solitude'].map(ctx => (
                                <button
                                    key={ctx}
                                    onClick={() => setData({ ...data, context: ctx })}
                                    className={`p-3 rounded-lg border text-sm transition-all ${data.context === ctx
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                        }`}
                                >
                                    {ctx}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleNext} disabled={!data.context} className="w-full">Next</Button>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <Activity className="w-5 h-5" />
                            <h4 className="font-semibold">Pattern Type</h4>
                        </div>
                        <Label className="text-sm text-osia-neutral-400">Is this a recurring pattern?</Label>
                        <div className="space-y-2">
                            {['One-off event', 'Not sure', 'Recurring pattern'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setData({ ...data, trigger: type });
                                        handleNext();
                                    }}
                                    className="w-full p-3 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-osia-neutral-300 text-left transition-all"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 text-osia-teal-400">
                            <Sparkles className="w-5 h-5" />
                            <h4 className="font-semibold">Check-in Complete</h4>
                        </div>
                        <div className="p-4 rounded-lg bg-osia-teal-500/5 border border-osia-teal-500/20">
                            <p className="text-sm text-osia-neutral-300 italic">
                                "Noted. Your energy is at {data.energy} while in a {data.context} context. I've flagged this as a {data.trigger.toLowerCase()}."
                            </p>
                        </div>
                        <Button onClick={handleReset} variant="outline" className="w-full">Done</Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-osia-deep-900 to-black border-white/5">
            {renderStep()}
        </Card>
    );
}
