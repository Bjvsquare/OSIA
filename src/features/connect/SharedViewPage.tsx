import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { RefreshCcw } from 'lucide-react';

export function SharedViewPage() {

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">What’s emerging between you.</h1>
                        <p className="text-osia-neutral-500 text-sm italic">These patterns reflect shared inputs — not personal profiles.</p>
                    </div>

                    {/* Shared Summary */}
                    <Card className="p-8 border-white/5 bg-osia-teal-500/[0.03] text-center space-y-4">
                        <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">In one glance</div>
                        <p className="text-xl font-medium text-white max-w-2xl mx-auto leading-relaxed">
                            OSIA is seeing early patterns around how energy rises in open-ended conversations and dips when expectations remain implicit.
                        </p>
                    </Card>

                    {/* Shared Pattern Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-white">Energy Alignment</h3>
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-osia-teal-500/10 text-osia-teal-500">Developing</span>
                            </div>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed italic">
                                Energy between you tends to increase when conversations feel exploratory rather than tightly structured.
                            </p>
                            <div className="space-y-3">
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Often shows up as:</div>
                                <ul className="space-y-2">
                                    {['More engagement during open discussion', 'Less energy when rules are fixed early'].map(item => (
                                        <li key={item} className="text-xs text-osia-neutral-500 flex gap-2">
                                            <span className="text-osia-teal-500">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>

                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-white">Expectation Clarity</h3>
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-osia-purple-500/10 text-osia-purple-500">Emerging</span>
                            </div>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed italic">
                                Friction appears more often when expectations aren’t named explicitly.
                            </p>
                            <div className="space-y-3">
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Often shows up as:</div>
                                <ul className="space-y-2">
                                    {['Misalignment around timing', 'Assumptions filling in context'].map(item => (
                                        <li key={item} className="text-xs text-osia-neutral-500 flex gap-2">
                                            <span className="text-osia-purple-500">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    </div>

                    {/* Shared Experiment */}
                    <Card className="p-10 border-white/5 bg-osia-teal-500/[0.03]">
                        <div className="max-w-2xl space-y-6">
                            <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-[0.3em]">Something to try together</div>
                            <h3 className="text-2xl font-bold tracking-tight">Before your next important interaction, agree on one expectation and one uncertainty at the start.</h3>
                            <div className="flex gap-4 pt-4">
                                <Button onClick={() => alert('Shared experiment accepted.')} variant="primary" className="px-8 flex items-center gap-2">
                                    <RefreshCcw size={14} />
                                    We'll try this
                                </Button>
                                <Button onClick={() => alert('Shared experiment skipped.')} variant="secondary" className="px-8">Not now</Button>
                            </div>
                        </div>
                    </Card>

                    <footer className="pt-16 border-t border-white/5 flex flex-col items-center gap-8">
                        <div className="text-center space-y-4">
                            <div className="text-[10px] font-black text-white uppercase tracking-widest">Control & boundaries</div>
                            <ul className="text-xs text-osia-neutral-500 space-y-1">
                                <li>Either person can end the shared view at any time</li>
                                <li>Ending the session deletes shared patterns from our active processing</li>
                                <li>Personal maps remain unchanged and private</li>
                            </ul>
                        </div>
                        <p className="text-[9px] text-osia-neutral-700 font-bold uppercase tracking-widest">Symmetrical, Consensual, Limited.</p>
                    </footer>
                </motion.div>
            </main>
        </div>
    );
}
