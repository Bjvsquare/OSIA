import { create } from 'zustand';
import axios from 'axios';
import type { VisualizationData, ViewState, OrbData, ConnectionData } from '../types';
import { getAllOrbs } from '../utils/layoutEngine';

interface VisualizationStore {
    data: VisualizationData | null;
    allOrbs: OrbData[];
    viewState: ViewState;
    orbPositions: Record<string, [number, number, number]>;
    isLoading: boolean;
    error: string | null;

    fetchData: () => Promise<void>;
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
    data: null,
    allOrbs: [],
    viewState: defaultViewState,
    orbPositions: {},
    isLoading: false,
    error: null,
    isDetailPanelOpen: false,
    detailPanelOrb: null,

    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const savedAuth = localStorage.getItem('OSIA_auth');
            const authObj = savedAuth ? JSON.parse(savedAuth) : null;
            const token = authObj?.token;

            const response = await axios.get('/api/osia/latest', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const output = response.data;

            const orbs: OrbData[] = [];
            const connections: ConnectionData[] = [];

            // 1. Core
            const centralCore: OrbData = {
                id: 'core-root',
                name: 'The Core',
                type: 'core',
                description: 'The geometric center of your intelligence model.',
                intensity: 1.0,
                colorHue: 0,
                size: 2.2,
            };

            // 2. Clusters
            const { CLUSTERS, LAYERS } = await import('../types');

            CLUSTERS.forEach(cluster => {
                orbs.push({
                    id: cluster.id,
                    name: cluster.name,
                    type: 'cluster',
                    description: cluster.description,
                    intensity: 0.8,
                    colorHue: cluster.colorHue,
                    size: 1.4,
                });

                // Connection: Core -> Cluster
                connections.push({
                    id: `conn-core-${cluster.id}`,
                    sourceId: centralCore.id,
                    targetId: cluster.id,
                    type: 'parent-child',
                    strength: 0.6,
                    animated: true
                });
            });

            // 3. Layers
            LAYERS.forEach(layer => {
                const cluster = CLUSTERS.find(c => c.id === layer.clusterId);
                const clusterHue = cluster?.colorHue || 0;

                const layerPatterns = output.snapshot.patterns.filter((p: any) => p.layerIds.includes(layer.id));
                const hasData = layerPatterns.length > 0;

                const orbId = `layer-${layer.id}`;
                orbs.push({
                    id: orbId,
                    name: layer.name,
                    type: 'layer',
                    clusterId: layer.clusterId,
                    layerIndex: layer.id,
                    description: hasData ? layerPatterns[0].oneLiner : 'No active patterns detected in this layer yet.',
                    intensity: hasData ? 0.9 : 0.3,
                    colorHue: clusterHue,
                    size: 0.8,
                    metadata: {
                        patterns: layerPatterns,
                        growthEdges: hasData ? layerPatterns[0].growthEdges : []
                    }
                });

                // Connection: Cluster -> Layer
                connections.push({
                    id: `conn-${layer.clusterId}-${orbId}`,
                    sourceId: layer.clusterId,
                    targetId: orbId,
                    type: 'parent-child',
                    strength: 0.4,
                    animated: hasData
                });
            });

            const visualizationData: VisualizationData = {
                users: [{
                    id: output.snapshot.userId,
                    name: 'You',
                    personalityType: 'OSIA Intelligent System',
                    colorTheme: '#38bdf8',
                }],
                centralCore,
                orbs,
                connections,
                synergyNodes: [],
                sharedNodes: [],
                viewMode: 'single',
            };

            set({
                data: visualizationData,
                allOrbs: getAllOrbs(visualizationData),
                isLoading: false
            });
        } catch (err: any) {
            console.error('[OSIA Store] Fetch error:', err);
            // Fall back to placeholder data so the visualization still works
            try {
                const { placeholderData } = await import('../data/placeholderData');
                // Map placeholder format to our expected format
                const mappedData: VisualizationData = {
                    ...placeholderData,
                    centralCore: {
                        ...placeholderData.centralCore,
                        name: (placeholderData.centralCore as any).label || placeholderData.centralCore.name || 'Core',
                    },
                    orbs: placeholderData.orbs.map((orb: any) => ({
                        ...orb,
                        name: orb.label || orb.name || orb.id,
                        type: orb.type === 'sub-trait' ? 'layer' : orb.type === 'trait' ? 'cluster' : orb.type,
                        clusterId: orb.metadata?.parent || undefined,
                    })),
                    synergyNodes: placeholderData.synergyNodes || [],
                    sharedNodes: placeholderData.sharedNodes || [],
                };
                set({
                    data: mappedData,
                    allOrbs: getAllOrbs(mappedData),
                    isLoading: false,
                    error: null,
                });
            } catch {
                set({ error: err.message, isLoading: false });
            }
        }
    },

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
                    cameraPosition: [position[0] - 2.5, position[1], position[2] + 4.5],
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
        if (!viewState.selectedOrbId) {
            if (allOrbs.length > 0) get().selectOrb(allOrbs[0].id);
            return;
        }

        const navigable = allOrbs.filter(o =>
            o.type === 'core' || o.type === 'cluster' || o.type === 'layer'
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
