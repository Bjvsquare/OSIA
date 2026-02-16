import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ConnectionData } from '../types';
import { getConnectionColor } from '../utils/colorUtils';

/* ═══════════════════════════════════════════════════════════
   ConnectionLine — Dynamic 3D bezier tube with energy flow
   
   Supports both static and dynamic (orbiting) positions.
   When positionRefs is provided, reads world positions
   each frame and updates geometry accordingly.
   ═══════════════════════════════════════════════════════════ */

interface ConnectionLineProps {
    connection: ConnectionData;
    sourcePos: [number, number, number];
    targetPos: [number, number, number];
    /** Optional ref map for dynamic/orbiting positions */
    positionRefs?: React.MutableRefObject<Record<string, THREE.Vector3>>;
}

export function ConnectionLine({ connection, sourcePos, targetPos, positionRefs }: ConnectionLineProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const flowRef = useRef<THREE.Points>(null!);
    const curveRef = useRef<THREE.QuadraticBezierCurve3 | null>(null);
    const lastSrcRef = useRef(new THREE.Vector3(sourcePos[0], sourcePos[1], sourcePos[2]));
    const lastTgtRef = useRef(new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]));

    const color = useMemo(() => {
        return connection.color ? new THREE.Color(connection.color) : getConnectionColor(connection.type);
    }, [connection.type, connection.color]);

    const tubeRadius = 0.008 + (connection.strength || 0.5) * 0.02;

    // Build initial geometry
    const { geometry, material } = useMemo(() => {
        const src = new THREE.Vector3(sourcePos[0], sourcePos[1], sourcePos[2]);
        const tgt = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
        const mid = new THREE.Vector3().lerpVectors(src, tgt, 0.5);
        mid.y += src.distanceTo(tgt) * 0.15;

        const c = new THREE.QuadraticBezierCurve3(src, mid, tgt);
        curveRef.current = c;

        const geo = new THREE.TubeGeometry(c, 32, tubeRadius, 6, false);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            depthTest: true,
        });

        return { geometry: geo, material: mat };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only create once; we'll update dynamically

    // Energy flow particles
    const flowCount = 6;
    const flowGeometry = useMemo(() => {
        const positions = new Float32Array(flowCount * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);

    const _src = useMemo(() => new THREE.Vector3(), []);
    const _tgt = useMemo(() => new THREE.Vector3(), []);
    const _mid = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Get current positions (from refs if dynamic, else from props)
        if (positionRefs?.current) {
            const srcRef = positionRefs.current[connection.sourceId];
            const tgtRef = positionRefs.current[connection.targetId];
            if (srcRef) _src.copy(srcRef);
            else _src.set(sourcePos[0], sourcePos[1], sourcePos[2]);
            if (tgtRef) _tgt.copy(tgtRef);
            else _tgt.set(targetPos[0], targetPos[1], targetPos[2]);
        } else {
            _src.set(sourcePos[0], sourcePos[1], sourcePos[2]);
            _tgt.set(targetPos[0], targetPos[1], targetPos[2]);
        }

        // Check if positions moved significantly — rebuild tube geometry
        const srcMoved = _src.distanceToSquared(lastSrcRef.current) > 0.01;
        const tgtMoved = _tgt.distanceToSquared(lastTgtRef.current) > 0.01;

        if (srcMoved || tgtMoved) {
            lastSrcRef.current.copy(_src);
            lastTgtRef.current.copy(_tgt);

            _mid.lerpVectors(_src, _tgt, 0.5);
            _mid.y += _src.distanceTo(_tgt) * 0.15;

            const c = new THREE.QuadraticBezierCurve3(
                _src.clone(), _mid.clone(), _tgt.clone()
            );
            curveRef.current = c;

            // Rebuild tube geometry
            if (meshRef.current) {
                const oldGeo = meshRef.current.geometry;
                meshRef.current.geometry = new THREE.TubeGeometry(c, 32, tubeRadius, 6, false);
                oldGeo.dispose();
            }
        }

        // Tube opacity pulse
        if (meshRef.current) {
            const pulse = connection.animated
                ? 0.15 + Math.sin(t * 2.0 + (connection.strength || 0.5) * 10) * 0.1
                : 0.2;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
        }

        // Animate flow particles along the curve
        if (flowRef.current && curveRef.current) {
            const positions = flowRef.current.geometry.attributes.position;
            const arr = positions.array as Float32Array;

            for (let i = 0; i < flowCount; i++) {
                const progress = ((t * 0.3 + i / flowCount) % 1);
                const point = curveRef.current.getPoint(progress);
                arr[i * 3] = point.x;
                arr[i * 3 + 1] = point.y;
                arr[i * 3 + 2] = point.z;
            }

            positions.needsUpdate = true;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={2} />
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
