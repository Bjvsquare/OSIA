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
        if (!data) return {};
        return calculatePairLayout(data);
    }, [data]);

    // Push positions to store
    useEffect(() => {
        if (Object.keys(positions).length > 0) {
            setOrbPositions(positions);
        }
    }, [positions, setOrbPositions]);

    const allOrbs = useMemo(() => (data ? getAllOrbs(data) : []), [data]);
    const nonCoreOrbs = useMemo(() => (data ? allOrbs.filter(o => o.id !== data.centralCore.id) : []), [allOrbs, data]);

    if (!data) {
        // While loading, show a simple sphere so the canvas isn't black
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

            <CentralCore
                position={positions[data.centralCore.id] || [0, 0, 0]}
                size={data.centralCore.size * 0.7}
                color1={user1Color}
                color2={user2Color}
            />

            {nonCoreOrbs.map(orb => {
                const pos = positions[orb.id];
                if (!pos) return null;
                return <OrbNode key={orb.id} orb={orb} position={pos} />;
            })}

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

            <ParticleSystem count={500} radius={16} color1={user1Color} color2={user2Color} />

            <CameraController />
        </>
    );
}
