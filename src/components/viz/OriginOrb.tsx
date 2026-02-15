import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OriginOrbProps {
    traits: { trait_id: string; score: number; confidence: number }[];
    scale?: number;
}

export function OriginOrb({ traits, scale = 1 }: OriginOrbProps) {
    const group = useRef<THREE.Group>(null!);

    // Calculate positions on a sphere (Fibonacci Lattice)
    const nodeData = useMemo(() => {
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        return traits.map((trait, i) => {
            const y = 1 - (i / (traits.length - 1)) * 2; // y goes from 1 to -1
            const radius = Math.sqrt(1 - y * y); // radius at y

            const theta = phi * i; // golden angle increment

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            // Base radius + Score influence (mapped approx 0-100 to 1.5-3.0)
            const length = 1.5 + (trait.score / 100) * 1.5;

            return {
                pos: new THREE.Vector3(x, y, z).multiplyScalar(length),
                trait
            };
        });
    }, [traits]);

    useFrame((state) => {
        if (group.current) {
            const t = state.clock.getElapsedTime();

            // Multi-axis dynamic rotation (not just flat Y spin)
            group.current.rotation.y += 0.002;
            group.current.rotation.x = Math.sin(t * 0.4) * 0.2 + Math.sin(t * 0.17) * 0.08;
            group.current.rotation.z = Math.cos(t * 0.3) * 0.1;

            // Breathing scale
            const breathe = 1 + Math.sin(t * 0.6) * 0.03;
            group.current.scale.setScalar(breathe * scale);
        }
    });

    return (
        <group ref={group} scale={scale}>
            {/* Core */}
            <mesh>
                <icosahedronGeometry args={[1, 4]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                    wireframe
                />
            </mesh>

            {/* Trait Spikes */}
            {nodeData.map((node) => (
                <group key={node.trait.trait_id} position={[0, 0, 0]} lookAt={[node.pos.x, node.pos.y, node.pos.z]}>
                    {/* The line/spike */}
                    <mesh position={[0, 0, node.pos.length() / 2]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.02, 0.05, node.pos.length(), 8]} />
                        <meshStandardMaterial color={node.trait.score > 50 ? "#00ffff" : "#ff00ff"} />
                    </mesh>

                    {/* The Tip Node */}
                    <mesh position={[0, 0, node.pos.length()]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
