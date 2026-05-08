// ═══════════════════════════════════════════════════════════
// Color Sampler — Extract pixel colors from source photo
// at each face landmark position
// ═══════════════════════════════════════════════════════════

/**
 * Sample RGB colors from the source image at the given landmark positions.
 * Uses an offscreen canvas to read pixel data.
 *
 * @param imageElement - The source HTMLImageElement
 * @param landmarks - Array of { x, y } in normalized [0..1] image space
 * @returns Flat array of [r, g, b, r, g, b, ...] in range 0-1
 */
export function sampleColorsFromImage(
  imageElement: HTMLImageElement,
  landmarks: Array<{ x: number; y: number }>
): number[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    console.warn('[ColorSampler] Canvas 2D context unavailable, using fallback colors');
    return generateFallbackColors(landmarks.length);
  }

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data; // RGBA flat array
  const colors: number[] = [];

  for (const lm of landmarks) {
    // Convert normalized coords to pixel coords
    let px = Math.round(lm.x * canvas.width);
    let py = Math.round(lm.y * canvas.height);

    // Clamp to image bounds
    px = Math.max(0, Math.min(canvas.width - 1, px));
    py = Math.max(0, Math.min(canvas.height - 1, py));

    const idx = (py * canvas.width + px) * 4;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;

    // Apply subtle warm shift to match the plexus aesthetic
    const warmR = Math.min(1, r * 1.05 + 0.02);
    const warmG = Math.min(1, g * 1.0);
    const warmB = Math.min(1, b * 0.92);

    colors.push(warmR, warmG, warmB);
  }

  return colors;
}

/**
 * Generate fallback colors when image sampling is unavailable.
 * Uses a warm skin-tone palette.
 */
function generateFallbackColors(count: number): number[] {
  const colors: number[] = [];
  for (let i = 0; i < count; i++) {
    // Warm amber/skin tone
    colors.push(0.85, 0.72, 0.55);
  }
  return colors;
}

/**
 * Generate a color gradient for the bust region.
 * Transitions from skin-tone (at neck) to cyan/teal (at shoulders).
 *
 * @param count - Number of points
 * @param t - Normalized position [0=neck, 1=shoulders]
 * @param skinColor - RGB array [r, g, b] from face sampling
 */
export function generateBustColors(
  count: number,
  positions: number[],
  skinColor: [number, number, number] = [0.85, 0.72, 0.55]
): number[] {
  const colors: number[] = [];
  const cyanColor: [number, number, number] = [0.22, 0.64, 0.65]; // #38A3A5
  const amberColor: [number, number, number] = [0.83, 0.64, 0.45]; // #D4A373

  // Find Y range for gradient calculation
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    minY = Math.min(minY, positions[i]);
    maxY = Math.max(maxY, positions[i]);
  }
  const yRange = maxY - minY || 1;

  for (let i = 0; i < count; i++) {
    const y = positions[i * 3 + 1];
    // t = 0 at top (neck, near face), t = 1 at bottom (shoulders)
    const t = Math.max(0, Math.min(1, (maxY - y) / yRange));

    // Blend: skin → amber (0-0.4) → cyan (0.4-1.0)
    let r: number, g: number, b: number;
    if (t < 0.4) {
      const blend = t / 0.4;
      r = skinColor[0] + (amberColor[0] - skinColor[0]) * blend;
      g = skinColor[1] + (amberColor[1] - skinColor[1]) * blend;
      b = skinColor[2] + (amberColor[2] - skinColor[2]) * blend;
    } else {
      const blend = (t - 0.4) / 0.6;
      r = amberColor[0] + (cyanColor[0] - amberColor[0]) * blend;
      g = amberColor[1] + (cyanColor[1] - amberColor[1]) * blend;
      b = amberColor[2] + (cyanColor[2] - amberColor[2]) * blend;
    }

    colors.push(r, g, b);
  }

  return colors;
}

/**
 * Extract average skin color from face landmarks for bust gradient anchoring.
 */
export function extractAverageSkinColor(
  faceColors: number[],
  cheekIndices: number[] = [234, 454, 50, 280] // MediaPipe cheek landmarks
): [number, number, number] {
  let r = 0, g = 0, b = 0;
  let count = 0;

  for (const idx of cheekIndices) {
    if (idx * 3 + 2 < faceColors.length) {
      r += faceColors[idx * 3];
      g += faceColors[idx * 3 + 1];
      b += faceColors[idx * 3 + 2];
      count++;
    }
  }

  if (count === 0) return [0.85, 0.72, 0.55]; // fallback

  return [r / count, g / count, b / count];
}
