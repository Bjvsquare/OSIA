import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { HighFidNode } from './HighFidNode';
import { HighFidConnection } from './HighFidConnection';
import type { Trait } from '../../blueprint/TraitTranslator';
import { motion, AnimatePresence } from 'framer-motion';
import { Html } from '@react-three/drei';
import { HighFidContentCard } from './HighFidContentCard';

interface HighFidVisualizerProps {
    traits: Trait[];
    thesis?: any;
}

export function HighFidVisualizer({ traits, thesis }: HighFidVisualizerProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { nodes, connections } = useMemo(() => {
        const nodes: any[] = [];
        const connections: any[] = [];

        // 1. Center Node: Foundation Synthesis
        const centerPos = new THREE.Vector3(0, 0, 0);
        nodes.push({
            id: 'center',
            position: centerPos,
            size: 3.2,
            label: 'Foundation Synthesis',
            isMain: true,
            description: thesis?.overview || 'Primary Persona Thesis Blueprint',
            intensity: 1.0
        });

        // 2. Cluster Mapping Configuration
        const clusterConfigs = [
            { id: 'A', label: 'Core Being', categories: ['Core'], angle: -Math.PI / 2 },
            { id: 'B', label: 'Cognitive & Motivational', categories: ['Intellectual', 'Drive'], angle: -Math.PI / (2 / 5) - Math.PI / 2 }, // Star distribution
            { id: 'C', label: 'Emotional & Behavioural', categories: ['Emotional'], angle: (2 * Math.PI) / 5 - Math.PI / 2 },
            { id: 'D', label: 'Relational & Social', categories: ['Social'], angle: (4 * Math.PI) / 5 - Math.PI / 2 },
            { id: 'E', label: 'Trajectory & Development', categories: ['Expansion', 'Structure'], angle: (6 * Math.PI) / 5 - Math.PI / 2 },
        ];

        // Adjusted angles for a better star feel
        clusterConfigs[0].angle = -Math.PI / 2; // Top
        clusterConfigs[1].angle = -Math.PI / 2 + (2 * Math.PI) / 5;
        clusterConfigs[2].angle = -Math.PI / 2 + (4 * Math.PI) / 5;
        clusterConfigs[3].angle = -Math.PI / 2 + (6 * Math.PI) / 5;
        clusterConfigs[4].angle = -Math.PI / 2 + (8 * Math.PI) / 5;

        const outerRadius = 10;
        const subLayerRadius = 5.0;

        clusterConfigs.forEach((config, i) => {
            const clusterPos = new THREE.Vector3(
                Math.cos(config.angle) * outerRadius,
                Math.sin(config.angle) * outerRadius,
                (Math.random() - 0.5) * 2
            );

            const clusterId = `cluster-${config.id}`;

            // Cluster Hub
            nodes.push({
                id: clusterId,
                position: clusterPos,
                size: 1.8,
                label: config.label,
                description: `Analytical cluster representing the ${config.label} dimensions of your persona archetype.`,
                intensity: 0.8
            });

            // Connection: Center to Cluster Hub
            connections.push({
                start: centerPos,
                end: clusterPos,
                id: `conn-center-${clusterId}`
            });

            // Sub-layers: Pull top 3 traits from categories
            const clusterTraits = traits
                .filter(t => config.categories.includes(t.category as any))
                .sort((a, b) => b.intensity - a.intensity)
                .slice(0, 3);

            // Filling with placeholders if traits are missing
            const finalClusterTraits = [...clusterTraits];
            while (finalClusterTraits.length < 3) {
                finalClusterTraits.push({
                    id: `placeholder-${i}-${finalClusterTraits.length}`,
                    name: 'Pending Sync',
                    intensity: 0.5,
                    description: 'Awaiting deeper signal analysis...',
                    category: config.categories[0] as any
                });
            }

            finalClusterTraits.forEach((trait, j) => {
                const subAngle = config.angle + (j - 1) * (Math.PI / 5);
                const subNodePos = new THREE.Vector3(
                    clusterPos.x + Math.cos(subAngle) * subLayerRadius,
                    clusterPos.y + Math.sin(subAngle) * subLayerRadius,
                    clusterPos.z + (Math.random() - 0.5) * 2
                );

                const subNodeId = `sub-${config.id}-${j}`;
                nodes.push({
                    id: subNodeId,
                    position: subNodePos,
                    size: 0.7 + trait.intensity * 0.5,
                    label: trait.name,
                    description: trait.description,
                    intensity: trait.intensity
                });

                // Connection: Cluster Hub to Sub-Node
                connections.push({
                    start: clusterPos,
                    end: subNodePos,
                    id: `conn-${clusterId}-${subNodeId}`
                });
            });
        });

        return { nodes, connections };
    }, [traits, thesis]);

    const hoveredNode = useMemo(() => nodes.find(n => n.id === hoveredId), [nodes, hoveredId]);
    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedId), [nodes, selectedId]);

    return (
        <>
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
                        onClick={() => setSelectedId(node.id)}
                    />
                ))}

                {/* Hover Callout Bubble */}
                <AnimatePresence>
                    {hoveredNode && !selectedId && (
                        <Html
                            position={hoveredNode.position.clone().add(new THREE.Vector3(0, hoveredNode.size + 1.5, 0))}
                            center
                            distanceFactor={15}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="pointer-events-none"
                            >
                                <div className="bg-[#050510]/80 backdrop-blur-xl border border-cyan-500/40 px-6 py-4 rounded-[2rem] rounded-bl-none shadow-[0_0_40px_rgba(0,255,255,0.15)] min-w-[200px]">
                                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">
                                        {hoveredNode.label}
                                    </div>
                                    <div className="text-[11px] text-white/70 leading-relaxed max-w-[180px] font-light">
                                        {hoveredNode.description}
                                    </div>
                                    {/* Visual "tail" */}
                                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#050510]/80 border-l border-b border-cyan-500/40 transform rotate-45" />
                                </div>
                            </motion.div>
                        </Html>
                    )}
                </AnimatePresence>
            </group>

            {/* Premium Information Card */}
            <Html fullscreen>
                <HighFidContentCard
                    isOpen={!!selectedId}
                    onClose={() => setSelectedId(null)}
                    data={selectedNode ? {
                        label: selectedNode.label,
                        description: selectedNode.description,
                        intensity: selectedNode.intensity
                    } : null}
                />
            </Html>
        </>
    );
}
