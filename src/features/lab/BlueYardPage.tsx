import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Preload, Stars } from '@react-three/drei';
import { BlueYardOrb } from './components/BlueYardOrb';
import { BlueYardParticles } from './components/BlueYardParticles';

export function BlueYardPage() {
    return (
        <div className="relative w-full h-screen bg-[#050201] overflow-hidden select-none">
            {/* Deep Warm Gradient Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#21100b_0%,_#000000_100%)]" />

            <Canvas
                className="w-full h-full"
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 45]} fov={30} />
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={3} color="#ffaa00" />

                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

                <BlueYardOrb />
                <BlueYardParticles />

                <Preload all />
            </Canvas>
        </div>
    );
}
