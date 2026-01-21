import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare } from 'lucide-react';

export function TeamSessionPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'waiting' | 'active'>('waiting');

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <AnimatePresence mode="wait">
                    {status === 'waiting' ? (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center space-y-12 py-20"
                        >
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight">Gathering signals.</h1>
                                <p className="text-osia-neutral-500 text-sm">Please provide your private reflections to the session prompts.</p>
                            </div>

                            <div className="flex justify-center gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${i <= 3 ? 'bg-osia-teal-500/20 border-osia-teal-500/40 text-osia-teal-400' : 'bg-white/5 border-white/10 text-osia-neutral-600'}`}>
                                        <Users size={20} />
                                    </div>
                                ))}
                                <div className="w-12 h-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-osia-neutral-700 animate-pulse">
                                    ?
                                </div>
                            </div>

                            <Card className="p-8 border-white/5 bg-[#0a1128]/40 max-w-lg mx-auto space-y-6">
                                <h3 className="text-lg font-bold">Waiting for 2 more members...</h3>
                                <p className="text-xs text-osia-neutral-500 leading-relaxed">
                                    Team patterns only emerge once the anonymity threshold is met. Your individual responses remain encrypted and private.
                                </p>
                                <Button onClick={() => setStatus('active')} variant="primary" className="w-full py-4 uppercase tracking-[0.2em] font-black text-xs">
                                    Simulate Full Group
                                </Button>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight">Team Pulse.</h1>
                                <p className="text-osia-neutral-500 text-sm">Collective patterns from current participants.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                                    <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Shared Clarity</div>
                                    <h4 className="text-xl font-bold">The group is reflecting on communication rhythm.</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                            <span className="text-xs text-osia-neutral-400">Alignment on goals</span>
                                            <span className="text-sm font-bold">High</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                            <span className="text-xs text-osia-neutral-400">Energy for current tasks</span>
                                            <span className="text-sm font-bold">Varied</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 border-white/5 bg-white/[0.02] space-y-6">
                                    <div className="text-[10px] font-bold text-osia-purple-500 uppercase tracking-widest">Live Dynamic</div>
                                    <p className="text-sm italic text-osia-neutral-400 leading-relaxed">
                                        Collective signals suggest a high level of "relational pause" — members are waiting for more context before moving to the next decision.
                                    </p>
                                    <div className="pt-4 flex justify-between items-center text-[10px] uppercase font-black tracking-tighter">
                                        <span className="text-osia-neutral-600">Threshold: Met</span>
                                        <span className="text-osia-purple-500">Confidence: Emerging</span>
                                    </div>
                                </Card>
                            </div>

                            <div className="pt-10 flex gap-4">
                                <Button onClick={() => alert('Shared prompt opened for all participants.')} variant="primary" className="flex-1 py-6 text-lg flex items-center justify-center gap-3">
                                    <MessageSquare size={20} />
                                    Open Shared Prompt
                                </Button>
                                <Button onClick={() => navigate('/teams')} className="px-10 py-6 text-lg border-red-500/20 text-red-500 hover:bg-red-500/5">
                                    End Session
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
