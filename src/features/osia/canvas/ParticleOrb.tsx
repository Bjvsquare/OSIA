import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   ParticleOrb — Connected Particle Sphere
   
   Adapted from Three.js buffergeometry-lines-drawrange example.
   Particles drift on a sphere surface with velocity, and
   dynamic lines connect nearby particles. CPU-based animation
   for maximum reliability.
   ═══════════════════════════════════════════════════════════ */

interface ParticleData {
    velocity: THREE.Vector3;
    numConnections: number;
}

interface ParticleOrbProps {
    position: [number, number, number];
    color: string;
    orbSize?: number;
    particleCount?: number;
    speed?: number;
    curlFreq?: number;
    opacity?: number;
    pointSize?: number;
    hardness?: number;
    minDistance?: number;
    maxConnections?: number;
    onClick?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOut?: () => void;
}

export function ParticleOrb({
    position,
    color,
    orbSize = 1.0,
    particleCount = 300,
    speed = 1.0,
    opacity = 0.6,
    pointSize = 2,
    minDistance = 0.35,
    maxConnections = 6,
    onClick,
    onPointerOver,
    onPointerOut,
}: ParticleOrbProps) {
    const groupRef = useRef<THREE.Group>(null!);
    const pointCloudRef = useRef<THREE.Points>(null!);
    const linesMeshRef = useRef<THREE.LineSegments>(null!);

    const system = useMemo(() => {
        const maxCount = particleCount;
        const segments = maxCount * maxCount;

        // ─── Particle positions & data ───
        const particlePositions = new Float32Array(maxCount * 3);
        const particlesData: ParticleData[] = [];

        for (let i = 0; i < maxCount; i++) {
            // Distribute on sphere surface
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const sinPhi = Math.sin(phi);

            particlePositions[i * 3] = sinPhi * Math.cos(theta) * orbSize;
            particlePositions[i * 3 + 1] = sinPhi * Math.sin(theta) * orbSize;
            particlePositions[i * 3 + 2] = Math.cos(phi) * orbSize;

            // Random tangent velocity (will be constrained to surface)
            particlesData.push({
                velocity: new THREE.Vector3(
                    -1 + Math.random() * 2,
                    -1 + Math.random() * 2,
                    -1 + Math.random() * 2
                ).multiplyScalar(0.003 * speed),
                numConnections: 0,
            });
        }

        // ─── Points geometry ───
        const pointsGeo = new THREE.BufferGeometry();
        pointsGeo.setAttribute(
            'position',
            new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage)
        );
        pointsGeo.setDrawRange(0, maxCount);

        // ─── Lines geometry (for connections) ───
        const linePositions = new Float32Array(segments * 3);
        const lineColors = new Float32Array(segments * 3);

        const linesGeo = new THREE.BufferGeometry();
        linesGeo.setAttribute(
            'position',
            new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
        );
        linesGeo.setAttribute(
            'color',
            new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage)
        );
        linesGeo.computeBoundingSphere();
        linesGeo.setDrawRange(0, 0);

        return {
            particlePositions,
            particlesData,
            pointsGeo,
            linesGeo,
            linePositions,
            lineColors,
            maxCount,
        };
    }, [particleCount, orbSize, speed]);

    // Parse color once
    const colorObj = useMemo(() => new THREE.Color(color), [color]);

    useFrame(() => {
        const {
            particlePositions: pp,
            particlesData: pd,
            linePositions: lp,
            lineColors: lc,
            maxCount,
        } = system;

        let vertexPos = 0;
        let colorPos = 0;
        let numConnected = 0;

        // Reset connection counts
        for (let i = 0; i < maxCount; i++) {
            pd[i].numConnections = 0;
        }

        // ─── Animate particles on sphere surface ───
        const pos = new THREE.Vector3();
        const vel = new THREE.Vector3();
        const normal = new THREE.Vector3();

        for (let i = 0; i < maxCount; i++) {
            pos.set(pp[i * 3], pp[i * 3 + 1], pp[i * 3 + 2]);
            vel.copy(pd[i].velocity);

            // Project velocity onto tangent plane (remove radial component)
            normal.copy(pos).normalize();
            vel.addScaledVector(normal, -vel.dot(normal));

            // Add a tiny random perturbation for organic motion
            vel.x += (Math.random() - 0.5) * 0.0004 * speed;
            vel.y += (Math.random() - 0.5) * 0.0004 * speed;
            vel.z += (Math.random() - 0.5) * 0.0004 * speed;

            // Update velocity for next frame
            pd[i].velocity.copy(vel);

            // Move
            pos.add(vel);

            // Re-project onto sphere surface
            pos.normalize().multiplyScalar(orbSize);

            pp[i * 3] = pos.x;
            pp[i * 3 + 1] = pos.y;
            pp[i * 3 + 2] = pos.z;
        }

        // ─── Dynamic line connections ───
        const scaledMinDist = minDistance * orbSize;
        const r = colorObj.r;
        const g = colorObj.g;
        const b = colorObj.b;

        for (let i = 0; i < maxCount; i++) {
            if (pd[i].numConnections >= maxConnections) continue;

            for (let j = i + 1; j < maxCount; j++) {
                if (pd[j].numConnections >= maxConnections) continue;

                const dx = pp[i * 3] - pp[j * 3];
                const dy = pp[i * 3 + 1] - pp[j * 3 + 1];
                const dz = pp[i * 3 + 2] - pp[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < scaledMinDist) {
                    pd[i].numConnections++;
                    pd[j].numConnections++;

                    const alpha = 1.0 - dist / scaledMinDist;

                    lp[vertexPos++] = pp[i * 3];
                    lp[vertexPos++] = pp[i * 3 + 1];
                    lp[vertexPos++] = pp[i * 3 + 2];

                    lp[vertexPos++] = pp[j * 3];
                    lp[vertexPos++] = pp[j * 3 + 1];
                    lp[vertexPos++] = pp[j * 3 + 2];

                    lc[colorPos++] = r * alpha;
                    lc[colorPos++] = g * alpha;
                    lc[colorPos++] = b * alpha;

                    lc[colorPos++] = r * alpha;
                    lc[colorPos++] = g * alpha;
                    lc[colorPos++] = b * alpha;

                    numConnected++;
                }
            }
        }

        // Update draw ranges and flag for GPU upload
        if (linesMeshRef.current) {
            linesMeshRef.current.geometry.setDrawRange(0, numConnected * 2);
            linesMeshRef.current.geometry.attributes.position.needsUpdate = true;
            linesMeshRef.current.geometry.attributes.color.needsUpdate = true;
        }

        if (pointCloudRef.current) {
            pointCloudRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onClick?.(e);
    }, [onClick]);

    const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onPointerOver?.(e);
    }, [onPointerOver]);

    const handleOut = useCallback(() => {
        onPointerOut?.();
    }, [onPointerOut]);

    return (
        <group ref={groupRef} position={position}>
            {/* Particle dots */}
            <points ref={pointCloudRef} geometry={system.pointsGeo} frustumCulled={false}>
                <pointsMaterial
                    color={color}
                    size={pointSize}
                    blending={THREE.AdditiveBlending}
                    transparent
                    opacity={opacity}
                    sizeAttenuation={false}
                    depthWrite={false}
                />
            </points>

            {/* Dynamic connection lines */}
            <lineSegments ref={linesMeshRef} geometry={system.linesGeo} frustumCulled={false}>
                <lineBasicMaterial
                    vertexColors
                    blending={THREE.AdditiveBlending}
                    transparent
                    opacity={opacity * 0.5}
                    depthWrite={false}
                />
            </lineSegments>

            {/* Invisible hit area for interaction */}
            <mesh
                visible={false}
                onPointerDown={handleClick}
                onPointerOver={handleOver}
                onPointerOut={handleOut}
            >
                <sphereGeometry args={[orbSize * 1.2, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}
