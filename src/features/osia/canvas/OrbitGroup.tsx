import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   OrbitGroup — Animates children in orbital motion around
   a parent position. Supports tilted orbital planes for
   a realistic "solar system" visual hierarchy.
   
   Usage:
     <OrbitGroup radius={6} speed={0.03} tiltDeg={36} initialAngleDeg={72}
                 onPositionUpdate={(worldPos) => ...}>
       <OrbNode ... />
     </OrbitGroup>
   ═══════════════════════════════════════════════════════════ */

interface OrbitGroupProps {
    /** Orbital radius from center of parent group */
    radius: number;
    /** Orbital speed in radians per second (0.02–0.06 for slow majestic feel) */
    speed: number;
    /** Tilt of the orbital plane in degrees */
    tiltDeg?: number;
    /** Starting angle in degrees */
    initialAngleDeg?: number;
    /** Callback with world position each frame — used for connection lines & store */
    onPositionUpdate?: (worldPos: THREE.Vector3) => void;
    /** Orb ID for position tracking */
    orbId?: string;
    children: React.ReactNode;
}

const _worldPos = new THREE.Vector3();

export function OrbitGroup({
    radius,
    speed,
    tiltDeg = 0,
    initialAngleDeg = 0,
    onPositionUpdate,
    children,
}: OrbitGroupProps) {
    const groupRef = useRef<THREE.Group>(null!);
    const angleRef = useRef((initialAngleDeg * Math.PI) / 180);
    const tiltRad = (tiltDeg * Math.PI) / 180;

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Increment angle
        angleRef.current += speed * delta;

        // Calculate position on tilted orbital plane
        const angle = angleRef.current;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Apply tilt rotation around X axis
        // Rotated y = z * sin(tilt), rotated z = z * cos(tilt)
        const y = z * Math.sin(tiltRad);
        const zTilted = z * Math.cos(tiltRad);

        groupRef.current.position.set(x, y, zTilted);

        // Report world position for connection lines & interactions
        if (onPositionUpdate) {
            groupRef.current.getWorldPosition(_worldPos);
            onPositionUpdate(_worldPos.clone());
        }
    });

    return <group ref={groupRef}>{children}</group>;
}
