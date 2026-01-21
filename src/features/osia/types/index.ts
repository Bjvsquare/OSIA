export interface OrbData {
    id: string;
    name: string;
    type: 'core' | 'cluster' | 'layer' | 'synergy' | 'trait' | 'subtrait' | 'sharedVision' | 'complementary' | 'collectiveIntelligence' | 'expression';
    category?: string;
    description: string;
    intensity: number;
    colorHue: number;
    size: number;
    userId?: string;
    parentId?: string | null;
    clusterId?: string;
    layerIndex?: number;
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
    personalityType: string;
    colorTheme: string;
    traits?: OrbData[];
    position?: 'left' | 'right';
}

export interface VisualizationData {
    users: UserData[];
    centralCore: OrbData;
    orbs: OrbData[];
    connections: ConnectionData[];
    synergyNodes: OrbData[];
    sharedNodes: OrbData[];
    viewMode: 'single' | 'pair' | 'team' | 'organization';
}

export interface ViewState {
    mode: 'overview' | 'zoomed';
    selectedOrbId: string | null;
    hoveredOrbId: string | null;
    cameraTarget: [number, number, number];
    cameraPosition: [number, number, number];
    zoomLevel: number;
}

export interface ClusterDefinition {
    id: string;
    name: string;
    description: string;
    colorHue: number;
}

export const CLUSTERS: ClusterDefinition[] = [
    { id: 'cluster-A', name: 'Core Being', description: 'Baseline temperament and inner climate', colorHue: 200 }, // Blue
    { id: 'cluster-B', name: 'Cognitive & Motivational', description: 'How conclusions are reached and what drives effort', colorHue: 280 }, // Purple
    { id: 'cluster-C', name: 'Emotional & Behavioural', description: 'How emotions are processed and work is executed', colorHue: 340 }, // Pink/Red
    { id: 'cluster-D', name: 'Relational & Social', description: 'How connection and influence are managed', colorHue: 40 }, // Orange/Gold
    { id: 'cluster-E', name: 'Trajectory & Development', description: 'Identity coherence and long-term growth', colorHue: 160 }, // Teal/Green
];

export const LAYERS = [
    { id: 1, name: 'Core Disposition', clusterId: 'cluster-A' },
    { id: 2, name: 'Energy Orientation', clusterId: 'cluster-A' },
    { id: 3, name: 'Perception & Info Processing', clusterId: 'cluster-A' },
    { id: 4, name: 'Decision Logic', clusterId: 'cluster-B' },
    { id: 5, name: 'Motivational Drivers', clusterId: 'cluster-B' },
    { id: 6, name: 'Stress & Pressure Patterns', clusterId: 'cluster-B' },
    { id: 7, name: 'Emotional Reg & Expression', clusterId: 'cluster-C' },
    { id: 8, name: 'Behavioural Rhythm', clusterId: 'cluster-C' },
    { id: 9, name: 'Communication Mode', clusterId: 'cluster-C' },
    { id: 10, name: 'Relational Energy', clusterId: 'cluster-D' },
    { id: 11, name: 'Relational Patterning', clusterId: 'cluster-D' },
    { id: 12, name: 'Social Role & Influence', clusterId: 'cluster-D' },
    { id: 13, name: 'Identity & Maturity', clusterId: 'cluster-E' },
    { id: 14, name: 'Growth Arc', clusterId: 'cluster-E' },
    { id: 15, name: 'Life Navigation', clusterId: 'cluster-E' },
];
