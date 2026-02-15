import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ClusterConfig } from '../utils/GalaxyLayout';

/* ═══════════════════════════════════════════════════════════
   RelationshipCluster — Orbital ring + ambient particles
   for a relationship group (Family, Friends, etc.)
   ═══════════════════════════════════════════════════════════ */

interface RelationshipClusterProps {
    config: ClusterConfig;
    count: number;
    visible?: boolean;
}

export function RelationshipCluster({ config, count, visible = true }: RelationshipClusterProps) {
    const ringRef = useRef<THREE.Group>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    const color = useMemo(() => new THREE.Color().setHSL(config.baseHue / 360, 0.6, 0.5), [config.baseHue]);

    // Orbital ring geometry
    const ringGeometry = useMemo(() => {
        const midRadius = (config.innerRadius + config.outerRadius) / 2;
        const segments = 128;
        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * midRadius,
                0,
                Math.sin(angle) * midRadius
            ));
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return geo;
    }, [config.innerRadius, config.outerRadius]);

    // Ambient particles filling the orbital lane
    const ambientParticles = useMemo(() => {
        const particleCount = Math.min(count * 15, 200);
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const rng = seededRandom(config.baseHue * 31);

        for (let i = 0; i < particleCount; i++) {
            const angle = rng() * Math.PI * 2;
            const r = config.innerRadius + rng() * (config.outerRadius - config.innerRadius);
            const scatter = (rng() - 0.5) * 2;

            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = scatter;
            positions[i * 3 + 2] = Math.sin(angle) * r;

            sizes[i] = 0.5 + rng() * 1.5;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geo;
    }, [count, config]);

    useFrame((state) => {
        if (!ringRef.current) return;
        const t = state.clock.getElapsedTime();

        // Slowly rotate the cluster
        ringRef.current.rotation.y += 0.0005;

        // Breathing opacity on ring
        if (particlesRef.current) {
            const mat = particlesRef.current.material as THREE.PointsMaterial;
            mat.opacity = 0.15 + Math.sin(t * 0.3 + config.baseHue) * 0.05;
        }
    });

    const ringLine = useMemo(() => {
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
        });
        return new THREE.Line(ringGeometry, mat);
    }, [ringGeometry, color]);

    if (!visible || count === 0) return null;

    return (
        <group ref={ringRef} rotation={[config.planeTilt, 0, 0]}>
            {/* Orbital ring */}
            <primitive object={ringLine} />

            {/* Ambient particles */}
            <points ref={particlesRef} geometry={ambientParticles}>
                <pointsMaterial
                    color={color}
                    size={1}
                    transparent
                    opacity={0.15}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}
