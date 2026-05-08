// ═══════════════════════════════════════════════════════════
// Bust Generator — Procedural neck, shoulders, upper chest
// Extends the face mesh downward for a complete portrait
// ═══════════════════════════════════════════════════════════

import type { BustMeshData, FaceMeshData } from '../types/TwinTypes';
import { generateBustColors, extractAverageSkinColor } from './ColorSampler';

/**
 * Generate procedural bust geometry (neck + shoulders + upper chest)
 * anchored to the face mesh jawline landmarks.
 *
 * @param faceMesh - The detected face mesh data
 * @returns BustMeshData with positions, colors, and connections
 */
export function generateBust(faceMesh: FaceMeshData): BustMeshData {
  const positions: number[] = [];
  const connections: number[] = [];

  // Get anchor points from face mesh
  const chinLandmark = faceMesh.landmarks[152]; // Bottom of chin
  const leftJaw = faceMesh.landmarks[234];      // Left jaw
  const rightJaw = faceMesh.landmarks[454];     // Right jaw

  if (!chinLandmark || !leftJaw || !rightJaw) {
    console.warn('[BustGenerator] Missing jaw landmarks, using defaults');
    return { positions: [], colors: [], connections: [] };
  }

  // Calculate face width and center for proportional bust
  const faceWidth = Math.abs(rightJaw.x - leftJaw.x);
  const faceCenterX = (leftJaw.x + rightJaw.x) / 2;
  const faceCenterZ = (leftJaw.z + rightJaw.z) / 2;
  const chinY = chinLandmark.y;

  // ─── Generate Neck Points ─────────────────────────────
  const neckRings = 8;
  const neckPointsPerRing = 24;
  const neckHeight = faceWidth * 0.6;
  const neckRadiusTop = faceWidth * 0.35;
  const neckRadiusBottom = faceWidth * 0.4;

  for (let ring = 0; ring < neckRings; ring++) {
    const t = ring / (neckRings - 1); // 0 at top, 1 at bottom
    const y = chinY - t * neckHeight;
    const radius = neckRadiusTop + (neckRadiusBottom - neckRadiusTop) * t;

    for (let i = 0; i < neckPointsPerRing; i++) {
      const angle = (i / neckPointsPerRing) * Math.PI * 2;
      const x = faceCenterX + Math.cos(angle) * radius;
      const z = faceCenterZ + Math.sin(angle) * radius * 0.7; // Slightly elliptical

      // Add slight organic noise
      const noise = (Math.random() - 0.5) * faceWidth * 0.02;
      positions.push(x + noise, y + noise * 0.5, z + noise);
    }
  }

  // ─── Generate Shoulder Points ─────────────────────────
  const shoulderRings = 10;
  const shoulderPointsPerRing = 32;
  const shoulderHeight = faceWidth * 0.8;
  const neckBottomY = chinY - neckHeight;
  const maxShoulderWidth = faceWidth * 1.8;

  for (let ring = 0; ring < shoulderRings; ring++) {
    const t = ring / (shoulderRings - 1); // 0 at neck base, 1 at bottom
    const y = neckBottomY - t * shoulderHeight;

    // Exponential flare for natural shoulder curve
    const flare = Math.pow(t, 0.6);
    const radiusX = neckRadiusBottom + (maxShoulderWidth * 0.5 - neckRadiusBottom) * flare;
    const radiusZ = neckRadiusBottom * 0.7 + (maxShoulderWidth * 0.25 - neckRadiusBottom * 0.7) * flare;

    for (let i = 0; i < shoulderPointsPerRing; i++) {
      const angle = (i / shoulderPointsPerRing) * Math.PI * 2;
      const x = faceCenterX + Math.cos(angle) * radiusX;
      const z = faceCenterZ + Math.sin(angle) * radiusZ;

      // More organic noise at shoulders
      const noise = (Math.random() - 0.5) * faceWidth * 0.03;
      positions.push(x + noise, y + noise * 0.3, z + noise);
    }
  }

  // ─── Generate Upper Chest Plate ───────────────────────
  const chestRows = 5;
  const chestCols = 16;
  const chestStartY = neckBottomY - shoulderHeight * 0.3;
  const chestHeight = faceWidth * 0.4;

  for (let row = 0; row < chestRows; row++) {
    const t = row / (chestRows - 1);
    const y = chestStartY - t * chestHeight;
    const chestWidth = maxShoulderWidth * 0.4 * (1 - t * 0.3);

    for (let col = 0; col < chestCols; col++) {
      const s = (col / (chestCols - 1)) * 2 - 1; // -1 to 1
      const x = faceCenterX + s * chestWidth;
      // Curved chest profile
      const zOffset = Math.sqrt(1 - s * s) * faceWidth * 0.15;
      const z = faceCenterZ + faceWidth * 0.2 + zOffset;

      const noise = (Math.random() - 0.5) * faceWidth * 0.02;
      positions.push(x + noise, y + noise * 0.3, z + noise);
    }
  }

  // ─── Generate Connections ─────────────────────────────
  const totalPoints = positions.length / 3;

  // Connect within rings (neck)
  const neckStart = 0;
  for (let ring = 0; ring < neckRings; ring++) {
    for (let i = 0; i < neckPointsPerRing; i++) {
      const current = neckStart + ring * neckPointsPerRing + i;
      const next = neckStart + ring * neckPointsPerRing + ((i + 1) % neckPointsPerRing);
      connections.push(current, next);

      // Connect between rings
      if (ring < neckRings - 1) {
        const below = neckStart + (ring + 1) * neckPointsPerRing + i;
        connections.push(current, below);
      }
    }
  }

  // Connect within rings (shoulders)
  const shoulderStart = neckRings * neckPointsPerRing;
  for (let ring = 0; ring < shoulderRings; ring++) {
    for (let i = 0; i < shoulderPointsPerRing; i++) {
      const current = shoulderStart + ring * shoulderPointsPerRing + i;
      const next = shoulderStart + ring * shoulderPointsPerRing + ((i + 1) % shoulderPointsPerRing);
      connections.push(current, next);

      if (ring < shoulderRings - 1) {
        const below = shoulderStart + (ring + 1) * shoulderPointsPerRing + i;
        connections.push(current, below);
      }
    }
  }

  // Connect neck bottom to shoulder top (bridge)
  const neckLastRing = neckStart + (neckRings - 1) * neckPointsPerRing;
  for (let i = 0; i < neckPointsPerRing; i++) {
    const neckIdx = neckLastRing + i;
    // Find nearest shoulder point
    const shoulderIdx = shoulderStart + Math.floor((i / neckPointsPerRing) * shoulderPointsPerRing);
    connections.push(neckIdx, shoulderIdx);
  }

  // Connect chest grid
  const chestStart = shoulderStart + shoulderRings * shoulderPointsPerRing;
  for (let row = 0; row < chestRows; row++) {
    for (let col = 0; col < chestCols; col++) {
      const current = chestStart + row * chestCols + col;
      if (col < chestCols - 1) {
        connections.push(current, current + 1);
      }
      if (row < chestRows - 1) {
        connections.push(current, current + chestCols);
      }
    }
  }

  // Nearest-neighbor cross-connections for more organic look
  // Connect some shoulder points to chest points
  for (let i = 0; i < shoulderPointsPerRing; i += 3) {
    const shoulderIdx = shoulderStart + (shoulderRings - 1) * shoulderPointsPerRing + i;
    if (shoulderIdx < totalPoints && chestStart < totalPoints) {
      const chestIdx = chestStart + Math.floor((i / shoulderPointsPerRing) * chestCols);
      if (chestIdx < totalPoints) {
        connections.push(shoulderIdx, chestIdx);
      }
    }
  }

  // ─── Generate Colors ──────────────────────────────────
  const skinColor = extractAverageSkinColor(faceMesh.colors);
  const colors = generateBustColors(totalPoints, positions, skinColor);

  console.log(
    `[BustGenerator] Generated ${totalPoints} points, ${connections.length / 2} connections`
  );

  return { positions, colors, connections };
}
