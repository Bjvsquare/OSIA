import { useState, Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload, Points, PointMaterial, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, Scanline } from '@react-three/postprocessing';
import { LayerVisualizer } from './components/LayerVisualizer';
import { useAuth } from '../auth/AuthContext';
import type { Trait } from '../blueprint/TraitTranslator';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import * as THREE from 'three';

function CosmicDust() {
    const points = useMemo(() => {
        const p = new Float32Array(3000 * 3);
        for (let i = 0; i < 3000; i++) {
            p[i * 3] = (Math.random() - 0.5) * 60;
            p[i * 3 + 1] = (Math.random() - 0.5) * 60;
            p[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        return p;
    }, []);

    const ref = useRef<THREE.Points>(null!);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.01;
            ref.current.rotation.z = state.clock.getElapsedTime() * 0.005;
        }
    });

    return (
        <Points ref={ref} positions={points} stride={3}>
            <PointMaterial
                transparent
                color="#00ffff"
                size={0.06}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.5}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

function CalloutBubble({ name, description }: { name: string, description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col gap-1"
        >
            <div className="bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/30 px-5 py-3 rounded-[2rem] rounded-bl-none shadow-[0_0_30px_rgba(0,255,255,0.1)] min-w-[220px]">
                <div className="text-[12px] font-black text-cyan-300 uppercase tracking-[0.2em] mb-1">
                    {name}
                </div>
                <div className="text-[10px] text-white/50 leading-relaxed max-w-[180px]">
                    {description}
                </div>
                {/* Visual "tail" or pointer like in the image */}
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-cyan-500/10 border-l border-b border-cyan-500/30 transform rotate-45" />
            </div>
        </motion.div>
    );
}

export function LayerLabPage() {
    const { userProfile } = useAuth();
    const [selectedLayer, setSelectedLayer] = useState<Trait | null>(null);
    const [isHovered, setIsHovered] = useState<string | null>(null);

    const traits = useMemo(() => {
        return userProfile?.origin_seed_profile?.traits || [];
    }, [userProfile]);

    const hoveredTrait = useMemo(() => {
        if (!isHovered) return null;
        if (isHovered === 'center') return { name: 'Origin Core', description: 'Primary essence signature' };
        const trait = traits.find((t: Trait) => t.id === isHovered);
        return trait ? { name: trait.name, description: 'Stabilizing resonance...' } : null;
    }, [isHovered, traits]);

    return (
        <div className="relative w-full h-screen bg-transparent overflow-hidden select-none">
            <Canvas
                className="w-full h-full"
                gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={[0, 8, 28]} fov={30} />
                <OrbitControls enablePan={false} minDistance={20} maxDistance={60} makeDefault autoRotate autoRotateSpeed={0.15} />

                <Suspense fallback={null}>
                    <CosmicDust />

                    <ambientLight intensity={0.6} />

                    {/* Specialized Nebula Color Pools */}
                    <pointLight position={[15, 5, -10]} intensity={6} distance={30} color="#ff00ff" />
                    <pointLight position={[-15, -5, -10]} intensity={4} distance={30} color="#00ffff" />
                    <pointLight position={[0, 15, 5]} intensity={3} color="#ffffff" />

                    <LayerVisualizer
                        traits={traits}
                        onSelectLayer={setSelectedLayer}
                        onHoverLayer={setIsHovered}
                        hoveredLayer={isHovered}
                    />

                    {/* Literal 3D Callouts */}
                    <AnimatePresence>
                        {isHovered && hoveredTrait && (
                            <Html
                                position={[0, 0, 0]} // Ideally this should be the node's position, 
                                // but we tethered to IDs. We can pass pos in Phase 4.
                                distanceFactor={1}
                                center
                            >
                                <CalloutBubble name={hoveredTrait.name} description={hoveredTrait.description} />
                            </Html>
                        )}
                    </AnimatePresence>

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.05} mipmapBlur intensity={2.0} radius={0.5} />
                        <Noise opacity={0.1} />
                        <Scanline opacity={0.05} density={1.2} />
                        <Vignette darkness={1.3} offset={0.3} />
                    </EffectComposer>

                    <Preload all />
                </Suspense>
            </Canvas>

            {/* Platform Branding Overlays */}
            <div className="absolute top-16 left-16 z-10 pointer-events-none">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-[1px] bg-cyan-500/50" />
                    <span className="text-[12px] text-cyan-400 tracking-[0.6em] uppercase font-black italic">OSIA Laboratory</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                    Architectural <br /> <span className="text-cyan-500">Signature</span>
                </h1>
            </div>

            {/* Selected Panel */}
            <AnimatePresence>
                {selectedLayer && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 100 }}
                        className="absolute right-16 top-16 bottom-16 w-[500px] bg-[#020205]/90 backdrop-blur-[60px] border border-white/5 rounded-[3rem] p-16 text-white shadow-[0_0_100px_rgba(0,0,0,0.5)] z-20 flex flex-col"
                    >
                        <button onClick={() => setSelectedLayer(null)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors">
                            <X size={32} strokeWidth={3} />
                        </button>

                        <div className="mb-14">
                            <div className="text-[12px] uppercase tracking-[0.5em] text-cyan-500 mb-6 font-black italic">Active Resonance Node</div>
                            <h2 className="text-6xl font-black text-white mb-6 leading-none tracking-tighter uppercase italic">{selectedLayer.name}</h2>
                            <div className="h-2 w-32 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,1)]" />
                        </div>

                        <p className="text-white/60 leading-[2] mb-14 text-xl font-light italic">
                            {selectedLayer.description}
                        </p>

                        <div className="mt-auto space-y-12">
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[12px] uppercase tracking-[0.4em] text-white/30 font-black">Sync Stability</span>
                                    <span className="text-cyan-400 font-mono text-3xl font-black tracking-tighter italic">98.4%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "98.4%" }}
                                        className="h-full bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,1)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
