import { useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import { ParticleOrb } from './ParticleOrb';
import { ConnectionLine } from './ConnectionLine';
import { RelationshipCluster } from './RelationshipCluster';
import {
    layoutGalaxy,
    detectGalaxyMode,
    getClusterSummary,
    type GalaxyNode,
} from '../utils/GalaxyLayout';
import type { ConnectionData, RelationshipCluster as RelCluster } from '../types';

/* ═══════════════════════════════════════════════════════════
   GalaxyScene — Master visualization component
   Renders Solo / Constellation / Nebula modes based on
   connected user count.
   ═══════════════════════════════════════════════════════════ */

// ── Types ────────────────────────────────────────────────────────
interface ConnectedUser {
    userId: string;
    name: string;
    avatarUrl?: string;
    cluster: RelCluster;
    strength: number;
    subType?: string;
}

interface GalaxySceneProps {
    connections: ConnectedUser[];
    centralOrbColor?: string;
    centralOrbSize?: number;
    centralTraits?: Array<{ trait_id: string; score: number; confidence: number }>;
    onSelectConnection?: (userId: string) => void;
    className?: string;
}

// ── Ambient Starfield ────────────────────────────────────────────
function Starfield({ count = 800 }: { count?: number }) {
    const geo = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Spherical distribution at large radius
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 30 + Math.random() * 40;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return g;
    }, [count]);

    return (
        <points geometry={geo}>
            <pointsMaterial
                color="#ffffff"
                size={0.08}
                transparent
                opacity={0.4}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

// ── Central Core Orb (Enhanced) ──────────────────────────────────
function CoreOrb({ size = 1.5, color = '#00ffff' }: { size?: number; color?: string }) {
    const groupRef = useRef<THREE.Group>(null!);
    const glowRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Multi-axis gentle rotation
        groupRef.current.rotation.y += 0.003;
        groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.15;
        groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.08;

        // Breathing scale
        const breathe = 1 + Math.sin(t * 0.8) * 0.03;
        groupRef.current.scale.setScalar(breathe);

        // Glow pulse
        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.08 + Math.sin(t * 1.2) * 0.04;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Core particle orb */}
            <ParticleOrb
                position={[0, 0, 0]}
                color={color}
                orbSize={size}
                particleCount={400}
                speed={0.8}
                opacity={0.7}
                pointSize={2.5}
                minDistance={0.4}
                maxConnections={8}
            />

            {/* Outer glow */}
            <mesh ref={glowRef} scale={size * 2.5}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.08}
                    depthWrite={false}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

// ── Connected User Orb ───────────────────────────────────────────
function UserOrb({
    node,
    onClick,
}: {
    node: GalaxyNode;
    onClick?: (userId: string) => void;
}) {
    const groupRef = useRef<THREE.Group>(null!);
    const initialPos = useMemo(() => node.position.clone(), [node.position]);
    const startAngle = useMemo(() => Math.atan2(initialPos.z, initialPos.x), [initialPos]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Orbital drift
        const speed = (node.orb.orbitalSpeed || 0.1) * 0.3;
        const currentAngle = startAngle + t * speed;
        const radius = initialPos.length();
        const y = initialPos.y + Math.sin(t * 0.5 + startAngle) * 0.3;

        groupRef.current.position.set(
            Math.cos(currentAngle) * radius,
            y,
            Math.sin(currentAngle) * radius
        );

        // Apply orbital plane tilt
        const tilt = node.orb.orbitalPlane || 0;
        if (tilt !== 0) {
            const pos = groupRef.current.position;
            const tilted = new THREE.Vector3(pos.x, pos.y, pos.z);
            tilted.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
            groupRef.current.position.copy(tilted);
        }

        // Breathing scale
        const breathe = 1 + Math.sin(t * 0.6 + startAngle * 2) * 0.05;
        groupRef.current.scale.setScalar(breathe);
    });

    const color = useMemo(() => {
        const c = new THREE.Color().setHSL(node.orb.colorHue / 360, 0.7, 0.55);
        return '#' + c.getHexString();
    }, [node.orb.colorHue]);

    const handleClick = useCallback(() => {
        if (onClick && node.orb.userId) onClick(node.orb.userId);
    }, [onClick, node.orb.userId]);

    return (
        <group ref={groupRef} position={initialPos.toArray()}>
            <ParticleOrb
                position={[0, 0, 0]}
                color={color}
                orbSize={node.orb.size}
                particleCount={Math.round(80 + node.orb.intensity * 80)}
                speed={0.5 + node.orb.intensity * 0.3}
                opacity={0.4 + node.orb.intensity * 0.3}
                pointSize={1.5}
                minDistance={0.2}
                maxConnections={4}
                onClick={handleClick as any}
            />

            {/* Name label */}
            <Html
                position={[0, node.orb.size + 0.6, 0]}
                center
                distanceFactor={12}
                occlude={false}
            >
                <div className="pointer-events-none select-none">
                    <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider whitespace-nowrap text-center">
                        {node.orb.name}
                    </div>
                </div>
            </Html>
        </group>
    );
}

