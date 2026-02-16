import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ── Circular gradient sprite (shared) ─────────────────────────── */
let _circleSprite: THREE.Texture | null = null;
function getCircleSprite(): THREE.Texture {
    if (_circleSprite) return _circleSprite;
    const sz = 64;
    const canvas = document.createElement('canvas');
    canvas.width = sz;
    canvas.height = sz;
    const ctx = canvas.getContext('2d')!;
    const c = sz / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);
    _circleSprite = new THREE.CanvasTexture(canvas);
    return _circleSprite;
}

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
    portraitUrl?: string | null;
}

// ── Ambient Starfield (circular dots) ────────────────────────────
function Starfield({ count = 800 }: { count?: number }) {
    const circleMap = useMemo(() => getCircleSprite(), []);
    const geo = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
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
                map={circleMap}
                color="#ffffff"
                size={0.12}
                transparent
                opacity={0.4}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

/* ── Tight circular alpha mask — writes gradient into COLOR channels
   because Three.js alphaMap reads luminance, NOT the alpha channel ── */
let _circleMask: THREE.DataTexture | null = null;
function getCircleMask(): THREE.DataTexture {
    if (_circleMask) return _circleMask;
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    const radius = size / 2;
    const edge = size * 0.08;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
            const t = Math.max(0, Math.min(1, (radius - dist) / edge));
            const alpha = t * t * (3 - 2 * t); // smoothstep
            const v = Math.round(alpha * 255);
            // Write to R, G, B (alphaMap reads luminance from these)
            data[idx] = v;
            data[idx + 1] = v;
            data[idx + 2] = v;
            data[idx + 3] = 255; // fully opaque texture
        }
    }
    _circleMask = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    _circleMask.needsUpdate = true;
    return _circleMask;
}

// ── Portrait plane (used in both CoreOrb and UserOrb) ────────────
function AvatarPortrait({ url, size: orbSize }: { url: string; size: number }) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const circleMask = useMemo(() => getCircleMask(), []);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    // orbSize is radius; fill the sphere generously
    const planeSize = orbSize * 2.15;

    useEffect(() => {
        // Load via Image element (handles EXIF orientation) then center-crop to square
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const side = Math.min(w, h);
            const sx = (w - side) / 2;
            const sy = (h - side) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = side;
            canvas.height = side;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            setTexture(tex);
        };
        img.onerror = (err) => {
            console.warn('[AvatarPortrait] Failed to load image:', url, err);
        };
        img.src = url;
    }, [url]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        // Always face the camera by copying its quaternion
        meshRef.current.quaternion.copy(state.camera.quaternion);
        // Gentle breathing
        meshRef.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.015);
    });

    if (!texture) return null;

    return (
        <mesh ref={meshRef} renderOrder={0}>
            <planeGeometry args={[planeSize, planeSize]} />
            <meshBasicMaterial
                map={texture}
                alphaMap={circleMask}
                transparent
                opacity={0.65}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ── Central Core Orb (Enhanced) ──────────────────────────────────
function CoreOrb({ size = 1.5, color = '#00ffff', portraitUrl }: { size?: number; color?: string; portraitUrl?: string }) {
    const groupRef = useRef<THREE.Group>(null!);

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
    });

    return (
        <>
            {/* Rotating particle orb */}
            <group ref={groupRef}>
                <ParticleOrb
                    position={[0, 0, 0]}
                    color={color}
                    orbSize={size}
                    particleCount={250}
                    speed={0.8}
                    opacity={portraitUrl ? 0.4 : 0.7}
                    pointSize={1.5}
                    minDistance={0.4}
                    maxConnections={8}
                />
            </group>

            {/* Portrait OUTSIDE the rotating group — always faces camera via Billboard */}
            {portraitUrl && (
                <AvatarPortrait url={portraitUrl} size={size} />
            )}
        </>
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

    // Compute un-tilted radius and starting angle from the initial position
    const { untiltedRadius, startAngle, tilt } = useMemo(() => {
        // The initial position has tilt already applied; undo it to get the flat-plane radius
        const pos = node.position.clone();
        const t = node.config.planeTilt;
        if (t !== 0) {
            pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), -t);
        }
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        const angle = Math.atan2(pos.z, pos.x);
        return { untiltedRadius: r, startAngle: angle, tilt: t };
    }, [node.position, node.config.planeTilt]);

    const lineObj = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const mat = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(node.orb.colorHue / 360, 0.5, 0.4),
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
        });
        return new THREE.Line(geo, mat);
    }, [node.orb.colorHue]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Orbital drift on the flat XZ plane
        const speed = (node.orb.orbitalSpeed || 0.1) * 1.2;
        const currentAngle = startAngle + t * speed;
        const yBob = Math.sin(t * 0.5 + startAngle) * 0.3;

        // Position on the flat plane
        const flatX = Math.cos(currentAngle) * untiltedRadius;
        const flatY = yBob;
        const flatZ = Math.sin(currentAngle) * untiltedRadius;

        // Apply orbital plane tilt once
        const pos = new THREE.Vector3(flatX, flatY, flatZ);
        if (tilt !== 0) {
            pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        }
        groupRef.current.position.copy(pos);

        // Breathing scale
        const breathe = 1 + Math.sin(t * 0.6 + startAngle * 2) * 0.05;
        groupRef.current.scale.setScalar(breathe);

        // Update connection line: from center [0,0,0] to current position
        const arr = lineObj.geometry.attributes.position.array as Float32Array;
        arr[0] = 0; arr[1] = 0; arr[2] = 0;
        arr[3] = pos.x; arr[4] = pos.y; arr[5] = pos.z;
        lineObj.geometry.attributes.position.needsUpdate = true;
    });

    const color = useMemo(() => {
        const c = new THREE.Color().setHSL(node.orb.colorHue / 360, 0.7, 0.55);
        return '#' + c.getHexString();
    }, [node.orb.colorHue]);

    const handleClick = useCallback(() => {
        if (onClick && node.orb.userId) onClick(node.orb.userId);
    }, [onClick, node.orb.userId]);

    return (
        <>
            {/* Dynamic connection line from center to this orb */}
            <primitive object={lineObj} />

            <group ref={groupRef} position={node.position.toArray()}>
                <ParticleOrb
                    position={[0, 0, 0]}
                    color={color}
                    orbSize={node.orb.size}
                    particleCount={Math.round(80 + node.orb.intensity * 80)}
                    speed={0.5 + node.orb.intensity * 0.3}
                    opacity={node.orb.avatarUrl ? 0.3 : (0.4 + node.orb.intensity * 0.3)}
                    pointSize={1.5}
                    minDistance={0.2}
                    maxConnections={4}
                    onClick={handleClick as any}
                />

                {/* User avatar portrait inside the orb */}
                {node.orb.avatarUrl && (
                    <AvatarPortrait url={node.orb.avatarUrl} size={node.orb.size} />
                )}

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
        </>
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
    portraitUrl,
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
            <CoreOrb size={centralOrbSize} color={centralOrbColor} portraitUrl={portraitUrl || undefined} />

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

                    {/* Individual user orbs (each includes its own connection line) */}
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
    portraitUrl,
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
                        portraitUrl={portraitUrl}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
