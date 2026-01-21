import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Bell, ShieldCheck, Info } from 'lucide-react';
import { api } from '../../../services/api';

export function NudgeSettings() {
    const [settings, setSettings] = useState({
        style: 'Gentle reminder',
        frequency: 'Once daily',
        enabled: true
    });

    const handleSave = async () => {
        await api.updateNudgeSettings(settings);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bell className="w-6 h-6 text-osia-teal-400" />
                    Integration Nudges
                </h2>
                <p className="text-osia-neutral-400">
                    Control how OSIA interacts with your daily flow. Nudges are designed to be supportive, not addictive.
                </p>
            </div>

            <Card className="p-8 space-y-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-white">Enable Nudges</Label>
                            <p className="text-xs text-osia-neutral-500">Toggle all integration reminders.</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-osia-teal-600' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={`space-y-4 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-osia-neutral-300">Nudge Style</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {['Gentle reminder', 'One question check-in', 'Show me one insight'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSettings({ ...settings, style: s })}
                                        className={`p-4 rounded-xl border text-left transition-all ${settings.style === s
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-osia-neutral-300">Max Frequency</Label>
                            <div className="flex gap-3">
                                {['Once daily', 'Twice daily', 'Weekly'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setSettings({ ...settings, frequency: f })}
                                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${settings.frequency === f
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                            : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-osia-neutral-500">
                        <ShieldCheck className="w-4 h-4 text-osia-teal-500" />
                        No gamification. No streak pressure.
                    </div>
                    <Button
                        onClick={handleSave}
                        className="bg-osia-teal-600 hover:bg-osia-teal-500 px-8"
                    >
                        Save Preferences
                    </Button>
                </div>
            </Card>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-osia-neutral-400 leading-relaxed">
                    OSIA follows an ethical interaction model. We will never use "streaks" or variable rewards to drive engagement. Nudges are strictly for integration support.
                </p>
            </div>
        </div>
    );
}
