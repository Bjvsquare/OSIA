/* ─── OSIA Visualization Types ─── */

export interface OrbData {
    id: string;
    label: string;
    type: 'core' | 'synergy' | 'trait' | 'sub-trait' | 'sharedVision' | 'complementary' | 'collectiveIntelligence' | 'expression';
    category?: string;
    description: string;
    intensity: number;
    colorHue: number;
    size: number;
    userId?: string;
    parentId?: string | null;
    layer?: number;
    subTraits?: string[];
    metadata?: Record<string, any>;
}

export interface ConnectionData {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'parent-child' | 'synergy' | 'complement' | 'shared-vision';
    strength: number;
    animated: boolean;
    color?: string;
}

export interface UserData {
    id: string;
    name: string;
    type: string;
    colorTheme: string;
    avatarUrl?: string;
    personalityType?: string;
    traits?: OrbData[];
    position?: 'left' | 'right';
}

export interface VisualizationData {
    users: UserData[];
    centralCore: OrbData;
    orbs: OrbData[];
    connections: ConnectionData[];
    synergies: OrbData[];
    synergyNodes?: OrbData[];
    sharedNodes?: OrbData[];
    viewMode: 'single' | 'pair' | 'team' | 'organization';
}

export interface ViewState {
    mode: 'overview' | 'zoomed' | 'transitioning';
    selectedOrbId: string | null;
    hoveredOrbId: string | null;
    cameraTarget: [number, number, number];
    cameraPosition: [number, number, number];
    zoomLevel: number;
}
