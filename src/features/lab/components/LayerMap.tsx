import { useState, Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload, Points, PointMaterial, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { LayerVisualizer } from './LayerVisualizer';
import type { Trait } from '../../blueprint/TraitTranslator';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

function CosmicDust() {
    const points = useMemo(() => {
        const p = new Float32Array(2000 * 3);
        for (let i = 0; i < 2000; i++) {
            p[i * 3] = (Math.random() - 0.5) * 60;
            p[i * 3 + 1] = (Math.random() - 0.5) * 60;
            p[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
        return p;
    }, []);

    const ref = useRef<THREE.Points>(null!);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.005;
        }
    });

    return (
        <Points ref={ref} positions={points} stride={3}>
            <PointMaterial
                transparent
                color="#00aaaa"
                size={0.04}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.3}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

function CalloutBubble({ name, description }: { name: string, description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col gap-1 pointer-events-none"
        >
            <div className="bg-[#050a14]/60 backdrop-blur-3xl border border-cyan-500/20 px-4 py-2 rounded-2xl rounded-bl-none shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-0.5">
                    {name}
                </div>
                <div className="text-[9px] text-white/40 leading-tight max-w-[140px] font-medium italic">
                    {description}
                </div>
                {/* Minimalist tail */}
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#050a14]/60 border-l border-b border-cyan-500/20 transform rotate-45" />
            </div>
        </motion.div>
    );
}

interface LayerMapProps {
    traits: Trait[];
    onSelectLayer?: (trait: Trait) => void;
}

export function LayerMap({ traits, onSelectLayer }: LayerMapProps) {
    const [isHovered, setIsHovered] = useState<string | null>(null);

    const hoveredTrait = useMemo(() => {
        if (!isHovered) return null;
        if (isHovered === 'center') return { name: 'Origin Core', description: 'Core identity signature' };
        const trait = traits.find((t: Trait) => t.id === isHovered);
        return trait ? { name: trait.name, description: 'Stabilizing patterns...' } : null;
    }, [isHovered, traits]);

    return (
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <Canvas
                gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={28} />
                <OrbitControls
                    enablePan={false}
                    minDistance={20}
                    maxDistance={50}
                    makeDefault
                    autoRotate
                    autoRotateSpeed={0.1}
                />

                <Suspense fallback={null}>
                    <CosmicDust />

                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 5, -5]} intensity={3} color="#ff00ff" />
                    <pointLight position={[-10, -5, -5]} intensity={2} color="#00ffff" />

                    <LayerVisualizer
                        traits={traits}
                        onSelectLayer={(t) => onSelectLayer?.(t)}
                        onHoverLayer={setIsHovered}
                        hoveredLayer={isHovered}
                    />

                    {/* Literal 3D Callouts - Encapsulated Logic */}
                    <AnimatePresence>
                        {isHovered && hoveredTrait && (
                            <Html distanceFactor={1} center position={[0, 0.5, 0]}>
                                <CalloutBubble name={hoveredTrait.name} description={hoveredTrait.description} />
                            </Html>
                        )}
                    </AnimatePresence>

                    <EffectComposer multisampling={4}>
                        <Bloom luminanceThreshold={0.1} mipmapBlur intensity={0.5} radius={0.4} />
                        <Noise opacity={0.05} />
                        <Vignette darkness={1.2} offset={0.3} />
                    </EffectComposer>

                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}
