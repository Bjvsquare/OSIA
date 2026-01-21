import { create } from 'zustand';
import type { VisualizationData, ViewState, OrbData } from '../types';
import { placeholderData } from '../data/placeholderData';
import { getAllOrbs } from '../utils/layoutEngine';

interface VisualizationStore {
    data: VisualizationData;
    allOrbs: OrbData[];
    viewState: ViewState;
    orbPositions: Record<string, [number, number, number]>;

    setData: (data: VisualizationData) => void;
    selectOrb: (orbId: string | null) => void;
    hoverOrb: (orbId: string | null) => void;
    setOrbPositions: (positions: Record<string, [number, number, number]>) => void;
    navigateOrb: (direction: 'next' | 'prev') => void;
    resetView: () => void;

    isDetailPanelOpen: boolean;
    detailPanelOrb: OrbData | null;
    closeDetailPanel: () => void;
}

const defaultViewState: ViewState = {
    mode: 'overview',
    selectedOrbId: null,
    hoveredOrbId: null,
    cameraTarget: [0, 0, 0],
    cameraPosition: [0, 0, 18],
    zoomLevel: 1,
};

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
    data: placeholderData,
    allOrbs: getAllOrbs(placeholderData),
    viewState: defaultViewState,
    orbPositions: {},
    isDetailPanelOpen: false,
    detailPanelOrb: null,

    setData: (data) => set({ data, allOrbs: getAllOrbs(data) }),

    selectOrb: (orbId) => {
        const { allOrbs, orbPositions } = get();
        if (!orbId) {
            set({ viewState: { ...defaultViewState }, isDetailPanelOpen: false, detailPanelOrb: null });
            return;
        }
        const orb = allOrbs.find(o => o.id === orbId);
        const position = orbPositions[orbId] || [0, 0, 0];
        if (orb) {
            set({
                viewState: {
                    mode: 'zoomed',
                    selectedOrbId: orbId,
                    hoveredOrbId: null,
                    cameraTarget: position,
                    cameraPosition: [position[0] - 3, position[1], position[2] + 5],
                    zoomLevel: 3,
                },
                isDetailPanelOpen: true,
                detailPanelOrb: orb,
            });
        }
    },

    hoverOrb: (orbId) => set(state => ({
        viewState: { ...state.viewState, hoveredOrbId: orbId }
    })),

    setOrbPositions: (positions) => set({ orbPositions: positions }),

    navigateOrb: (direction) => {
        const { allOrbs, viewState } = get();
        if (!viewState.selectedOrbId) return;
        const navigable = allOrbs.filter(o =>
            o.type === 'core' || o.type === 'trait' || o.type === 'synergy' ||
            o.type === 'sharedVision' || o.type === 'complementary' || o.type === 'collectiveIntelligence'
        );
        const idx = navigable.findIndex(o => o.id === viewState.selectedOrbId);
        const newIdx = direction === 'next'
            ? (idx + 1) % navigable.length
            : (idx - 1 + navigable.length) % navigable.length;
        get().selectOrb(navigable[newIdx].id);
    },

    resetView: () => set({
        viewState: defaultViewState,
        isDetailPanelOpen: false,
        detailPanelOrb: null,
    }),

    closeDetailPanel: () => set({
        isDetailPanelOpen: false,
        detailPanelOrb: null,
        viewState: defaultViewState,
    }),
}));
