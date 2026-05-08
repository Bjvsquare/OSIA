// ═══════════════════════════════════════════════════════════
// MouthAnimator — Drives lip vertex displacement from amplitude
// Maps mouthOpenness (0-1) to lip landmark offsets
// ═══════════════════════════════════════════════════════════

import type { FaceMeshData } from '../types/TwinTypes';

// MediaPipe lip landmark indices (outer + inner lips)
const UPPER_LIP_INDICES = [13, 312, 311, 310, 415, 308, 82, 81, 80, 191, 78];
const LOWER_LIP_INDICES = [14, 317, 402, 318, 324, 308, 87, 178, 88, 95, 78];
const LIP_CORNER_LEFT = 78;
const LIP_CORNER_RIGHT = 308;

/**
 * Calculate lip displacement offsets for a given mouth openness value.
 * Returns a map of landmark index → {dy} offset.
 */
export function calculateMouthOffsets(
  openness: number,
  faceMesh: FaceMeshData
): Map<number, { dy: number }> {
  const offsets = new Map<number, { dy: number }>();
  const maxOpen = 0.15; // Maximum lip displacement in scene units
  const amount = openness * maxOpen;

  // Upper lip moves up
  for (const idx of UPPER_LIP_INDICES) {
    if (idx < faceMesh.landmarks.length) {
      offsets.set(idx, { dy: amount * 0.4 });
    }
  }

  // Lower lip moves down (more movement)
  for (const idx of LOWER_LIP_INDICES) {
    if (idx < faceMesh.landmarks.length) {
      offsets.set(idx, { dy: -amount * 0.7 });
    }
  }

  // Corners move slightly inward when open
  if (LIP_CORNER_LEFT < faceMesh.landmarks.length) {
    offsets.set(LIP_CORNER_LEFT, { dy: -amount * 0.1 });
  }
  if (LIP_CORNER_RIGHT < faceMesh.landmarks.length) {
    offsets.set(LIP_CORNER_RIGHT, { dy: -amount * 0.1 });
  }

  return offsets;
}

/**
 * Apply mouth offsets to a position buffer in-place.
 * Used by FacePointCloud to animate lip landmarks.
 */
export function applyMouthOffsets(
  positions: Float32Array,
  basePositions: Float32Array,
  offsets: Map<number, { dy: number }>
): void {
  // Reset to base positions
  positions.set(basePositions);

  // Apply offsets
  offsets.forEach(({ dy }, idx) => {
    positions[idx * 3 + 1] += dy; // Y axis displacement
  });
}

/**
 * Smooth mouth openness value to prevent jittery animation.
 * Uses exponential moving average.
 */
export function smoothMouthOpenness(
  current: number,
  target: number,
  smoothing: number = 0.3
): number {
  return current + (target - current) * smoothing;
}
