// ═══════════════════════════════════════════════════════════
// Face Landmark Engine — MediaPipe FaceLandmarker wrapper
// Extracts 478 3D landmarks from a single photo
// ═══════════════════════════════════════════════════════════

import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

import type { FaceMeshData } from '../types/TwinTypes';
import { sampleColorsFromImage } from './ColorSampler';

// ─── MediaPipe Face Mesh Tessellation ─────────────────────
// These are the official tessellation indices from MediaPipe
// that define the triangle connectivity of the face mesh.
// Stored as [i0, i1, i2, i0, i1, i2, ...] triangle triplets.
// We convert them to edge pairs for line rendering.

// MediaPipe named contour landmark indices
const CONTOUR_INDICES = {
  jawline: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  ],
  lips: [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
    308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78,
    // Inner lips
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
  ],
  leftEye: [
    33, 7, 163, 144, 145, 153, 154, 155, 133,
    173, 157, 158, 159, 160, 161, 246,
  ],
  rightEye: [
    362, 382, 381, 380, 374, 373, 390, 249,
    263, 466, 388, 387, 386, 385, 384, 398,
  ],
  leftBrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightBrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  noseBridge: [168, 6, 197, 195, 5, 4],
  noseBottom: [
    98, 97, 2, 326, 327,
    294, 278, 344, 440, 275, 4, 45, 220, 115, 48, 64,
  ],
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
  ],
  leftIris: [468, 469, 470, 471, 472],
  rightIris: [473, 474, 475, 476, 477],
};

let landmarkerInstance: FaceLandmarker | null = null;

/**
 * Initialize the MediaPipe FaceLandmarker.
 * Loads WASM from CDN and the face_landmarker model.
 * Caches the instance for reuse.
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerInstance) return landmarkerInstance;

  console.log('[FaceLandmarkEngine] Initializing MediaPipe...');

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  );

  landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numFaces: 1,
    outputFacialTransformationMatrixes: false,
    outputFaceBlendshapes: false,
  });

  console.log('[FaceLandmarkEngine] MediaPipe ready');
  return landmarkerInstance;
}

/**
 * Detect face landmarks from an image element.
 * Returns the raw MediaPipe result.
 */
export async function detectFace(
  imageElement: HTMLImageElement
): Promise<FaceLandmarkerResult> {
  const landmarker = await initFaceLandmarker();
  const result = landmarker.detect(imageElement);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new Error('No face detected in the image. Please upload a clear face photo.');
  }

  console.log(
    `[FaceLandmarkEngine] Detected ${result.faceLandmarks[0].length} landmarks`
  );
  return result;
}

/**
 * Convert MediaPipe coordinates to Three.js scene space.
 * MediaPipe: x[0..1] left→right, y[0..1] top→bottom, z[-1..1] depth
 * Three.js:  x[-1..1] centered, y[-1..1] centered+flipped, z[-1..1] depth
 */
function normalizeToSceneSpace(
  landmarks: Array<{ x: number; y: number; z: number }>,
  scale: number = 4.0
): Array<{ x: number; y: number; z: number }> {
  // Find centroid for centering
  let cx = 0, cy = 0, cz = 0;
  for (const lm of landmarks) {
    cx += lm.x;
    cy += lm.y;
    cz += lm.z;
  }
  cx /= landmarks.length;
  cy /= landmarks.length;
  cz /= landmarks.length;

  return landmarks.map((lm) => ({
    x: (lm.x - cx) * scale,
    y: -(lm.y - cy) * scale, // Flip Y for Three.js
    z: -(lm.z - cz) * scale, // Negate Z for correct depth
  }));
}

/**
 * Generate tessellation edge pairs from triangle indices.
 * Deduplicates edges so each pair appears only once.
 */
function trianglesToEdges(triangles: number[]): number[] {
  const edgeSet = new Set<string>();
  const edges: number[] = [];

  for (let i = 0; i < triangles.length; i += 3) {
    const a = triangles[i];
    const b = triangles[i + 1];
    const c = triangles[i + 2];

    const pairs = [
      [Math.min(a, b), Math.max(a, b)],
      [Math.min(b, c), Math.max(b, c)],
      [Math.min(a, c), Math.max(a, c)],
    ];

    for (const [p, q] of pairs) {
      const key = `${p}-${q}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(p, q);
      }
    }
  }

  return edges;
}

/**
 * Get the MediaPipe face mesh tessellation indices.
 * These define the triangle mesh connectivity.
 */
function getFaceTessellation(): number[] {
  // Use the FaceLandmarker's built-in tessellation constants
  // These are the standard 468 point tessellation triangle indices
  return FaceLandmarker.FACE_LANDMARKS_TESSELATION.map(conn => [conn.start, conn.end]).flat();
}

/**
 * Main pipeline: Process an image and extract complete face mesh data.
 *
 * @param imageElement - Source image with a clear face
 * @returns FaceMeshData ready for Three.js rendering
 */
export async function processImage(
  imageElement: HTMLImageElement
): Promise<FaceMeshData> {
  // 1. Detect face landmarks
  const result = await detectFace(imageElement);
  const rawLandmarks = result.faceLandmarks[0].map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
  }));

  // 2. Sample colors from source image at landmark positions
  const colors = sampleColorsFromImage(imageElement, rawLandmarks);

  // 3. Normalize coordinates to Three.js scene space
  const landmarks = normalizeToSceneSpace(rawLandmarks);

  // 4. Get tessellation connectivity
  const tessellationPairs = getFaceTessellation();

  console.log(
    `[FaceLandmarkEngine] Processed: ${landmarks.length} landmarks, ${tessellationPairs.length / 2} edges`
  );

  return {
    landmarks,
    rawLandmarks,
    tessellation: tessellationPairs,
    contours: CONTOUR_INDICES,
    colors,
    imageWidth: imageElement.naturalWidth,
    imageHeight: imageElement.naturalHeight,
  };
}

/**
 * Cleanup MediaPipe resources.
 */
export function disposeFaceLandmarker(): void {
  if (landmarkerInstance) {
    landmarkerInstance.close();
    landmarkerInstance = null;
    console.log('[FaceLandmarkEngine] Disposed');
  }
}
