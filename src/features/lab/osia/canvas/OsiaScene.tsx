import { useEffect, useMemo } from 'react';
import { useVisualizationStore } from '../stores/visualizationStore';
import { calculatePairLayout, getAllOrbs } from '../utils/layoutEngine';
import { NebulaBackground } from './NebulaBackground';
import { CentralCore } from './CentralCore';
import { OrbNode } from './OrbNode';
import { ConnectionLine } from './ConnectionLine';
import { ParticleSystem } from './ParticleSystem';
import { CameraController } from './CameraController';

export function OsiaScene() {
    const data = useVisualizationStore(s => s.data);
    const setOrbPositions = useVisualizationStore(s => s.setOrbPositions);

    // Calculate layout positions
    const positions = useMemo(() => {
        return calculatePairLayout(data);
    }, [data]);

    // Push positions to store
    useEffect(() => {
        setOrbPositions(positions);
    }, [positions, setOrbPositions]);

    const allOrbs = useMemo(() => getAllOrbs(data), [data]);
    const nonCoreOrbs = useMemo(
        () => allOrbs.filter(o => o.id !== data.centralCore.id),
        [allOrbs, data.centralCore.id]
    );

    const user1Color = data.users[0]?.colorTheme || '#4A9EFF';
    const user2Color = data.users[1]?.colorTheme || '#FF8C42';

    return (
        <>
            {/* Background — skybox, depthWrite=false so it never occludes scene objects */}
            <NebulaBackground />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1.0} color="#4A9EFF" distance={50} />
            <pointLight position={[-10, -5, 5]} intensity={0.8} color="#FF8C42" distance={50} />

            {/* Central Core — 32K particles */}
            <CentralCore
                position={positions[data.centralCore.id] || [0, 0, 0]}
                size={data.centralCore.size * 0.7}
                color1={user1Color}
                color2={user2Color}
            />

            {/* Trait + Sub-trait Orbs — GPU particles */}
            {nonCoreOrbs.map(orb => {
                const pos = positions[orb.id];
                if (!pos) return null;
                return <OrbNode key={orb.id} orb={orb} position={pos} />;
            })}

            {/* Connections */}
            {data.connections.map(conn => {
                const srcPos = positions[conn.sourceId];
                const tgtPos = positions[conn.targetId];
                if (!srcPos || !tgtPos) return null;
                return (
                    <ConnectionLine
                        key={conn.id}
                        connection={conn}
                        sourcePos={srcPos}
                        targetPos={tgtPos}
                    />
                );
            })}

            {/* Ambient Particles */}
            <ParticleSystem count={400} radius={14} color1={user1Color} color2={user2Color} />

            {/* Camera */}
            <CameraController />
        </>
    );
}
