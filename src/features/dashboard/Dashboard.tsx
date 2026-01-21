import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useOnboarding } from '../onboarding/context/OnboardingContext';
import {
    Network,
    Calendar,
    LayoutGrid,
    Plus,
    ArrowUpRight,
    MessageSquare,
    Activity
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OriginOrb } from '../../components/viz/OriginOrb';

// Mock traits for fallback
const mockTraits = Array(24).fill(0).map((_, i) => ({
    trait_id: `trait-${i}`,
    score: 30 + Math.random() * 70, // Random 30-100
    confidence: 0.8
}));

export function Dashboard() {
    const { state, dispatch } = useOnboarding();
    const { userProfile } = useAuth();
    const [view, setView] = useState<'map' | 'timeline' | 'cards'>('map');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'home_viewed',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'HOME',
                consent_snapshot: {},
                properties: { view }
            }
        });
    }, []);


    const handleViewToggle = (newView: 'map' | 'timeline' | 'cards') => {
        setView(newView);
        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'home_view_toggle_changed',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'HOME',
                consent_snapshot: {},
                properties: { view: newView }
            }
        });
    };


    return (
        <div className="min-h-screen bg-osia-deep-900 text-white flex flex-col">

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Main Canvas Area */}
                <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-osia-teal-900/10 via-transparent to-transparent">
                    {view === 'map' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full max-w-2xl max-h-[80vh]">
                                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} intensity={1} />
                                    <OriginOrb
                                        traits={userProfile?.origin_seed_profile?.trait_vector || mockTraits}
                                        scale={1.5}
                                    />
                                    <EffectComposer>
                                        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                                    </EffectComposer>
                                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                                </Canvas>

                                {/* Overlay Label */}
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                    <h3 className="text-xl font-bold text-white tracking-widest uppercase">OSIA</h3>
                                    <p className="text-sm text-osia-teal-400 font-mono mt-1">
                                        {userProfile?.origin_seed_profile ? `Precision: ${userProfile.origin_seed_profile.precision}` : 'Visualizing Data'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Toggles */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-osia-deep-800/80 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl">
                        {[
                            { id: 'map', icon: Network, label: 'Map' },
                            { id: 'timeline', icon: Calendar, label: 'Timeline' },
                            { id: 'cards', icon: LayoutGrid, label: 'Cards' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleViewToggle(t.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${view === t.id
                                    ? 'bg-osia-teal-500 text-white shadow-lg'
                                    : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Rail / Sidebar */}
                <aside className="w-full lg:w-[400px] border-l border-white/5 bg-osia-deep-900/30 backdrop-blur-sm p-6 space-y-8 overflow-y-auto">
                    {/* Focus Module */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-osia-neutral-500 uppercase tracking-wider">Today's Focus</h3>
                        <Card className="p-5 border-osia-teal-500/20 bg-osia-teal-500/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-osia-teal-500/20 rounded-xl flex items-center justify-center text-osia-teal-400">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Energy Calibration</p>
                                    <p className="text-xs text-osia-neutral-500">2-min check-in available</p>
                                </div>
                            </div>
                            <Button variant="primary" className="w-full py-2.5 text-sm">
                                Start Check-in
                            </Button>
                        </Card>
                    </div>

                    {/* Latest Insights */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-osia-neutral-500 uppercase tracking-wider">Latest Insights</h3>
                            <button className="text-xs text-osia-teal-500 hover:underline">View all</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { title: 'Energy Resilience', summary: 'High resilience in pressure situations.', confidence: 'Moderate' },
                                { title: 'Self-Articulated', summary: 'Precise emotional vocabulary detected.', confidence: 'Developing' }
                            ].map((insight, i) => (
                                <Card key={i} className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                                        <ArrowUpRight size={14} className="text-osia-neutral-500 group-hover:text-osia-teal-500 transition-colors" />
                                    </div>
                                    <p className="text-xs text-osia-neutral-400 mb-3">{insight.summary}</p>
                                    <span className="text-[10px] bg-white/10 text-osia-neutral-500 px-1.5 py-0.5 rounded uppercase font-bold">
                                        {insight.confidence}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Connections Module */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-osia-neutral-500 uppercase tracking-wider">Connections</h3>
                        <Card className="p-4 bg-white/5 border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-osia-neutral-500">
                                    <Plus size={16} />
                                </div>
                                <span className="text-sm text-osia-neutral-400">Add collaborator</span>
                            </div>
                            <button
                                onClick={() => dispatch({ type: 'RECORD_EVENT', payload: { event_id: crypto.randomUUID(), event_name: 'connect_add_clicked', occurred_at: new Date().toISOString(), user_id: userProfile?.id || 'anonymous', session_id: state.sessionId, screen_id: 'HOME', consent_snapshot: {}, properties: { enabled_by_consent: false } } })}
                                className="p-2 hover:bg-white/10 rounded-lg text-osia-teal-500 transition-colors"
                            >
                                <MessageSquare size={18} />
                            </button>
                        </Card>
                    </div>
                </aside>
            </main>

            {/* Node Detail Drawer (Mock) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed inset-y-0 right-0 w-full lg:w-[400px] bg-osia-deep-800 border-l border-white/10 shadow-2xl z-50 p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white">Layer Detail</h2>
                            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-full text-osia-neutral-400">
                                <Plus className="rotate-45" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-osia-teal-500/10 border border-osia-teal-500/20">
                                <p className="text-sm text-osia-teal-400 font-medium mb-1">Status: Developed</p>
                                <p className="text-xs text-osia-neutral-400">High signal density from baseline onboarding.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-white">Hypothesis</h3>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                    Your core disposition is oriented towards rapid adaptation.
                                    You process information in parallel streams, favoring breadth over deep singular focus.
                                </p>
                            </div>
                            <Button variant="primary" className="w-full">Strengthen this Layer</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
