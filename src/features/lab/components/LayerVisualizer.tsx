import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { LayerNode } from './LayerNode';
import { LAYER_CLUSTERS } from '../utils/layerGrouping';
import type { Trait } from '../../blueprint/TraitTranslator';

interface NeuralPathwayProps {
    start: THREE.Vector3;
    end: THREE.Vector3;
    mid: THREE.Vector3;
    isActive: boolean;
    color: string;
}

function NeuralPathway({ start, end, mid, isActive, color }: NeuralPathwayProps) {
    const pulseRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (pulseRef.current) {
            // Synaptic fire pulse logic (conceptual)
            pulseRef.current.position.y = Math.sin(t * 2) * 0.1;
        }
    });

    return (
        <group>
            {/* The Main Bundle (multiple intertwined lines) */}
            {[...Array(6)].map((_, i) => (
                <QuadraticBezierLine
                    key={i}
                    start={start}
                    end={end}
                    mid={mid.clone().add(new THREE.Vector3(
                        (Math.random() - 0.5) * (isActive ? 1.5 : 0.8),
                        (Math.random() - 0.5) * (isActive ? 1.5 : 0.8),
                        (Math.random() - 0.5) * (isActive ? 1.5 : 0.8)
                    ))}
                    color={isActive ? color : "#002222"}
                    lineWidth={isActive ? 2.5 : 0.8}
                    transparent
                    opacity={isActive ? 0.4 : 0.05}
                    blending={THREE.AdditiveBlending}
                />
            ))}

            {/* Subtle "Synaptic Fire" Glow Point */}
            {isActive && (
                <group ref={pulseRef}>
                    {/* This would ideally use a custom shader for a real flowing pulse, 
                        but we can simulate it with a moving point later if needed. */}
                </group>
            )}
        </group>
    );
}

interface LayerVisualizerProps {
    traits: Trait[];
    onSelectLayer: (trait: Trait) => void;
    onHoverLayer: (id: string | null) => void;
    hoveredLayer: string | null;
}

export function LayerVisualizer({ traits, onSelectLayer, onHoverLayer, hoveredLayer }: LayerVisualizerProps) {
    // Generate layout data
    const { nodes, connections, hubs } = useMemo(() => {
        const clusterRadius = 10;
        const layerSpreadRadius = 5;
        const nodes: { position: [number, number, number]; trait: Trait; clusterId: string }[] = [];
        const connections: {
            start: THREE.Vector3;
            end: THREE.Vector3;
            mid: THREE.Vector3;
            id: string;
            type: 'core' | 'cluster';
            color: string;
        }[] = [];
        const hubs: { position: [number, number, number]; id: string; name: string }[] = [];

        LAYER_CLUSTERS.forEach((cluster, i) => {
            const angle = (i / LAYER_CLUSTERS.length) * Math.PI * 2;
            // High jitter for biological look
            const clusterX = Math.cos(angle) * clusterRadius + (Math.random() - 0.5) * 4;
            const clusterY = Math.sin(angle) * clusterRadius + (Math.random() - 0.5) * 4;
            const clusterZ = (Math.random() - 0.5) * 6;
            const clusterPos = new THREE.Vector3(clusterX, clusterY, clusterZ);

            hubs.push({
                position: [clusterX, clusterY, clusterZ],
                id: cluster.id,
                name: cluster.name
            });

            // Nerve Bundle: Center to Hub
            const coreMid = clusterPos.clone().multiplyScalar(0.4).add(new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 10
            ));
            connections.push({
                start: new THREE.Vector3(0, 0, 0),
                end: clusterPos,
                mid: coreMid,
                id: `hub-${cluster.id}`,
                type: 'core',
                color: '#00ffff'
            });

            // Cluster layers
            cluster.layers.forEach((searchKey, j) => {
                const realTrait = traits.find(t => (t.id || (t as any).traitId)?.toLowerCase().includes(searchKey.toLowerCase()));
                const trait: Trait = realTrait || {
                    id: `placeholder-${searchKey}`,
                    name: searchKey.charAt(0).toUpperCase() + searchKey.slice(1),
                    description: 'Atuning signature...',
                    category: 'Core',
                    intensity: 0.2
                };

                const subAngle = angle + (j - 1) * (Math.PI / 5) + (Math.random() - 0.5) * 0.4;
                const dist = layerSpreadRadius + (Math.random() - 0.5) * 4;

                const nodeX = clusterX + Math.cos(subAngle) * dist;
                const nodeY = clusterY + Math.sin(subAngle) * dist;
                const nodeZ = clusterZ + (j - 1) * 6 + (Math.random() - 0.5) * 5;
                const nodePos = new THREE.Vector3(nodeX, nodeY, nodeZ);

                nodes.push({
                    position: [nodeX, nodeY, nodeZ],
                    trait,
                    clusterId: cluster.id
                });

                // Organic connection curve
                const nodeMid = clusterPos.clone().lerp(nodePos, 0.5).add(new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3
                ));
                connections.push({
                    start: clusterPos,
                    end: nodePos,
                    mid: nodeMid,
                    id: trait.id,
                    type: 'cluster',
                    color: '#00aaaa'
                });
            });
        });

        return { nodes, connections, hubs };
    }, [traits]);

    return (
        <group>
            {/* Center Individual */}
            <LayerNode
                position={[0, 0, 0]}
                isCenter
                onHover={onHoverLayer}
                isHovered={hoveredLayer === 'center'}
            />

            {/* Cluster Hubs (Visual anchors) */}
            {hubs.map(hub => (
                <group key={hub.id} position={hub.position}>
                    <mesh>
                        <sphereGeometry args={[0.25, 24, 24]} />
                        <meshStandardMaterial
                            color="#fff"
                            emissive="#00aaaa"
                            emissiveIntensity={hoveredLayer?.includes(hub.id) ? 4 : 0.5}
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                </group>
            ))}

            {/* Layer Nodes */}
            {nodes.map((node) => (
                <LayerNode
                    key={node.trait.id}
                    position={node.position}
                    trait={node.trait}
                    onSelect={onSelectLayer}
                    onHover={onHoverLayer}
                    isHovered={hoveredLayer === node.trait.id}
                />
            ))}

            {/* Glowing Curved Connections */}
            {connections.map((conn) => (
                <NeuralPathway
                    key={conn.id}
                    start={conn.start}
                    end={conn.end}
                    mid={conn.mid}
                    isActive={!!(hoveredLayer === conn.id || (conn.type === 'core' && hoveredLayer?.includes(conn.id.replace('hub-', ''))))}
                    color={conn.color}
                />
            ))}
        </group>
    );
}
