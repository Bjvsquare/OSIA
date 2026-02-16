import type { VisualizationData, OrbData } from '../types';

/* ═══════════════════════════════════════════════════════════
   Layout Engine — Orbital Constellation
   
   Distributes the 1-5-15 constellation with orbital motion:
   - Central core at origin (static)
   - 5 Cluster orbs orbit the core on tilted planes
   - 3 Layer orbs orbit each cluster on sub-tilted planes
   
   calculateOrbitalParams() → returns orbital parameters
   calculatePairLayout()    → legacy static fallback
   ═══════════════════════════════════════════════════════════ */

// ── Orbital Constants ────────────────────────────────────────
const CLUSTER_ORBITAL_RADIUS = 6.0;    // Distance from core to cluster orbs
const LAYER_ORBITAL_RADIUS = 2.8;      // Distance from cluster to layer orbs

// Slow, majestic speeds (radians per second)
const CLUSTER_BASE_SPEED = 0.06;       // ~60s for full orbit
const LAYER_BASE_SPEED = 0.12;         // ~52s for full orbit (slightly faster)

// Tilt variation per level
const CLUSTER_TILTS = [0, 36, 72, 108, 144];   // degrees — spread across hemisphere
const LAYER_TILT_OFFSET = 20;                    // degrees offset from parent tilt

export type PositionMap = Record<string, [number, number, number]>;

// ── Orbital Parameters ───────────────────────────────────────
export interface OrbitalParams {
    radius: number;
    speed: number;
    tiltDeg: number;
    initialAngleDeg: number;
}

export type OrbitalParamsMap = Record<string, OrbitalParams>;

/**
 * Calculate orbital parameters for all orbs in the constellation.
 * Returns per-orb radius, speed, tilt, and starting angle.
 */
export function calculateOrbitalParams(data: VisualizationData): OrbitalParamsMap {
    const params: OrbitalParamsMap = {};

    const clusterOrbs = data.orbs.filter(o => o.type === 'cluster');
    const clusterCount = clusterOrbs.length || 1;

    clusterOrbs.forEach((cluster, i) => {
        // Evenly distribute starting angles
        const initialAngle = (i / clusterCount) * 360;
        // Each cluster gets a unique orbital tilt
        const tilt = CLUSTER_TILTS[i % CLUSTER_TILTS.length];
        // Slight speed variation so orbits don't remain in lock-step
        const speedVariation = 1 + (i * 0.08);

        params[cluster.id] = {
            radius: CLUSTER_ORBITAL_RADIUS,
            speed: CLUSTER_BASE_SPEED * speedVariation,
            tiltDeg: tilt,
            initialAngleDeg: initialAngle,
        };

        // Layers for this cluster
        const layers = data.orbs.filter(o => o.type === 'layer' && o.clusterId === cluster.id);
        const layerCount = layers.length || 1;

        layers.forEach((layer, j) => {
            // 3 layers evenly spaced (120° apart)
            const layerInitialAngle = (j / layerCount) * 360;
            // Slight tilt offset from parent so orbits aren't coplanar
            const layerTilt = LAYER_TILT_OFFSET + (j * 25);
            // Slight speed variation
            const layerSpeedVar = 1 + (j * 0.1);

            params[layer.id] = {
                radius: LAYER_ORBITAL_RADIUS,
                speed: LAYER_BASE_SPEED * layerSpeedVar,
                tiltDeg: layerTilt,
                initialAngleDeg: layerInitialAngle,
            };
        });
    });

    return params;
}

// ── Legacy Static Layout (fallback) ──────────────────────────

const CLUSTER_RING_RADIUS = 6.0;
const LAYER_RING_RADIUS = 3.5;
const LAYER_FAN_ANGLE = Math.PI / 3;

export function calculatePairLayout(data: VisualizationData): PositionMap {
    const positions: PositionMap = {};

    if (data.centralCore) {
        positions[data.centralCore.id] = [0, 0, 0];
    }

    const clusterOrbs = data.orbs.filter(o => o.type === 'cluster');
    const clusterCount = clusterOrbs.length;
    const PHI = Math.PI * (3 - Math.sqrt(5));

    clusterOrbs.forEach((cluster, i) => {
        const y = 1 - (i / Math.max(clusterCount - 1, 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = PHI * i;

        const x = Math.cos(theta) * radiusAtY * CLUSTER_RING_RADIUS;
        const yPos = y * CLUSTER_RING_RADIUS * 0.7;
        const z = Math.sin(theta) * radiusAtY * CLUSTER_RING_RADIUS;

        positions[cluster.id] = [x, yPos, z];

        const layers = data.orbs.filter(o => o.type === 'layer' && o.clusterId === cluster.id);
        const layerCount = layers.length;
        const outLen = Math.sqrt(x * x + yPos * yPos + z * z) || 1;
        const outX = x / outLen;
        const outY = yPos / outLen;
        const outZ = z / outLen;

        layers.forEach((layer, j) => {
            const fanOffset = layerCount > 1
                ? (j / (layerCount - 1) - 0.5) * LAYER_FAN_ANGLE
                : 0;

            let perpX = -outZ;
            let perpY = 0;
            let perpZ = outX;
            const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
            perpX /= perpLen;
            perpZ /= perpLen;

            const perp2X = outY * perpZ - outZ * perpY;
            const perp2Y = outZ * perpX - outX * perpZ;
            const perp2Z = outX * perpY - outY * perpX;

            const fanDirX = Math.cos(fanOffset) * perpX + Math.sin(fanOffset) * perp2X;
            const fanDirY = Math.cos(fanOffset) * perpY + Math.sin(fanOffset) * perp2Y;
            const fanDirZ = Math.cos(fanOffset) * perpZ + Math.sin(fanOffset) * perp2Z;

            const lx = x + outX * LAYER_RING_RADIUS * 0.6 + fanDirX * LAYER_RING_RADIUS * 0.8;
            const ly = yPos + outY * LAYER_RING_RADIUS * 0.6 + fanDirY * LAYER_RING_RADIUS * 0.8;
            const lz = z + outZ * LAYER_RING_RADIUS * 0.6 + fanDirZ * LAYER_RING_RADIUS * 0.8;

            positions[layer.id] = [lx, ly, lz];
        });
    });

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
