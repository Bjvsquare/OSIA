// ═══════════════════════════════════════════════════════════
// Twin Store — Zustand state management for the NEXUS Twin
// Designed for all 6 phases, Phase 1 actions implemented
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type {
  TwinState,
  TwinAvatarData,
  FaceMeshData,
  BustMeshData,
  ProcessingStage,
} from '../types/TwinTypes';
import { DEFAULT_RENDER_SETTINGS } from '../types/TwinTypes';
import { processImage } from '../engine/FaceLandmarkEngine';
import { generateBust } from '../engine/BustGenerator';

interface TwinStore {
  // ─── State ─────────────────────────────────────────
  state: TwinState;
  processingStage: ProcessingStage;

  // ─── Phase 1 Actions ──────────────────────────────
  setSourceImage: (dataUrl: string) => void;
  processSourceImage: () => Promise<void>;
  setAvatarData: (data: TwinAvatarData) => void;
  loadPersistedAvatar: (userId: string) => Promise<void>;
  saveAvatarToServer: (userId: string) => Promise<void>;
  reset: () => void;

  // ─── Phase 2 Hooks (noop until Phase 2) ────────────
  setMouthOpenness: (value: number) => void;
  setSpeaking: (value: boolean) => void;
  setListening: (value: boolean) => void;
}

const initialState: TwinState = {
  status: 'no_face',
  avatar: null,
  sourceImage: null,
  error: null,
  isSpeaking: false,
  isListening: false,
  mouthOpenness: 0,
  currentTranscript: '',
};

export const useTwinStore = create<TwinStore>((set, get) => ({
  state: { ...initialState },
  processingStage: 'initializing' as ProcessingStage,

  setSourceImage: (dataUrl: string) => {
    set((s) => ({
      state: {
        ...s.state,
        sourceImage: dataUrl,
        error: null,
      },
    }));
  },

  processSourceImage: async () => {
    const { state } = get();
    if (!state.sourceImage) {
      set((s) => ({
        state: { ...s.state, error: 'No image selected' },
      }));
      return;
    }

    set((s) => ({
      state: { ...s.state, status: 'processing', error: null },
      processingStage: 'initializing' as ProcessingStage,
    }));

    try {
      // 1. Load image element
      set({ processingStage: 'detecting' as ProcessingStage });
      const img = await loadImageElement(state.sourceImage);

      // 2. Process face landmarks + sample colors
      set({ processingStage: 'sampling' as ProcessingStage });
      const faceMesh = await processImage(img);

      // 3. Generate bust geometry
      set({ processingStage: 'building_bust' as ProcessingStage });
      const bustMesh = generateBust(faceMesh);

      // 4. Build avatar data
      set({ processingStage: 'rendering' as ProcessingStage });
      const avatarData: TwinAvatarData = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceImageHash: hashString(state.sourceImage.slice(0, 1000)),
        faceMesh,
        bustMesh,
        renderSettings: { ...DEFAULT_RENDER_SETTINGS },
      };

      // 5. Set final state
      set({
        state: {
          ...get().state,
          status: 'face_ready',
          avatar: avatarData,
          error: null,
        },
        processingStage: 'complete' as ProcessingStage,
      });

      console.log('[TwinStore] Avatar processing complete');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process image';
      console.error('[TwinStore] Processing error:', error);
      set((s) => ({
        state: {
          ...s.state,
          status: 'no_face',
          error: message,
        },
      }));
    }
  },

  setAvatarData: (data: TwinAvatarData) => {
    set((s) => ({
      state: {
        ...s.state,
        avatar: data,
        status: 'face_ready',
      },
    }));
  },

  loadPersistedAvatar: async (_userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/users/twin-avatar', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.avatar) {
          // Always override stored render settings with latest defaults
          const avatar = {
            ...data.avatar,
            renderSettings: { ...DEFAULT_RENDER_SETTINGS },
          };
          set((s) => ({
            state: {
              ...s.state,
              avatar,
              status: 'face_ready',
            },
          }));
          console.log('[TwinStore] Loaded persisted avatar (render settings refreshed)');
        }
      }
    } catch (error) {
      console.warn('[TwinStore] No persisted avatar found:', error);
    }
  },

  saveAvatarToServer: async (_userId: string) => {
    const { state } = get();
    if (!state.avatar) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('/api/users/twin-avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: state.avatar }),
      });
      console.log('[TwinStore] Avatar saved to server');
    } catch (error) {
      console.error('[TwinStore] Failed to save avatar:', error);
    }
  },

  reset: () => {
    set({
      state: { ...initialState },
      processingStage: 'initializing' as ProcessingStage,
    });
  },

  // Phase 2 hooks — stubbed for now
  setMouthOpenness: (value: number) => {
    set((s) => ({
      state: { ...s.state, mouthOpenness: value },
    }));
  },

  setSpeaking: (value: boolean) => {
    set((s) => ({
      state: { ...s.state, isSpeaking: value },
    }));
  },

  setListening: (value: boolean) => {
    set((s) => ({
      state: { ...s.state, isListening: value },
    }));
  },
}));

// ─── Helpers ──────────────────────────────────────────────

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
}
