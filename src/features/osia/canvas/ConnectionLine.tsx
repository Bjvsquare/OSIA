import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ConnectionData } from '../types';
import { getConnectionColor } from '../utils/colorUtils';

/* ═══════════════════════════════════════════════════════════
   ConnectionLine — 3D bezier tube with energy flow particles
   Strength-based thickness, cluster coloring, pulse sync
   ═══════════════════════════════════════════════════════════ */

interface ConnectionLineProps {
    connection: ConnectionData;
    sourcePos: [number, number, number];
    targetPos: [number, number, number];
}

const _src = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _mid = new THREE.Vector3();

export function ConnectionLine({ connection, sourcePos, targetPos }: ConnectionLineProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const flowRef = useRef<THREE.Points>(null!);

    const color = useMemo(() => {
        return connection.color ? new THREE.Color(connection.color) : getConnectionColor(connection.type);
    }, [connection.type, connection.color]);

    const positionKey = `${sourcePos.join(',')}-${targetPos.join(',')}`;

    // Strength-based tube radius
    const tubeRadius = 0.008 + (connection.strength || 0.5) * 0.02;

    const { geometry, material, curve } = useMemo(() => {
        _src.set(sourcePos[0], sourcePos[1], sourcePos[2]);
        _tgt.set(targetPos[0], targetPos[1], targetPos[2]);
        _mid.lerpVectors(_src, _tgt, 0.5);

        const offset = _src.distanceTo(_tgt) * 0.15;
        _mid.y += offset;

        const c = new THREE.QuadraticBezierCurve3(
            _src.clone(), _mid.clone(), _tgt.clone()
        );

        const geo = new THREE.TubeGeometry(c, 64, tubeRadius, 6, false);

        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            depthTest: true,
        });

        return { geometry: geo, material: mat, curve: c };
    }, [positionKey, color, connection.type, tubeRadius]);

    // Energy flow particles along the curve
    const flowCount = 8;
    const flowGeometry = useMemo(() => {
        const positions = new Float32Array(flowCount * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Tube opacity pulse
        if (meshRef.current) {
            const pulse = connection.animated
                ? 0.15 + Math.sin(t * 2.0 + (connection.strength || 0.5) * 10) * 0.1
                : 0.2;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
        }

        // Animate flow particles along the curve
        if (flowRef.current && curve) {
            const positions = flowRef.current.geometry.attributes.position;
            const arr = positions.array as Float32Array;

            for (let i = 0; i < flowCount; i++) {
                const progress = ((t * 0.3 + i / flowCount) % 1);
                const point = curve.getPoint(progress);
                arr[i * 3] = point.x;
                arr[i * 3 + 1] = point.y;
                arr[i * 3 + 2] = point.z;
            }

            positions.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Main tube */}
            <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={2} />

            {/* Energy flow particles */}
            <points ref={flowRef} geometry={flowGeometry} renderOrder={3}>
                <pointsMaterial
                    color={color}
                    size={0.06}
                    transparent
                    opacity={0.7}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
}
