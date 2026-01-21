import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
    count?: number;
    radius?: number;
    color1?: string;
    color2?: string;
}

export function ParticleSystem({
    count = 400,
    radius = 12,
    color1 = '#4A9EFF',
    color2 = '#FF8C42',
}: ParticleSystemProps) {
    const pointsRef = useRef<THREE.Points>(null!);

    const { positions, colors, velocities, phases } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        const ph = new Float32Array(count);

        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);
        const cTemp = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const r = radius * 0.3 + Math.random() * radius * 0.7;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);

            const t = Math.random();
            cTemp.lerpColors(c1, c2, t);
            col[i * 3] = cTemp.r;
            col[i * 3 + 1] = cTemp.g;
            col[i * 3 + 2] = cTemp.b;

            vel[i * 3] = (Math.random() - 0.5) * 0.01;
            vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

            ph[i] = Math.random() * Math.PI * 2;
        }

        return { positions: pos, colors: col, velocities: vel, phases: ph };
    }, [count, radius, color1, color2]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const t = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            const x = posArray[i * 3];
            const z = posArray[i * 3 + 2];

            const speed = 0.002 + velocities[i * 3] * 0.5;
            const cosA = Math.cos(speed);
            const sinA = Math.sin(speed);
            posArray[i * 3] = x * cosA - z * sinA;
            posArray[i * 3 + 2] = x * sinA + z * cosA;

            posArray[i * 3 + 1] += Math.sin(t * 0.5 + phases[i]) * 0.003;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} renderOrder={10}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.06}
                vertexColors
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
                sizeAttenuation
                depthWrite={false}
                depthTest={true}
            />
        </points>
    );
}
