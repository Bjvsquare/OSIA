import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

export function BlueYardParticles({ count = 12000 }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const { mouse, viewport, camera } = useThree();

    // Mouse interaction state
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const intersectionVec = useMemo(() => new THREE.Vector3(), []);
    const mouseVel = useRef(new THREE.Vector3());
    const prevMousePos = useRef(new THREE.Vector3());

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const behaviors = new Uint8Array(count); // 0: internal, 1: emitting
        const initialPos = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const type = Math.random() > 0.5 ? 0 : 1;
            behaviors[i] = type;

            let r, x, y, z;
            if (type === 0) {
                // Internal trapped - slower
                r = Math.random() * 12.0;
            } else {
                // Surface start - for emission
                r = 13.5;
            }

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            initialPos[i * 3] = x;
            initialPos[i * 3 + 1] = y;
            initialPos[i * 3 + 2] = z;

            // Velocity init
            velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

            // Colors (Solar Palette)
            if (type === 1) {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.95;
                colors[i * 3 + 2] = 0.8;
            } else {
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i * 3 + 2] = 0.2;
            }
        }

        return { positions, colors, velocities, behaviors, initialPos };
    }, [count]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const posAttr = pointsRef.current.geometry.attributes.position;
        const posArray = posAttr.array as Float32Array;
        const t = state.clock.getElapsedTime();

        // 1. Raycast mouse to plane at z=0 for interaction
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, intersectionVec);

        // Calculate mouse velocity for dragging interaction
        mouseVel.current.subVectors(intersectionVec, prevMousePos.current).multiplyScalar(1 / delta);
        prevMousePos.current.copy(intersectionVec);

        for (let i = 0; i < count; i++) {
            const type = particles.behaviors[i];

            let x = posArray[i * 3];
            let y = posArray[i * 3 + 1];
            let z = posArray[i * 3 + 2];

            // --- BASE MOTION ---
            if (type === 0) {
                // INTERNAL: Slow Swirl
                const speed = 0.15;
                const dist = Math.sqrt(x * x + z * z);
                const angle = speed * delta;

                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                // Orbital drift
                const nx = x * cosA - z * sinA;
                const nz = x * sinA + z * cosA;

                // Apply a bit of jitter/noise
                x = nx + Math.sin(t * 0.5 + i) * 0.005;
                z = nz + Math.cos(t * 0.4 + i) * 0.005;
                y += Math.sin(t * 0.3 + i) * 0.005;
            } else {
                // EXTERNAL: Emission
                const dir = new THREE.Vector3(x, y, z).normalize();
                const emitSpeed = 0.08 + Math.random() * 0.12;

                x += dir.x * emitSpeed;
                y += dir.y * emitSpeed;
                z += dir.z * emitSpeed;

                // Add turbulence
                x += Math.sin(t * 2.0 + i) * 0.03;
                y += Math.cos(t * 2.5 + i) * 0.03;
                z += Math.sin(t * 1.8 + i) * 0.03;

                // Loop back to surface
                const distSq = x * x + y * y + z * z;
                if (distSq > 1600) { // dist > 40
                    x = particles.initialPos[i * 3];
                    y = particles.initialPos[i * 3 + 1];
                    z = particles.initialPos[i * 3 + 2];
                }
            }

            // --- MOUSE INTERACTION ---
            const dx = x - intersectionVec.x;
            const dy = y - intersectionVec.y;
            const dz = z - intersectionVec.z;
            const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distToMouse < 8.0) {
                const force = (1.0 - distToMouse / 8.0) * 5.0;
                const dir = new THREE.Vector3(dx, dy, dz).normalize();

                // 1. Repulsion
                x += dir.x * force * delta;
                y += dir.y * force * delta;
                z += dir.z * force * delta;

                // 2. Drag (inherit mouse velocity)
                x += mouseVel.current.x * force * 0.1 * delta;
                y += mouseVel.current.y * force * 0.1 * delta;
                z += mouseVel.current.z * force * 0.1 * delta;
            }

            posArray[i * 3] = x;
            posArray[i * 3 + 1] = y;
            posArray[i * 3 + 2] = z;
        }

        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                vertexColors
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}
