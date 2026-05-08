// ═══════════════════════════════════════════════════════════
// NEXUS Twin Types — Foundation for all 6 phases
// ═══════════════════════════════════════════════════════════

/** Phase 1: Face mesh data extracted from MediaPipe FaceLandmarker */
export interface FaceMeshData {
  /** 478 face landmarks with 3D coordinates (normalized to scene space) */
  landmarks: Array<{ x: number; y: number; z: number }>;
  /** Raw landmark coordinates in image space [0..1] for color sampling */
  rawLandmarks: Array<{ x: number; y: number; z: number }>;
  /** Triangle tessellation indices for face mesh connectivity */
  tessellation: number[];
  /** Named contour groups for feature highlighting */
  contours: {
    jawline: number[];
    lips: number[];
    leftEye: number[];
    rightEye: number[];
    leftBrow: number[];
    rightBrow: number[];
    noseBridge: number[];
    noseBottom: number[];
    faceOval: number[];
    leftIris: number[];
    rightIris: number[];
  };
  /** RGB colors per vertex [r, g, b, r, g, b, ...] range 0-1 */
  colors: number[];
  /** Source image dimensions */
  imageWidth: number;
  imageHeight: number;
}

/** Phase 1: Procedural bust geometry (neck + shoulders + upper chest) */
export interface BustMeshData {
  /** Point positions as flat array [x, y, z, x, y, z, ...] */
  positions: number[];
  /** Per-vertex colors as flat array [r, g, b, r, g, b, ...] range 0-1 */
  colors: number[];
  /** Connection index pairs [start, end, start, end, ...] */
  connections: number[];
}

/** Render settings for the plexus portrait */
export interface TwinRenderSettings {
  pointSize: number;
  connectionOpacity: number;
  glowIntensity: number;
  rotationSpeed: number;
  breathingAmplitude: number;
  bloomStrength: number;
  bloomThreshold: number;
}

/** Default render settings matching the reference aesthetic */
export const DEFAULT_RENDER_SETTINGS: TwinRenderSettings = {
  pointSize: 2.5,
  connectionOpacity: 0.2,
  glowIntensity: 0.6,
  rotationSpeed: 0.15,
  breathingAmplitude: 0.02,
  bloomStrength: 0.15,
  bloomThreshold: 0.85,
};

/** Complete twin avatar data (persisted to server) */
export interface TwinAvatarData {
  version: number;
  createdAt: string;
  updatedAt: string;
  sourceImageHash: string;
  faceMesh: FaceMeshData;
  bustMesh: BustMeshData;
  renderSettings: TwinRenderSettings;
}

/** Twin lifecycle status — grows across all phases */
export type TwinStatus =
  | 'no_face'       // Phase 1: No photo uploaded yet
  | 'processing'    // Phase 1: Landmark extraction in progress
  | 'face_ready'    // Phase 1: 3D portrait rendered
  | 'voice_enabled' // Phase 2: STT/TTS active
  | 'memory_active' // Phase 3: Data routing live
  | 'insight_active'// Phase 4: Proactive insights enabled
  | 'social_active';// Phase 5: Social proxy mode

/** Full twin state (used by Zustand store) */
export interface TwinState {
  status: TwinStatus;
  avatar: TwinAvatarData | null;
  sourceImage: string | null;  // Data URL — NOT persisted to server
  error: string | null;

  // Phase 2+ fields (defined now for type stability)
  isSpeaking: boolean;
  isListening: boolean;
  mouthOpenness: number;        // 0-1 for lip sync animation
  currentTranscript: string;
}

/** Processing stage for the loading animation */
export type ProcessingStage =
  | 'initializing'   // Loading MediaPipe model
  | 'detecting'      // Running face detection
  | 'sampling'       // Sampling colors from photo
  | 'building_bust'  // Generating procedural bust
  | 'rendering'      // Preparing Three.js scene
  | 'complete';      // Done
