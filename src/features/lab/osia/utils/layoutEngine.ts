import type { VisualizationData, OrbData } from '../types';

/*
 * Radial layout engine for the constellation:
 *   - Central core at origin
 *   - 5 trait orbs evenly spaced in a ring (radius ~5)
 *   - 3 sub-trait orbs per trait, fanned outward from each trait
 */

const TRAIT_RING_RADIUS = 5.5;      // Distance from center to trait orbs
const SUB_RING_RADIUS = 3.2;        // Distance from trait orb to sub-trait orbs
const SUB_FAN_ANGLE = Math.PI / 4;  // ±45° fan spread for sub-traits

export type PositionMap = Record<string, [number, number, number]>;

export function calculatePairLayout(data: VisualizationData): PositionMap {
    const positions: PositionMap = {};

    // Central core at origin
    positions[data.centralCore.id] = [0, 0, 0];

    // Find the 5 trait orbs (type === 'trait' or 'synergy' with no parent)
    const traitOrbs = data.orbs.filter(o =>
        (o.type === 'trait' || o.type === 'synergy') && !o.metadata?.parent
    );

    // Position traits in a ring
    const traitCount = traitOrbs.length;
    const startAngle = -Math.PI / 2; // Start from top

    traitOrbs.forEach((trait, i) => {
        const angle = startAngle + (i / traitCount) * Math.PI * 2;
        const x = Math.cos(angle) * TRAIT_RING_RADIUS;
        const y = Math.sin(angle) * TRAIT_RING_RADIUS;
        positions[trait.id] = [x, y, 0];

        // Find sub-traits for this trait
        const subs = data.orbs.filter(o => o.metadata?.parent === trait.id);

        // Fan sub-traits outward from the trait
        const subCount = subs.length;
        subs.forEach((sub, j) => {
            // Center the fan around the outward direction
            const fanOffset = subCount > 1
                ? (j / (subCount - 1) - 0.5) * SUB_FAN_ANGLE * 2
                : 0;
            const subAngle = angle + fanOffset;
            const sx = x + Math.cos(subAngle) * SUB_RING_RADIUS;
            const sy = y + Math.sin(subAngle) * SUB_RING_RADIUS;
            positions[sub.id] = [sx, sy, 0];
        });
    });

    return positions;
}

export function getAllOrbs(data: VisualizationData): OrbData[] {
    return [data.centralCore, ...data.orbs];
}
