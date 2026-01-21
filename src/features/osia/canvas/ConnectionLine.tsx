import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ConnectionData } from '../types';
import { getConnectionColor } from '../utils/colorUtils';

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

    const color = useMemo(() => {
        return connection.color ? new THREE.Color(connection.color) : getConnectionColor(connection.type);
    }, [connection.type, connection.color]);

    const positionKey = `${sourcePos.join(',')}-${targetPos.join(',')}`;

    const { geometry, material } = useMemo(() => {
        _src.set(sourcePos[0], sourcePos[1], sourcePos[2]);
        _tgt.set(targetPos[0], targetPos[1], targetPos[2]);
        _mid.lerpVectors(_src, _tgt, 0.5);

        const offset = _src.distanceTo(_tgt) * 0.12;
        _mid.y += offset;

        const curve = new THREE.QuadraticBezierCurve3(
            _src.clone(), _mid.clone(), _tgt.clone()
        );

        const tubeRadius = 0.015;
        const geo = new THREE.TubeGeometry(curve, 48, tubeRadius, 4, false);

        // Luminous line material
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            depthTest: true,
        });

        return { geometry: geo, material: mat };
    }, [positionKey, color, connection.type]);

    useFrame((state) => {
        if (!meshRef.current || !connection.animated) return;
        const t = state.clock.getElapsedTime();
        const pulse = 0.25 + Math.sin(t * 2.0 + connection.strength * 10) * 0.15;
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    });

    return (
        <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={2} />
    );
}
