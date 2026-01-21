import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { HighFidNode } from '../../lab/components/HighFidNode';
import { HighFidConnection } from '../../lab/components/HighFidConnection';
import { LAYER_CLUSTERS } from '../../lab/utils/layerGrouping';
import type { Trait } from '../../blueprint/TraitTranslator';

interface BlueprintOrbProps {
    traits: Trait[];
}

export function BlueprintOrb({ traits }: BlueprintOrbProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { nodes, connections } = useMemo(() => {
        const nodes: any[] = [];
        const connections: any[] = [];

        // 1. Foundation Synthesis (Center)
        const centerPos = new THREE.Vector3(0, 0, 0);
        nodes.push({
            id: 'foundation',
            position: centerPos,
            size: 2.5,
            label: 'Foundation Synthesis',
            isMain: true,
            description: 'The core resonance of your digital twin.',
            intensity: 1.0
        });

        // 2. High-Fidelity 5-Cluster Star Mapping (Scaled for large container)
        const outerRadius = 9;
        const satelliteRadius = 6.5;

        LAYER_CLUSTERS.forEach((cluster, i) => {
            const angle = -Math.PI / 2 + (i * (2 * Math.PI)) / 5;

            const clusterPos = new THREE.Vector3(
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius,
                (Math.random() - 0.5) * 2
            );

            const clusterId = `cluster-${cluster.id}`;

            // Cluster Hub
            nodes.push({
                id: clusterId,
                position: clusterPos,
                size: 1.4,
                label: cluster.name,
                description: cluster.description,
                intensity: 0.8
            });

            // Fiber Optic Connection: Foundation to Hub
            connections.push({
                start: centerPos,
                end: clusterPos,
                id: `conn-foundation-${cluster.id}`
            });

            // 3. Trait Satellites (3 per cluster)
            cluster.layers.forEach((searchKey, j) => {
                const realTrait = traits.find(t =>
                    (t.id || (t as any).traitId)?.toLowerCase().includes(searchKey.toLowerCase())
                );

                const trait: Trait = realTrait || {
                    id: `placeholder-${cluster.id}-${j}`,
                    name: searchKey.charAt(0).toUpperCase() + searchKey.slice(1),
                    description: 'Awaiting pattern stabilization...',
                    category: cluster.name as any,
                    intensity: 0.3
                };

                const subAngle = angle + (j - 1) * (Math.PI / 6);
                const subNodePos = new THREE.Vector3(
                    clusterPos.x + Math.cos(subAngle) * satelliteRadius,
                    clusterPos.y + Math.sin(subAngle) * satelliteRadius,
                    clusterPos.z + (Math.random() - 0.5) * 3
                );

                const subNodeId = `trait-${trait.id}`;
                nodes.push({
                    id: subNodeId,
                    position: subNodePos,
                    size: 0.6 + trait.intensity * 0.4,
                    label: trait.name,
                    description: trait.description,
                    intensity: trait.intensity
                });

                // Connection: Hub to Trait Satellite
                connections.push({
                    start: clusterPos,
                    end: subNodePos,
                    id: `conn-${cluster.id}-${trait.id}`
                });
            });
        });

        return { nodes, connections };
    }, [traits]);

    const hoveredNode = useMemo(() => nodes.find(n => n.id === hoveredId), [nodes, hoveredId]);

    return (
        <group>
            {connections.map((conn) => (
                <HighFidConnection
                    key={conn.id}
                    start={conn.start}
                    end={conn.end}
                />
            ))}
            {nodes.map((node) => (
                <HighFidNode
                    key={node.id}
                    position={node.position}
                    size={node.size}
                    label={node.label}
                    isMain={node.isMain}
                    onHover={(hovered: boolean) => setHoveredId(hovered ? node.id : null)}
                />
            ))}

            {/* Hover Insight */}
            <AnimatePresence>
                {hoveredId && hoveredNode && (
                    <Html
                        position={hoveredNode.position.clone().add(new THREE.Vector3(0, hoveredNode.size + 1, 0))}
                        center
                        distanceFactor={15}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="pointer-events-none"
                        >
                            <div className="bg-[#050510]/80 backdrop-blur-xl border border-cyan-500/30 px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.1)] min-w-[180px]">
                                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">
                                    {hoveredNode.label}
                                </div>
                                <div className="text-[10px] text-white/60 leading-tight font-light italic">
                                    {hoveredNode.description}
                                </div>
                            </div>
                        </motion.div>
                    </Html>
                )}
            </AnimatePresence>
        </group>
    );
}
