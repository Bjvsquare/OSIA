import * as THREE from 'three';
import type { OrbData, RelationshipCluster, GalaxyViewMode } from '../types';

/* ═══════════════════════════════════════════════════════════
   GalaxyLayout — 3D spatial distribution engine
   Places connected orbs in spiral-arm galaxy formation
   with tilted orbital planes per relationship cluster.
   ═══════════════════════════════════════════════════════════ */

// ── Cluster Configuration ────────────────────────────────────────
export interface ClusterConfig {
    cluster: RelationshipCluster;
    innerRadius: number;
    outerRadius: number;
    planeTilt: number;       // radians
    baseHue: number;         // 0-360
    spiralArms: number;
    label: string;
}

export const CLUSTER_CONFIGS: ClusterConfig[] = [
    { cluster: 'family', innerRadius: 3, outerRadius: 5.5, planeTilt: 0, baseHue: 40, spiralArms: 2, label: 'Family' },
    { cluster: 'friends', innerRadius: 5, outerRadius: 8.5, planeTilt: Math.PI / 12, baseHue: 180, spiralArms: 3, label: 'Friends' },
    { cluster: 'colleagues', innerRadius: 8, outerRadius: 12, planeTilt: -Math.PI / 12, baseHue: 270, spiralArms: 3, label: 'Colleagues' },
    { cluster: 'team', innerRadius: 6, outerRadius: 9, planeTilt: Math.PI / 8, baseHue: 160, spiralArms: 2, label: 'Team' },
    { cluster: 'org', innerRadius: 10, outerRadius: 15, planeTilt: -Math.PI / 10, baseHue: 220, spiralArms: 4, label: 'Organization' },
];

// ── Galaxy Mode Detection ────────────────────────────────────────
export function detectGalaxyMode(connectionCount: number): GalaxyViewMode {
    if (connectionCount === 0) return 'solo';
    if (connectionCount <= 15) return 'constellation';
    return 'nebula';
}

// ── Spiral Arm Position Calculator ───────────────────────────────
function spiralArmPosition(
    index: number,
    totalInCluster: number,
    config: ClusterConfig,
    seed: number
): THREE.Vector3 {
    const { innerRadius, outerRadius, planeTilt, spiralArms } = config;

    // Distribute evenly, then assign to spiral arms
    const armIndex = index % spiralArms;
    const posInArm = Math.floor(index / spiralArms);
    const totalInArm = Math.ceil(totalInCluster / spiralArms);

    // Logarithmic spiral: r = a * e^(b * theta)
    const t = totalInArm > 1 ? posInArm / (totalInArm - 1) : 0.5;
    const radius = innerRadius + (outerRadius - innerRadius) * t;

    // Angle: base arm offset + spiral twist
    const armOffset = (armIndex / spiralArms) * Math.PI * 2;
    const spiralTwist = t * Math.PI * 0.8; // ~144° total twist
    const angle = armOffset + spiralTwist;

    // Seeded random scatter for natural feel
    const rng = seedRandom(seed + index * 137);
    const scatter = 0.4 + rng() * 0.3;
    const yScatter = (rng() - 0.5) * 1.5;

    // Position on the XZ plane
    const x = Math.cos(angle) * (radius + scatter);
    const z = Math.sin(angle) * (radius + scatter);
    const y = yScatter;

    // Apply orbital plane tilt (rotate around X axis)
    const pos = new THREE.Vector3(x, y, z);
    pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), planeTilt);

    return pos;
}

// ── Layout All Connections ───────────────────────────────────────
export interface GalaxyNode {
    orb: OrbData;
    position: THREE.Vector3;
    cluster: RelationshipCluster;
    config: ClusterConfig;
}

export function layoutGalaxy(
    connections: Array<{
        userId: string;
        name: string;
        avatarUrl?: string;
        cluster: RelationshipCluster;
        strength: number;
        subType?: string;
    }>,
    seed: number = 42
): GalaxyNode[] {
    const nodes: GalaxyNode[] = [];

    // Group by cluster
    const groups = new Map<RelationshipCluster, typeof connections>();
    for (const conn of connections) {
        const list = groups.get(conn.cluster) || [];
        list.push(conn);
        groups.set(conn.cluster, list);
    }

    // Sort within each group by strength (stronger = closer to center)
    for (const [, list] of groups) {
        list.sort((a, b) => b.strength - a.strength);
    }

    // Position each node
    for (const [cluster, list] of groups) {
        const config = CLUSTER_CONFIGS.find(c => c.cluster === cluster) || CLUSTER_CONFIGS[1];

        list.forEach((conn, i) => {
            const position = spiralArmPosition(i, list.length, config, seed);

            const orb: OrbData = {
                id: `galaxy-${conn.userId}`,
                name: conn.name,
                type: 'connection',
                description: `${config.label} connection`,
                intensity: conn.strength,
                colorHue: config.baseHue + (i * 15) % 60,
                size: 0.4 + conn.strength * 0.4,
                userId: conn.userId,
                avatarUrl: conn.avatarUrl,
                orbitalRadius: position.length(),
                orbitalAngle: Math.atan2(position.z, position.x),
                orbitalPlane: config.planeTilt,
                orbitalSpeed: 0.1 + (1 - conn.strength) * 0.15,
                relationshipCluster: cluster,
            };

            nodes.push({ orb, position, cluster, config });
        });
    }

    return nodes;
}

// ── Orbital Ring Geometry ────────────────────────────────────────
export function createOrbitalRing(config: ClusterConfig): {
    midRadius: number;
    tilt: number;
    hue: number;
} {
    return {
        midRadius: (config.innerRadius + config.outerRadius) / 2,
        tilt: config.planeTilt,
        hue: config.baseHue,
    };
}

// ── Cluster Summary ──────────────────────────────────────────────
export function getClusterSummary(nodes: GalaxyNode[]): Array<{
    cluster: RelationshipCluster;
    config: ClusterConfig;
    count: number;
    avgStrength: number;
}> {
    const map = new Map<RelationshipCluster, { count: number; totalStrength: number; config: ClusterConfig }>();
    for (const node of nodes) {
        const entry = map.get(node.cluster) || { count: 0, totalStrength: 0, config: node.config };
        entry.count++;
        entry.totalStrength += node.orb.intensity;
        map.set(node.cluster, entry);
    }

    return Array.from(map.entries()).map(([cluster, data]) => ({
        cluster,
        config: data.config,
        count: data.count,
        avgStrength: data.totalStrength / data.count,
    }));
}

// ── Seeded RNG (deterministic positions) ─────────────────────────
function seedRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}
