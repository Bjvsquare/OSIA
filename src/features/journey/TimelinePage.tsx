import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Calendar } from 'lucide-react';

export function TimelinePage() {

    const timelineData = [
        { date: '2 weeks ago', event: 'Conversation that felt stuck', layer: 'Relational Dynamics', status: 'Friction' },
        { date: '10 days ago', event: 'Clear decision under pressure', layer: 'Decision Patterns', status: 'Aligned' },
        { date: 'Today', event: 'Noticed energy dip in morning', layer: 'Energy & Recovery', status: 'Stable' }
    ];

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Your map over time.</h1>
                        <p className="text-osia-neutral-500 text-sm italic">Patterns shift, stabilise, and reconfigure.</p>
                    </div>

                    {/* Timeline Controls */}
                    <div className="flex justify-center">
                        <div className="inline-flex bg-white/5 rounded-full p-1 border border-white/5">
                            {['7 days', '30 days', '90 days'].map((range, i) => (
                                <button
                                    key={range}
                                    onClick={() => alert(`Showing history for the last ${range}.`)}
                                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${i === 1 ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-500 hover:text-white'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Interaction Area (Visual representation) */}
                    <div className="relative h-[400px] border border-white/5 bg-black/40 rounded-3xl p-8 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-osia-teal-500/5 to-osia-purple-500/5 blur-3xl" />

                        {/* Mock Timeline Axes */}
                        <div className="absolute bottom-8 left-8 right-8 h-px bg-white/10" />
                        <div className="absolute top-8 bottom-8 left-8 w-px bg-white/10" />

                        {/* Floating Layers Visual */}
                        <div className="relative z-10 space-y-8 w-full">
                            {[
                                { name: 'Decision Patterns', status: 'stable', color: 'osia-teal-500' },
                                { name: 'Energy & Recovery', status: 'shifting', color: 'osia-purple-400' },
                                { name: 'Relational Dynamics', status: 'emerging', color: 'osia-neutral-400' }
                            ].map((layer, i) => (
                                <div key={i} className="flex items-center gap-6">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-osia-neutral-500 w-32">{layer.name}</div>
                                    <div className="flex-1 h-[2px] relative">
                                        <div className="absolute inset-0 bg-white/5" />
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${60 + i * 15}%` }}
                                            transition={{ duration: 1.5, delay: i * 0.2 }}
                                            className={`h-full bg-${layer.color} relative`}
                                        >
                                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-${layer.color} shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Narrative Highlights */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-8 border-white/5 bg-white/[0.02] space-y-4 border-l-2 border-l-osia-teal-500">
                            <h3 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Decision Patterns</h3>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                Over the past 30 days, this layer has become more stable. Fewer new signals are changing the core pattern.
                            </p>
                        </Card>
                        <Card className="p-8 border-white/5 bg-white/[0.02] space-y-4 border-l-2 border-l-osia-purple-500">
                            <h3 className="text-[10px] font-bold text-osia-purple-500 uppercase tracking-widest">Energy & Recovery</h3>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                Energy-related signals fluctuate depending on context. No single pattern has stabilised yet.
                            </p>
                        </Card>
                    </div>

                    {/* Historical List */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Moments you noted</h3>
                        <div className="space-y-3">
                            {timelineData.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => alert(`Opening reflection for: ${item.event}`)}
                                    className="w-full text-left group"
                                >
                                    <Card className="p-4 border-white/5 bg-[#0a1128]/40 hover:border-white/20 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-osia-neutral-500 group-hover:text-osia-teal-500 transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white group-hover:text-osia-teal-500 transition-colors">{item.event}</div>
                                                <div className="text-[10px] text-osia-neutral-600 font-bold uppercase tracking-widest">{item.layer} · {item.date}</div>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.status === 'Aligned' ? 'bg-osia-teal-500/10 text-osia-teal-500' :
                                            item.status === 'Stable' ? 'bg-white/10 text-white' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </Card>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
