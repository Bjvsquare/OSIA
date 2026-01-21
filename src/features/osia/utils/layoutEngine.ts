import type { VisualizationData, OrbData } from '../types';

/*
 * Radial layout engine for the 1-5-15 constellation:
 *   - Central core at origin
 *   - 5 Cluster orbs in primary ring (radius ~6)
 *   - 3 Layer orbs per cluster, fanned outward in secondary ring (radius ~3.5 from cluster)
 */

const CLUSTER_RING_RADIUS = 6.0;      // Distance from center to cluster orbs
const LAYER_RING_RADIUS = 3.5;         // Distance from cluster orb to layer orbs
const LAYER_FAN_ANGLE = Math.PI / 3;   // ±60° fan spread for layers

export type PositionMap = Record<string, [number, number, number]>;

export function calculatePairLayout(data: VisualizationData): PositionMap {
    const positions: PositionMap = {};

    // Central core at origin
    if (data.centralCore) {
        positions[data.centralCore.id] = [0, 0, 0];
    }

    // Find the 5 cluster orbs
    const clusterOrbs = data.orbs.filter(o => o.type === 'cluster');

    // Position clusters in a ring
    const clusterCount = clusterOrbs.length;
    const startAngle = -Math.PI / 2; // Start from top

    clusterOrbs.forEach((cluster, i) => {
        const angle = startAngle + (i / Math.max(clusterCount, 1)) * Math.PI * 2;
        const x = Math.cos(angle) * CLUSTER_RING_RADIUS;
        const y = Math.sin(angle) * CLUSTER_RING_RADIUS;
        positions[cluster.id] = [x, y, 0];

        // Find layers for this cluster
        const layers = data.orbs.filter(o => o.type === 'layer' && o.clusterId === cluster.id);

        // Fan layers outward from the cluster
        const layerCount = layers.length;
        layers.forEach((layer, j) => {
            // Center the fan around the outward direction
            const fanOffset = layerCount > 1
                ? (j / (layerCount - 1) - 0.5) * LAYER_FAN_ANGLE
                : 0;
            const layerAngle = angle + fanOffset;
            const lx = x + Math.cos(layerAngle) * LAYER_RING_RADIUS;
            const ly = y + Math.sin(layerAngle) * LAYER_RING_RADIUS;
            positions[layer.id] = [lx, ly, 0];
        });
    });

    return positions;
}

export function getAllOrbs(data: VisualizationData): OrbData[] {
    const all = [];
    if (data.centralCore) all.push(data.centralCore);
    if (data.orbs) all.push(...data.orbs);
    return all;
}
