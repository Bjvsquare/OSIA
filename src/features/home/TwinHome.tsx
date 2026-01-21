import React, { useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlueprintOrb } from './components/BlueprintOrb';

interface LayerTileProps {
    id: string;
    name: string;
    status: 'Emerging' | 'Developing' | 'Stable' | 'Later';
    onClick: () => void;
}

const LayerTile: React.FC<LayerTileProps> = ({ name, status, onClick }) => {
    const isLater = status === 'Later';

    return (
        <motion.div
            whileHover={!isLater ? { scale: 1.02 } : {}}
            whileTap={!isLater ? { scale: 0.98 } : {}}
            onClick={!isLater ? onClick : undefined}
            className={`cursor-pointer group relative ${isLater ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
        >
            <Card className={`p-6 border-white/5 bg-[#0a1128]/40 backdrop-blur-3xl transition-all duration-300 ${!isLater ? 'hover:border-osia-teal-500/30 hover:shadow-[0_0_30px_rgba(56,163,165,0.1)]' : ''}`}>
                <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 group-hover:text-osia-teal-500 transition-colors">
                        {name}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${status === 'Stable' ? 'bg-osia-teal-500/20 text-osia-teal-400' :
                            status === 'Developing' ? 'bg-white/10 text-white' :
                                status === 'Emerging' ? 'bg-osia-purple-500/20 text-osia-purple-400' :
                                    'bg-white/5 text-osia-neutral-600'
                            }`}>
                            {status}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

import { useAuth } from '../auth/AuthContext';

export function TwinHome() {
    const navigate = useNavigate();
    const { showToast, ToastComponent } = useToast();
    const { userProfile, refreshProfile } = useAuth();

    const [searchParams] = useSearchParams();

    React.useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            console.log(`[TwinHome] Detected session_id ${sessionId}, refreshing profile...`);
            // Add a small delay for simulation reliability if needed, 
            // but refreshProfile itself might be enough
            setTimeout(() => {
                refreshProfile();
                showToast('Identity updated. New subscription active.', 'success');
            }, 1500);
        }
    }, [searchParams, refreshProfile, showToast]);

    const traits = useMemo(() => {
        return userProfile?.origin_seed_profile?.traits || [];
    }, [userProfile]);

    const layers = [
        { id: 'decision_patterns', name: 'Decision Patterns', status: 'Developing' as const },
        { id: 'energy_recovery', name: 'Energy & Recovery', status: 'Stable' as const },
        { id: 'relational_dynamics', name: 'Relational Dynamics', status: 'Emerging' as const },
        { id: 'communication_style', name: 'Communication Style', status: 'Developing' as const },
        { id: 'growth_edge', name: 'Growth Edge', status: 'Later' as const }
    ];

    return (
        <div className="w-full min-h-[calc(100vh-7rem)] text-white relative flex flex-col group/home pb-8">
            {/* Main Visual Section */}
            <div className="flex-1 relative flex flex-col">
                <div className="grid grid-cols-12 gap-8 items-start">
                    {/* Orb Visualizer */}
                    <div data-tour="blueprint-orb" className="lg:col-span-12 xl:col-span-9 relative flex items-center justify-center bg-white/[0.01] rounded-3xl border border-white/5 overflow-hidden min-h-[500px] lg:h-[70vh]">
                        {/* Dynamic Framing Indicator */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-osia-deep-900/60 to-transparent pointer-events-none z-10" />

                        <div className="w-full h-full relative z-0">
                            <Canvas
                                shadows
                                camera={{ position: [0, 0, 70], fov: 35 }}
                                gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
                            >
                                <color attach="background" args={['#050816']} />
                                <Suspense fallback={null}>
                                    <BlueprintOrb traits={traits} />
                                    <ContactShadows
                                        position={[0, -15, 0]}
                                        opacity={0.3}
                                        scale={40}
                                        blur={2.5}
                                        far={4.5}
                                    />
                                    <ambientLight intensity={0.4} />
                                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
                                    <pointLight position={[-10, -10, 5]} intensity={1} color="#ff00ff" />
                                </Suspense>
                                <OrbitControls
                                    enablePan={false}
                                    enableZoom={false}
                                    minPolarAngle={Math.PI / 2.5}
                                    maxPolarAngle={Math.PI / 1.5}
                                />

                                <EffectComposer multisampling={4}>
                                    <Bloom luminanceThreshold={1} intensity={0.3} levels={9} mipmapBlur />
                                    <Vignette eskil={false} offset={0.1} darkness={0.9} />
                                </EffectComposer>
                            </Canvas>
                        </div>

                        {/* Centered Snapshot Label */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="space-y-1"
                            >
                                <div className="text-[9px] font-black uppercase tracking-[0.5em] text-osia-teal-500 text-glow">
                                    Neural Architecture
                                </div>
                                <div className="text-white text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                                    Digital Twin Snapshot
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Layer Grid Sidebar */}
                    <div data-tour="layer-cards" className="lg:col-span-12 xl:col-span-3 space-y-8 flex flex-col">
                        <div className="grid gap-3 pt-4 lg:pt-0">
                            {layers.map((layer) => (
                                <LayerTile
                                    key={layer.id}
                                    {...layer}
                                    onClick={() => navigate(`/layer/${layer.id}`)}
                                />
                            ))}
                        </div>

                        {/* Journey Metadata */}
                        <Card className="p-5 border-white/5 bg-white/[0.01] shrink-0">
                            <div className="space-y-4">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-osia-neutral-500 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-osia-teal-500" />
                                    Phase Progression
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black uppercase text-osia-teal-500">Forming</div>
                                        <div className="w-full h-1 bg-osia-teal-500/20 rounded-full overflow-hidden">
                                            <div className="w-2/3 h-full bg-osia-teal-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black uppercase text-white/40">Syncing</div>
                                        <div className="w-full h-1 bg-white/5 rounded-full" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black uppercase text-white/20">Stable</div>
                                        <div className="w-full h-1 bg-white/5 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <ToastComponent />
        </div>
    );
}
