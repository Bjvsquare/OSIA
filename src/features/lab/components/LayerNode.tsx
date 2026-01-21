import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, MeshTransmissionMaterial, Points, PointMaterial, QuadraticBezierLine } from '@react-three/drei';
import type { Trait } from '../../blueprint/TraitTranslator';

interface LayerNodeProps {
    position: [number, number, number];
    trait?: Trait;
    isCenter?: boolean;
    onSelect?: (trait: Trait) => void;
    onHover?: (id: string | null) => void;
    isHovered?: boolean;
}

function PlasmaStrands({ count = 12, range = 0.6, color = "#00ffff" }) {
    const strands = useMemo(() => {
        return [...Array(count)].map(() => ({
            start: new THREE.Vector3().randomDirection().multiplyScalar(range * 0.2),
            end: new THREE.Vector3().randomDirection().multiplyScalar(range),
            mid: new THREE.Vector3().randomDirection().multiplyScalar(range * 1.5),
            speed: 0.5 + Math.random() * 2,
            offset: Math.random() * Math.PI * 2
        }));
    }, [count, range]);

    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.2;
            groupRef.current.rotation.z = t * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {strands.map((s, i) => (
                <QuadraticBezierLine
                    key={i}
                    start={s.start}
                    end={s.end}
                    mid={s.mid}
                    color={color}
                    lineWidth={0.5}
                    transparent
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                />
            ))}
            {/* Inner Glints */}
            {[...Array(8)].map((_, i) => (
                <mesh key={`glint-${i}`} position={new THREE.Vector3().randomDirection().multiplyScalar(range * 0.8)}>
                    <sphereGeometry args={[0.015, 8, 8]} />
                    <meshBasicMaterial color="#fff" />
                </mesh>
            ))}
        </group>
    );
}

function InternalNebula({ count = 300, size = 0.04, color = "#00ffff" }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = Math.random() * 0.6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            p[i * 3 + 2] = r * Math.cos(phi);
        }
        return p;
    }, [count]);

    return (
        <Points positions={points} stride={3}>
            <PointMaterial
                transparent
                color={color}
                size={size}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.3}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

export function LayerNode({
    position,
    trait,
    isCenter = false,
    onSelect,
    onHover,
    isHovered
}: LayerNodeProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const internalRef = useRef<THREE.Group>(null!);

    const color = useMemo(() => {
        if (isCenter) return '#fff';
        return '#00ffff';
    }, [isCenter]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            const scale = 1 + Math.sin(t * 1.5) * 0.02;
            meshRef.current.scale.set(scale, scale, scale);
        }
        if (internalRef.current) {
            internalRef.current.rotation.y += 0.002;
        }
    });

    return (
        <group position={position}>
            <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
                {/* Outer Liquid Glass Shell */}
                <mesh
                    ref={meshRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (trait) onSelect?.(trait);
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        onHover?.(trait?.id || 'center');
                    }}
                    onPointerOut={() => onHover?.(null)}
                >
                    <sphereGeometry args={[isCenter ? 1.6 : 1.0, 64, 64]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={32}
                        resolution={1024}
                        transmission={0.99}
                        roughness={0.08}
                        thickness={1.4}
                        ior={1.7}
                        chromaticAberration={0.12}
                        anisotropy={0.3}
                        distortion={0.4}
                        distortionScale={0.4}
                        temporalDistortion={0.05}
                        color={color}
                        emissive={color}
                        emissiveIntensity={isHovered ? 0.2 : 0.02}
                    />
                </mesh>

                {/* Living Internal Strands & Nebula */}
                <group ref={internalRef}>
                    <InternalNebula
                        count={isCenter ? 800 : 300}
                        size={isCenter ? 0.04 : 0.02}
                        color={color}
                    />

                    <PlasmaStrands
                        count={isCenter ? 20 : 10}
                        range={isCenter ? 1.0 : 0.6}
                        color={color}
                    />

                    {/* Central Fusion Core */}
                    <mesh>
                        <sphereGeometry args={[isCenter ? 0.35 : 0.12, 32, 32]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={isHovered ? 6 : 3}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                </group>

                {/* Minimalist Contact Point (on hover) */}
                {isHovered && (
                    <mesh position={[0, -0.1, 0]}>
                        <sphereGeometry args={[0.04, 16, 16]} />
                        <meshBasicMaterial color={color} />
                    </mesh>
                )}
            </Float>
        </group>
    );
}
