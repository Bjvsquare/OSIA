
export interface LayerCluster {
    id: string;
    name: string;
    description: string;
    layers: string[]; // trait IDs
}

export const LAYER_CLUSTERS: LayerCluster[] = [
    {
        id: 'core',
        name: 'Core Identity',
        description: 'The foundation of self, emotion, and perception.',
        layers: ['sun', 'moon', 'ascendant']
    },
    {
        id: 'expression',
        name: 'Expression & Social',
        description: 'How you process information, relate to others, and show up in the world.',
        layers: ['mercury', 'venus', 'mc']
    },
    {
        id: 'drive',
        name: 'Drive & Transformation',
        description: 'The engines of action, change, and deep evolutionary purpose.',
        layers: ['mars', 'pluto', 'northnode']
    },
    {
        id: 'growth',
        name: 'Growth & Structure',
        description: 'Expansion, wisdom, and the internal discipline that shapes your path.',
        layers: ['jupiter', 'saturn', 'southnode']
    },
    {
        id: 'subconscious',
        name: 'Subconscious & Depth',
        description: 'Intuition, innovation, and the hidden roots of your inner landscape.',
        layers: ['neptune', 'uranus', 'ic']
    }
];

export function getClusterForLayer(traitId: string): LayerCluster | undefined {
    return LAYER_CLUSTERS.find(c => c.layers.some(l => traitId.toLowerCase().includes(l)));
}
