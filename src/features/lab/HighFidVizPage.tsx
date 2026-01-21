import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload, Stars, Sparkles, Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, Scanline } from '@react-three/postprocessing';
import { HighFidVisualizer } from './components/HighFidVisualizer';
import { useAuth } from '../auth/AuthContext';
import * as THREE from 'three';

function CosmicDust() {
    const points = useMemo(() => {
        const p = new Float32Array(2000 * 3);
        for (let i = 0; i < 2000; i++) {
            p[i * 3] = (Math.random() - 0.5) * 100;
            p[i * 3 + 1] = (Math.random() - 0.5) * 100;
            p[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        return p;
    }, []);

    const ref = useRef<THREE.Points>(null!);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <Points ref={ref} positions={points} stride={3}>
            <PointMaterial
                transparent
                color="#00ffff"
                size={0.05}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.4}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

export function HighFidVizPage() {
    const { userProfile } = useAuth();
    const traits = useMemo(() => userProfile?.origin_seed_profile?.traits || [], [userProfile]);
    const thesis = useMemo(() => userProfile?.origin_seed_profile?.thesis || {}, [userProfile]);

    return (
        <div className="relative w-full h-screen bg-[#020205] overflow-hidden select-none">
            {/* Branding Overlay */}
            <div className="absolute top-12 left-12 z-10 pointer-events-none">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-[1px] bg-cyan-500/40" />
                    <span className="text-[10px] text-cyan-400/60 tracking-[0.5em] uppercase font-bold">Origin Architecture Lab</span>
                </div>
                <h1 className="text-4xl font-light text-white tracking-widest uppercase mb-1">
                    Persona <span className="text-cyan-500 font-bold">Thesis</span>
                </h1>
                <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase">Foundational Blueprint Synthesis</div>
            </div>

            <Canvas
                className="w-full h-full"
                gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 55]} fov={35} />
                <OrbitControls
                    enablePan={false}
                    minDistance={30}
                    maxDistance={120}
                    makeDefault
                    autoRotate
                    autoRotateSpeed={0.2}
                />

                <Suspense fallback={null}>
                    {/* Atmospheric Background */}
                    <Stars radius={150} depth={50} count={7000} factor={6} saturation={0} fade speed={1.5} />
                    <Sparkles count={300} size={2.5} scale={50} speed={0.4} color="#00ffff" />
                    <CosmicDust />

                    {/* Lighting Environment */}
                    <ambientLight intensity={0.6} />
                    <pointLight position={[40, 30, 20]} intensity={2} color="#ff00ff" />
                    <pointLight position={[-40, -30, 20]} intensity={2} color="#00ffff" />
                    <pointLight position={[0, 0, 10]} intensity={1.5} color="#ffffff" />

                    {/* Main Visualization */}
                    <HighFidVisualizer traits={traits} thesis={thesis} />

                    {/* Post-Processing Stack */}
                    <EffectComposer>
                        <Bloom
                            luminanceThreshold={0.05}
                            mipmapBlur
                            intensity={1.5}
                            radius={0.6}
                        />
                        <Noise opacity={0.08} />
                        <Scanline opacity={0.03} density={1.2} />
                        <Vignette darkness={1.3} offset={0.35} />
                    </EffectComposer>

                    <Preload all />
                </Suspense>
            </Canvas>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-12 right-12 z-10 text-right pointer-events-none">
                <div className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-1 italic">Blueprint Integrity: 99.98%</div>
                <div className="text-[12px] text-cyan-500 uppercase font-mono tracking-tighter">Resonance Sync: Operational</div>
            </div>
        </div>
    );
}
