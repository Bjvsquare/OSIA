import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CosmicField({ count = 2000 }) {
    const points = useRef<THREE.Points>(null!);
    const { scene } = useThree();

    useEffect(() => {
        scene.background = new THREE.Color('#050816');
        scene.fog = new THREE.Fog('#050816', 5, 50);
    }, [scene]);

    // Initial positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 100;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        return pos;
    }, [count]);

    useFrame(() => {
        if (points.current) {
            points.current.rotation.x += 0.0001;
            points.current.rotation.y += 0.0002;
        }
    });

    return (
        <>
            <pointLight position={[0, 0, 0]} distance={40} intensity={8} color="lightblue" />
            <points ref={points}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={positions.length / 3}
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.15}
                    color="#00ffff"
                    transparent
                    opacity={0.8}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
}
