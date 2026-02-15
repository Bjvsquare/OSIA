import type { VisualizationData, OrbData } from '../types';

/* ═══════════════════════════════════════════════════════════
   Layout Engine — 3D Spherical Constellation
   
   Distributes the 1-5-15 constellation in full 3D space:
   - Central core at origin
   - 5 Cluster orbs on a sphere (Fibonacci lattice)
   - 3 Layer orbs per cluster, fanned outward with Z depth
   ═══════════════════════════════════════════════════════════ */

const CLUSTER_RING_RADIUS = 6.0;       // Distance from center to cluster orbs
const LAYER_RING_RADIUS = 3.5;          // Distance from cluster orb to layer orbs
const LAYER_FAN_ANGLE = Math.PI / 3;    // ±60° fan spread for layers

export type PositionMap = Record<string, [number, number, number]>;

export function calculatePairLayout(data: VisualizationData): PositionMap {
    const positions: PositionMap = {};

    // Central core at origin
    if (data.centralCore) {
        positions[data.centralCore.id] = [0, 0, 0];
    }

    // Find the 5 cluster orbs
    const clusterOrbs = data.orbs.filter(o => o.type === 'cluster');
    const clusterCount = clusterOrbs.length;

    // Position clusters on a 3D sphere using Fibonacci lattice
    // This distributes points evenly across a sphere (golden angle method)
    const PHI = Math.PI * (3 - Math.sqrt(5)); // Golden angle ≈ 2.399 rad

    clusterOrbs.forEach((cluster, i) => {
        // Fibonacci lattice spherical distribution
        const y = 1 - (i / Math.max(clusterCount - 1, 1)) * 2; // y: 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = PHI * i;

        const x = Math.cos(theta) * radiusAtY * CLUSTER_RING_RADIUS;
        const yPos = y * CLUSTER_RING_RADIUS * 0.7; // Flatten slightly
        const z = Math.sin(theta) * radiusAtY * CLUSTER_RING_RADIUS;

        positions[cluster.id] = [x, yPos, z];

        // Find layers for this cluster
        const layers = data.orbs.filter(o => o.type === 'layer' && o.clusterId === cluster.id);
        const layerCount = layers.length;

        // Fan layers outward from the cluster in 3D
        // Outward direction = normalized (x, yPos, z)
        const outLen = Math.sqrt(x * x + yPos * yPos + z * z) || 1;
        const outX = x / outLen;
        const outY = yPos / outLen;
        const outZ = z / outLen;

        layers.forEach((layer, j) => {
            // Fan offset angle around the outward axis
            const fanOffset = layerCount > 1
                ? (j / (layerCount - 1) - 0.5) * LAYER_FAN_ANGLE
                : 0;

            // Create perpendicular vectors for fanning
            // Cross product with up vector (0,1,0) to get a tangent
            let perpX = -outZ;
            let perpY = 0;
            let perpZ = outX;
            const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
            perpX /= perpLen;
            perpZ /= perpLen;

            // Second perpendicular (cross outward with first perp)
            const perp2X = outY * perpZ - outZ * perpY;
            const perp2Y = outZ * perpX - outX * perpZ;
            const perp2Z = outX * perpY - outY * perpX;

            // Fan direction in the plane perpendicular to outward
            const fanDirX = Math.cos(fanOffset) * perpX + Math.sin(fanOffset) * perp2X;
            const fanDirY = Math.cos(fanOffset) * perpY + Math.sin(fanOffset) * perp2Y;
            const fanDirZ = Math.cos(fanOffset) * perpZ + Math.sin(fanOffset) * perp2Z;

            // Layer position = cluster position + outward + fan offset
            const lx = x + outX * LAYER_RING_RADIUS * 0.6 + fanDirX * LAYER_RING_RADIUS * 0.8;
            const ly = yPos + outY * LAYER_RING_RADIUS * 0.6 + fanDirY * LAYER_RING_RADIUS * 0.8;
            const lz = z + outZ * LAYER_RING_RADIUS * 0.6 + fanDirZ * LAYER_RING_RADIUS * 0.8;

            positions[layer.id] = [lx, ly, lz];
        });
    });

    // Also position synergy nodes and shared nodes if they exist
    if (data.synergyNodes) {
        data.synergyNodes.forEach((node, i) => {
            const angle = (i / Math.max(data.synergyNodes.length, 1)) * Math.PI * 2;
            const r = CLUSTER_RING_RADIUS * 0.4;
            positions[node.id] = [
                Math.cos(angle) * r,
                Math.sin(angle * 0.7) * r * 0.5,
                Math.sin(angle) * r
            ];
        });
    }

    if (data.sharedNodes) {
        data.sharedNodes.forEach((node, i) => {
            const angle = (i / Math.max(data.sharedNodes.length, 1)) * Math.PI * 2 + Math.PI / 4;
            const r = CLUSTER_RING_RADIUS * 0.5;
            positions[node.id] = [
                Math.cos(angle) * r,
                Math.sin(angle * 1.3) * r * 0.4,
                Math.sin(angle) * r
            ];
        });
    }

    return positions;
}

export function getAllOrbs(data: VisualizationData): OrbData[] {
    const all = [];
    if (data.centralCore) all.push(data.centralCore);
    if (data.orbs) all.push(...data.orbs);
    return all;
}