// ── Nebula Cloud (for 16+ connections) ───────────────────────────
function NebulaCloud({ nodes }: { nodes: GalaxyNode[] }) {
    const particlesRef = useRef<THREE.Points>(null!);

    const geometry = useMemo(() => {
        // Create a dense particle cloud from all node positions
        const particleCount = Math.min(nodes.length * 30, 2000);
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const node = nodes[i % nodes.length];
            const spread = 2.0;

            positions[i * 3] = node.position.x + (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = node.position.y + (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = node.position.z + (Math.random() - 0.5) * spread;

            const c = new THREE.Color().setHSL(node.orb.colorHue / 360, 0.5, 0.5);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }, [nodes]);

    useFrame((state) => {
        if (!particlesRef.current) return;
        particlesRef.current.rotation.y += 0.0008;
        const t = state.clock.getElapsedTime();
        const mat = particlesRef.current.material as THREE.PointsMaterial;
        mat.opacity = 0.2 + Math.sin(t * 0.5) * 0.05;
    });

    return (
        <points ref={particlesRef} geometry={geometry}>
            <pointsMaterial
                size={0.15}
                transparent
                opacity={0.2}
                vertexColors
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

// ── Galaxy Connection Lines ──────────────────────────────────────
function GalaxyConnections({ nodes }: { nodes: GalaxyNode[] }) {
    const connections: ConnectionData[] = useMemo(() => {
        return nodes.map((node) => ({
            id: `conn-core-${node.orb.id}`,
            sourceId: 'core',
            targetId: node.orb.id,
            type: 'relationship' as const,
            strength: node.orb.intensity,
            animated: true,
            relationshipCluster: node.cluster,
            color: new THREE.Color().setHSL(node.orb.colorHue / 360, 0.5, 0.4).getStyle(),
        }));
    }, [nodes]);

    return (
        <>
            {connections.map((conn, i) => (
                <ConnectionLine
                    key={conn.id}
                    connection={conn}
                    sourcePos={[0, 0, 0]}
                    targetPos={nodes[i].position.toArray() as [number, number, number]}
                />
            ))}
        </>
    );
}

// ── Auto-Orbit Camera ────────────────────────────────────────────
function AutoOrbit() {
    const { camera } = useThree();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Gentle auto-orbit when user isn't interacting
        const radius = 22;
        const speed = 0.05;
        camera.position.x = Math.cos(t * speed) * radius;
        camera.position.z = Math.sin(t * speed) * radius;
        camera.position.y = 8 + Math.sin(t * 0.1) * 3;
        camera.lookAt(0, 0, 0);
    });

    return null;
}

// ── Inner Scene ──────────────────────────────────────────────────
function GalaxyInner({
    connections,
    centralOrbColor = '#00ffff',
    centralOrbSize = 1.5,
    onSelectConnection,
}: Omit<GalaxySceneProps, 'className'>) {
    const mode = detectGalaxyMode(connections.length);
    const galaxyNodes = useMemo(() => layoutGalaxy(connections), [connections]);
    const clusterSummary = useMemo(() => getClusterSummary(galaxyNodes), [galaxyNodes]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.15} />
            <pointLight position={[0, 0, 0]} intensity={2} color={centralOrbColor} distance={30} />
            <pointLight position={[10, 10, 10]} intensity={0.3} color="#ffffff" />

            {/* Starfield background */}
            <Starfield count={mode === 'nebula' ? 1200 : 600} />

            {/* Central core orb (always visible) */}
            <CoreOrb size={centralOrbSize} color={centralOrbColor} />

            {/* Constellation mode: individual orbs + connection lines */}
            {mode === 'constellation' && (
                <>
                    {/* Orbital rings per cluster */}
                    {clusterSummary.map((summary) => (
                        <RelationshipCluster
                            key={summary.cluster}
                            config={summary.config}
                            count={summary.count}
                        />
                    ))}

                    {/* Connection lines from core to each orb */}
                    <GalaxyConnections nodes={galaxyNodes} />

                    {/* Individual user orbs */}
                    {galaxyNodes.map((node) => (
                        <UserOrb
                            key={node.orb.id}
                            node={node}
                            onClick={onSelectConnection}
                        />
                    ))}
                </>
            )}

            {/* Nebula mode: merged cloud with cluster rings */}
            {mode === 'nebula' && (
                <>
                    {clusterSummary.map((summary) => (
                        <RelationshipCluster
                            key={summary.cluster}
                            config={summary.config}
                            count={summary.count}
                        />
                    ))}
                    <NebulaCloud nodes={galaxyNodes} />
                </>
            )}

            {/* Cluster count labels */}
            {mode !== 'solo' && clusterSummary.map((summary) => {
                const midR = (summary.config.innerRadius + summary.config.outerRadius) / 2;
                const labelPos = new THREE.Vector3(midR, 2.5, 0);
                labelPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), summary.config.planeTilt);

                return (
                    <Html
                        key={`label-${summary.cluster}`}
                        position={labelPos.toArray()}
                        center
                        distanceFactor={18}
                        occlude={false}
                    >
                        <div className="pointer-events-none select-none">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                                {summary.config.label}
                                <span className="ml-1 text-white/25">({summary.count})</span>
                            </span>
                        </div>
                    </Html>
                );
            })}

            {/* Solo mode label */}
            {mode === 'solo' && (
                <Html position={[0, -2.5, 0]} center distanceFactor={15}>
                    <div className="pointer-events-none select-none text-center">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            Your Identity Core
                        </div>
                        <div className="text-[8px] text-white/20 mt-1">
                            Connect with others to build your constellation
                        </div>
                    </div>
                </Html>
            )}

            {/* Camera */}
            <AutoOrbit />
        </>
    );
}

// ── Exported Component ───────────────────────────────────────────
export function GalaxyScene({
    connections,
    centralOrbColor,
    centralOrbSize,
    onSelectConnection,
    className = '',
}: GalaxySceneProps) {
    return (
        <div className={`w-full h-full min-h-[500px] ${className}`}>
            <Canvas
                camera={{ position: [0, 10, 22], fov: 50, near: 0.1, far: 200 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <GalaxyInner
                        connections={connections}
                        centralOrbColor={centralOrbColor}
                        centralOrbSize={centralOrbSize}
                        onSelectConnection={onSelectConnection}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
