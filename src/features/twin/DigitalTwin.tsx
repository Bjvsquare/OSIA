import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function NeuralNode({ position, color }: { position: [number, number, number]; color: string }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
    );
}

import { Line } from '@react-three/drei';

function Connection({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
    return (
        <Line
            points={[start, end]}
            color={color}
            lineWidth={1}
            transparent
            opacity={0.3}
        />
    );
}

function NeuralGraph() {
    const groupRef = useRef<THREE.Group>(null);

    // Generate random nodes
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 10;
            const y = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 10;
            // Color based on position for variety
            const color = i % 2 === 0 ? '#38A3A5' : '#6B4C9A'; // Teal or Purple
            temp.push({ position: [x, y, z] as [number, number, number], color });
        }
        return temp;
    }, []);

    // Generate connections
    const connections = useMemo(() => {
        const temp = [];
        for (let i = 0; i < nodes.length; i++) {
            // Connect to 2 nearest neighbors (simplified: just random for now to create the web)
            for (let j = 0; j < 2; j++) {
                const targetIndex = Math.floor(Math.random() * nodes.length);
                if (targetIndex !== i) {
                    temp.push({ start: nodes[i].position, end: nodes[targetIndex].position, color: nodes[i].color });
                }
            }
        }
        return temp;
    }, [nodes]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
            groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {nodes.map((node, i) => (
                <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <NeuralNode position={node.position} color={node.color} />
                </Float>
            ))}
            {connections.map((conn, i) => (
                <Connection key={i} start={conn.start} end={conn.end} color={conn.color} />
            ))}
        </group>
    );
}

export function DigitalTwin() {
    return (
        <div className="w-full h-full min-h-[500px] bg-black rounded-xl overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-white font-mono text-sm opacity-70">NEURAL ARCHITECTURE v1.0</h3>
                <div className="flex gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-osia-teal-500 animate-pulse" />
                    <span className="text-osia-teal-500 text-xs">LIVE</span>
                </div>
            </div>

            <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 10, 25]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <NeuralGraph />

                <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
