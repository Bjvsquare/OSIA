import { useEffect, useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVisualizationStore } from '../stores/visualizationStore';
import { calculateOrbitalParams } from '../utils/layoutEngine';
import { NebulaBackground } from './NebulaBackground';
import { CentralCore } from './CentralCore';
import { OrbNode } from './OrbNode';
import { ConnectionLine } from './ConnectionLine';
import { ParticleSystem } from './ParticleSystem';
import { CameraController } from './CameraController';
import { OrbitGroup } from './OrbitGroup';
import type { OrbData, ConnectionData } from '../types';

/* ═══════════════════════════════════════════════════════════
   OsiaScene — Orbital Constellation
   
   Renders the 1-5-15 model as a living orbital system:
   - Central core (static at origin)
   - 5 Cluster orbs orbiting the core on tilted planes
   - 3 Layer orbs orbiting each parent cluster
   - Dynamic connection lines follow orbital motion
   ═══════════════════════════════════════════════════════════ */

/**
 * DynamicConnections — renders ConnectionLine components that
 * self-update by reading world positions from positionRefs.
 */
function DynamicConnections({
    connections,
    positionRefs,
}: {
    connections: ConnectionData[];
    positionRefs: React.MutableRefObject<Record<string, THREE.Vector3>>;
}) {
    return (
        <>
            {connections.map(conn => (
                <ConnectionLine
                    key={conn.id}
                    connection={conn}
                    sourcePos={[0, 0, 0]}
                    targetPos={[0, 0, 0]}
                    positionRefs={positionRefs}
                />
            ))}
        </>
    );
}

export function OsiaScene({ portraitUrl }: { portraitUrl?: string | null }) {
    const data = useVisualizationStore(s => s.data);
    const setOrbPositions = useVisualizationStore(s => s.setOrbPositions);

    // Real-time position refs (updated every frame by OrbitGroups)
    const positionRefs = useRef<Record<string, THREE.Vector3>>({});

    // Calculate orbital parameters
    const orbitalParams = useMemo(() => {
        if (!data) return {};
        return calculateOrbitalParams(data);
    }, [data]);

    // Group orbs by hierarchy
    const clusters = useMemo(() => {
        if (!data) return [];
        return data.orbs.filter(o => o.type === 'cluster');
    }, [data]);

    const layersByCluster = useMemo(() => {
        if (!data) return {};
        const map: Record<string, OrbData[]> = {};
        clusters.forEach(c => {
            map[c.id] = data.orbs.filter(o => o.type === 'layer' && o.clusterId === c.id);
        });
        return map;
    }, [data, clusters]);

    // Position update handlers — called each frame by OrbitGroup
    const handlePositionUpdate = useCallback((orbId: string, worldPos: THREE.Vector3) => {
        positionRefs.current[orbId] = worldPos;
    }, []);

    // Push the core position (always at origin)
    useEffect(() => {
        if (data?.centralCore) {
            positionRefs.current[data.centralCore.id] = new THREE.Vector3(0, 0, 0);
        }
    }, [data]);

    // Periodically sync position refs to store (for camera targeting on click)
    const syncCounter = useRef(0);
    useFrame(() => {
        syncCounter.current++;
        if (syncCounter.current % 30 === 0) { // ~2x per second at 60fps
            const positions: Record<string, [number, number, number]> = {};
            for (const id in positionRefs.current) {
                const v = positionRefs.current[id];
                positions[id] = [v.x, v.y, v.z];
            }
            if (Object.keys(positions).length > 0) {
                setOrbPositions(positions);
            }
        }
    });

    if (!data) {
        return (
            <>
                <ambientLight intensity={0.5} />
                <mesh>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial color="#38bdf8" wireframe />
                </mesh>
            </>
        );
    }

    const user1Color = data.users[0]?.colorTheme || '#38bdf8';
    const user2Color = data.users[1]?.colorTheme || '#818cf8';

    return (
        <>
            <NebulaBackground />

            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color={user1Color} distance={50} />
            <pointLight position={[-10, -5, 5]} intensity={1.2} color={user2Color} distance={50} />

            {/* Central Core — static at origin */}
            <CentralCore
                position={[0, 0, 0]}
                size={data.centralCore.size * 0.7}
                color1={user1Color}
                color2={user2Color}
                portraitUrl={portraitUrl || undefined}
            />

            {/* Cluster orbs orbit the core, each with their layer orbs */}
            {clusters.map(cluster => {
                const cp = orbitalParams[cluster.id];
                if (!cp) return null;

                return (
                    <OrbitGroup
                        key={cluster.id}
                        orbId={cluster.id}
                        radius={cp.radius}
                        speed={cp.speed}
                        tiltDeg={cp.tiltDeg}
                        initialAngleDeg={cp.initialAngleDeg}
                        onPositionUpdate={(pos) => handlePositionUpdate(cluster.id, pos)}
                    >
                        {/* Cluster orb at the center of this orbit group */}
                        <OrbNode orb={cluster} position={[0, 0, 0]} />

                        {/* Layer orbs orbit around this cluster */}
                        {(layersByCluster[cluster.id] || []).map(layer => {
                            const lp = orbitalParams[layer.id];
                            if (!lp) return null;

                            return (
                                <OrbitGroup
                                    key={layer.id}
                                    orbId={layer.id}
                                    radius={lp.radius}
                                    speed={lp.speed}
                                    tiltDeg={lp.tiltDeg}
                                    initialAngleDeg={lp.initialAngleDeg}
                                    onPositionUpdate={(pos) => handlePositionUpdate(layer.id, pos)}
                                >
                                    <OrbNode orb={layer} position={[0, 0, 0]} />
                                </OrbitGroup>
                            );
                        })}
                    </OrbitGroup>
                );
            })}

            {/* Dynamic connection lines follow orbital motion */}
            <DynamicConnections
                connections={data.connections}
                positionRefs={positionRefs}
            />

            <ParticleSystem count={500} radius={16} color1={user1Color} color2={user2Color} />

            <CameraController />
        </>
    );
}
