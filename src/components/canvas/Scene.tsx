import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Preload } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CosmicField } from './CosmicField';
import { PlexusBackground } from '../viz/PlexusBackground';
import { useLocation } from 'react-router-dom';

// Routes that use their own full-screen Canvas
const EXCLUDED_ROUTES = ['/lab/osia', '/lab/blueyard'];

export function Scene() {
    const { pathname } = useLocation();

    // Don't render when a lab page has its own Canvas (prevents dual-Canvas flicker)
    if (EXCLUDED_ROUTES.some(r => pathname.startsWith(r))) {
        return null;
    }

    return (
        <>
            <PlexusBackground />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false }}>
                    <Suspense fallback={null}>
                        <CosmicField />
                        <EffectComposer>
                            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                        </EffectComposer>
                        <Preload all />
                    </Suspense>
                </Canvas>
            </div>
        </>
    );
}

