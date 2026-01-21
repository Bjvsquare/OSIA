import { Card } from '../../components/ui/Card';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { TrendingUp, AlertCircle } from 'lucide-react';

export function TeamPatternsPage() {

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">The Team Map.</h1>
                        <p className="text-osia-neutral-500 text-sm italic">Aggregate insights into group dynamics over time.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Dominant Pattern */}
                        <Card className="p-8 border-white/5 bg-osia-teal-500/[0.03] space-y-6 md:col-span-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">
                                <TrendingUp size={14} />
                                Dominant Dynamic
                            </div>
                            <h3 className="text-2xl font-bold">Synchronous Decision Momentum</h3>
                            <p className="text-sm text-osia-neutral-400 leading-relaxed max-w-2xl">
                                The team tends to move significantly faster on decisions when they occur during live synchronous sessions rather than asynchronously. This pattern has stabilized over the last 90 days.
                            </p>
                        </Card>

                        {/* Emerging Friction */}
                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-osia-purple-500 uppercase tracking-widest">
                                <AlertCircle size={14} />
                                Emerging Friction
                            </div>
                            <h4 className="text-lg font-bold">Expectation Decay</h4>
                            <p className="text-xs text-osia-neutral-500 leading-relaxed">
                                Signals suggest that shared clarity on project expectations drops significantly 72 hours after group meetings.
                            </p>
                            <div className="pt-4 border-t border-white/5">
                                <button className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest hover:text-osia-teal-400 transition-colors">
                                    Suggest Team Experiment →
                                </button>
                            </div>
                        </Card>

                        {/* Stable Strength */}
                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Stable Strength</div>
                            <h4 className="text-lg font-bold">High Psychological Safety</h4>
                            <p className="text-xs text-osia-neutral-500 leading-relaxed">
                                Patterns of open disagreement without relational residue are consistently high across all domain types.
                            </p>
                            <div className="pt-4 border-t border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-osia-neutral-700">Verified by 92% of group cycles</span>
                            </div>
                        </Card>
                    </div>

                    {/* Team Journey */}
                    <Card className="p-10 border-white/5 bg-white/[0.02] space-y-10">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest">Long-term Trajectory</h4>
                            <div className="h-2 rounded-full bg-white/5 relative">
                                <div className="absolute top-0 left-0 w-[65%] h-full bg-osia-teal-500 rounded-full shadow-[0_0_15px_rgba(56,163,165,0.4)]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <div className="text-2xl font-bold text-white">65%</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Cohesion Index</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">12</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Group Cycles</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">High</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Sync Confidence</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
