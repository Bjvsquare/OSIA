import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RitualSetup } from './components/RitualSetup';
import { NudgeSettings } from './components/NudgeSettings';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, Bell, Plus, ArrowRight, Target } from 'lucide-react';
import { intelligence } from '../../services/intelligence';
import { useOnboarding } from '../onboarding/context/OnboardingContext';

export function RitualsPage() {
    const { state } = useOnboarding();
    const [activeTab, setActiveTab] = useState<'rituals' | 'settings'>('rituals');
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [selectedRitual, setSelectedRitual] = useState<any>(null);

    useEffect(() => {
        if (!state || !state.answers) return;
        const layers = intelligence.calculateLayers(state.answers);
        const recs = intelligence.getRecommendedRituals(layers);
        setRecommendations(recs);
    }, [state?.answers]);

    const handleRitualComplete = () => {
        setSelectedRitual(null);
    };

    if (selectedRitual) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRitual(null)}>
                        Back to Rituals
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Configure Ritual</h1>
                </div>
                <RitualSetup ritual={selectedRitual} onComplete={handleRitualComplete} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Integration & Rituals</h1>
                    <p className="text-osia-neutral-400 mt-1">Translate your digital twin insights into daily action.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('rituals')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'rituals' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Rituals</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'settings' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        <span>Nudges</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'rituals' ? (
                    <motion.div
                        key="rituals"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    Recommended for You
                                    <Sparkles className="w-4 h-4 text-osia-teal-400" />
                                </h2>
                                <div className="space-y-4">
                                    {recommendations.map((ritual) => (
                                        <Card key={ritual.id} className="p-6 hover:border-osia-teal-500/30 transition-colors group">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded bg-osia-teal-500/10 text-osia-teal-400 text-[10px] font-bold uppercase tracking-wider">
                                                            {ritual.type}
                                                        </span>
                                                        <span className="text-xs text-osia-neutral-500">{ritual.duration}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-osia-teal-300 transition-colors">
                                                        {ritual.title}
                                                    </h3>
                                                    <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                                        {ritual.description}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="shrink-0 bg-osia-teal-600/20 text-osia-teal-400 border border-osia-teal-500/30 hover:bg-osia-teal-600 hover:text-white"
                                                    onClick={() => setSelectedRitual(ritual)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white">Active Rituals</h2>
                                <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                            <Plus className="w-6 h-6 text-osia-neutral-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-osia-neutral-400">No active rituals yet.</p>
                                            <p className="text-xs text-osia-neutral-500">Select a recommendation to get started.</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <Card className="p-8 bg-osia-teal-500/5 border-osia-teal-500/20">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="p-4 rounded-2xl bg-osia-teal-500/10">
                                    <Target className="w-12 h-12 text-osia-teal-400" />
                                </div>
                                <div className="space-y-2 flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white">Integration Milestone</h3>
                                    <p className="text-osia-neutral-400">
                                        You've mapped your foundation and established your first team context.
                                        Now, consistent rituals will help you deepen these patterns.
                                    </p>
                                </div>
                                <Button className="bg-osia-teal-600 hover:bg-osia-teal-500">
                                    View Progress <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <NudgeSettings />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
