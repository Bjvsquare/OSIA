import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ClusterConfig } from '../utils/GalaxyLayout';

/* ═══════════════════════════════════════════════════════════
   RelationshipCluster — Orbital ring + ambient particles
   for a relationship group (Family, Friends, etc.)
   ═══════════════════════════════════════════════════════════ */

/* Circular gradient sprite texture — replaces square GL points */
let _circleSprite: THREE.Texture | null = null;
function getCircleSprite(): THREE.Texture {
    if (_circleSprite) return _circleSprite;
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    _circleSprite = new THREE.CanvasTexture(canvas);
    return _circleSprite;
}

interface RelationshipClusterProps {
    config: ClusterConfig;
    count: number;
    visible?: boolean;
}

export function RelationshipCluster({ config, count, visible = true }: RelationshipClusterProps) {
    const ringRef = useRef<THREE.Group>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    const color = useMemo(() => new THREE.Color().setHSL(config.baseHue / 360, 0.6, 0.5), [config.baseHue]);
    const circleMap = useMemo(() => getCircleSprite(), []);

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

            {/* Ambient particles — circular sprites, NOT squares */}
            <points ref={particlesRef} geometry={ambientParticles}>
                <pointsMaterial
                    map={circleMap}
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
