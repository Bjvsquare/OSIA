import type { VisualizationData } from '../types';

/*
 * Pair View layout:
 *   1 Central Core
 *   3 Trait orbs for User A (left)  → each has 3 sub-traits
 *   3 Trait orbs for User B (right) → each has 3 sub-traits  (total 6 not 5 for pair)
 *
 * But per the user's request:
 *   1 center, 5 around the centre, 3 connected to each of the 5
 *   Total: 1 + 5 + 15 = 21 orbs
 *
 * For pair view: we do 5 main trait orbs (some shared) + 3 sub-traits each.
 */

export const placeholderData: VisualizationData = {
    viewMode: 'pair',
    users: [
        {
            id: 'user-a',
            name: 'User A',
            type: 'Analytical & Introverted',
            colorTheme: '#4A9EFF',
            avatarUrl: '',
        },
        {
            id: 'user-b',
            name: 'User B',
            type: 'Creative & Extroverted',
            colorTheme: '#FF8C42',
            avatarUrl: '',
        },
    ],

    centralCore: {
        id: 'core',
        label: 'Pair Synergy',
        type: 'synergy',
        category: 'core',
        intensity: 1.0,
        size: 2.5,
        colorHue: 30,
        description: 'The combined energy of both users, reflecting shared strengths and complementary dynamics.',
        subTraits: [],
        metadata: {},
    },

    // 5 trait orbs around the center
    orbs: [
        // ─── Trait 1: Cognitive Style (User A leaning) ───
        {
            id: 'trait-1',
            label: 'Cognitive Style',
            type: 'trait',
            category: 'cognitive',
            intensity: 0.85,
            size: 1.4,
            colorHue: 210,
            description: 'How information is processed and decisions are made.',
            subTraits: ['Analytical Thinking', 'Pattern Recognition', 'Logical Flow'],
            metadata: { owner: 'user-a' },
        },
        // ─── Trait 2: Communication (User B leaning) ───
        {
            id: 'trait-2',
            label: 'Communication',
            type: 'trait',
            category: 'social',
            intensity: 0.78,
            size: 1.3,
            colorHue: 25,
            description: 'Expression patterns and interpersonal connection.',
            subTraits: ['Active Listening', 'Storytelling', 'Empathic Response'],
            metadata: { owner: 'user-b' },
        },
        // ─── Trait 3: Drive & Motivation (Shared) ───
        {
            id: 'trait-3',
            label: 'Drive & Motivation',
            type: 'synergy',
            category: 'motivation',
            intensity: 0.92,
            size: 1.5,
            colorHue: 45,
            description: 'Shared reservoir of purpose and momentum.',
            subTraits: ['Goal Setting', 'Resilience', 'Intrinsic Curiosity'],
            metadata: {},
        },
        // ─── Trait 4: Emotional Intelligence (User A leaning) ───
        {
            id: 'trait-4',
            label: 'Emotional Intelligence',
            type: 'trait',
            category: 'emotional',
            intensity: 0.72,
            size: 1.2,
            colorHue: 180,
            description: 'Self-awareness and regulation of emotional states.',
            subTraits: ['Self-Awareness', 'Empathy', 'Emotional Regulation'],
            metadata: { owner: 'user-a' },
        },
        // ─── Trait 5: Creativity (User B leaning) ───
        {
            id: 'trait-5',
            label: 'Creativity',
            type: 'trait',
            category: 'creative',
            intensity: 0.88,
            size: 1.35,
            colorHue: 320,
            description: 'Ability to generate novel ideas and see unconventional connections.',
            subTraits: ['Divergent Thinking', 'Improvisation', 'Visual Imagination'],
            metadata: { owner: 'user-b' },
        },

        // ─── Sub-traits: 3 per trait ───
        // Trait 1 subs
        { id: 'sub-1-1', label: 'Analytical Thinking', type: 'sub-trait', category: 'cognitive', intensity: 0.80, size: 0.6, colorHue: 210, description: 'Breaking down complex problems into components.', subTraits: [], metadata: { parent: 'trait-1' } },
        { id: 'sub-1-2', label: 'Pattern Recognition', type: 'sub-trait', category: 'cognitive', intensity: 0.75, size: 0.55, colorHue: 200, description: 'Identifying recurring structures and trends.', subTraits: [], metadata: { parent: 'trait-1' } },
        { id: 'sub-1-3', label: 'Logical Flow', type: 'sub-trait', category: 'cognitive', intensity: 0.70, size: 0.5, colorHue: 220, description: 'Sequential reasoning and cause-effect tracking.', subTraits: [], metadata: { parent: 'trait-1' } },
        // Trait 2 subs
        { id: 'sub-2-1', label: 'Active Listening', type: 'sub-trait', category: 'social', intensity: 0.72, size: 0.55, colorHue: 30, description: 'Fully engaged attention during conversation.', subTraits: [], metadata: { parent: 'trait-2' } },
        { id: 'sub-2-2', label: 'Storytelling', type: 'sub-trait', category: 'social', intensity: 0.82, size: 0.6, colorHue: 20, description: 'Crafting compelling narratives to convey ideas.', subTraits: [], metadata: { parent: 'trait-2' } },
        { id: 'sub-2-3', label: 'Empathic Response', type: 'sub-trait', category: 'social', intensity: 0.68, size: 0.5, colorHue: 35, description: 'Emotional attunement in interactions.', subTraits: [], metadata: { parent: 'trait-2' } },
        // Trait 3 subs
        { id: 'sub-3-1', label: 'Goal Setting', type: 'sub-trait', category: 'motivation', intensity: 0.88, size: 0.6, colorHue: 50, description: 'Defining clear objectives and milestones.', subTraits: [], metadata: { parent: 'trait-3' } },
        { id: 'sub-3-2', label: 'Resilience', type: 'sub-trait', category: 'motivation', intensity: 0.85, size: 0.55, colorHue: 40, description: 'Bouncing back from setbacks with renewed vigor.', subTraits: [], metadata: { parent: 'trait-3' } },
        { id: 'sub-3-3', label: 'Intrinsic Curiosity', type: 'sub-trait', category: 'motivation', intensity: 0.90, size: 0.6, colorHue: 55, description: 'Natural drive to explore and understand.', subTraits: [], metadata: { parent: 'trait-3' } },
        // Trait 4 subs
        { id: 'sub-4-1', label: 'Self-Awareness', type: 'sub-trait', category: 'emotional', intensity: 0.70, size: 0.55, colorHue: 175, description: 'Recognizing own emotional states and triggers.', subTraits: [], metadata: { parent: 'trait-4' } },
        { id: 'sub-4-2', label: 'Empathy', type: 'sub-trait', category: 'emotional', intensity: 0.76, size: 0.55, colorHue: 185, description: 'Understanding and sharing the feelings of others.', subTraits: [], metadata: { parent: 'trait-4' } },
        { id: 'sub-4-3', label: 'Emotional Regulation', type: 'sub-trait', category: 'emotional', intensity: 0.65, size: 0.5, colorHue: 190, description: 'Managing emotional responses effectively.', subTraits: [], metadata: { parent: 'trait-4' } },
        // Trait 5 subs
        { id: 'sub-5-1', label: 'Divergent Thinking', type: 'sub-trait', category: 'creative', intensity: 0.85, size: 0.6, colorHue: 315, description: 'Generating multiple solutions from a single prompt.', subTraits: [], metadata: { parent: 'trait-5' } },
        { id: 'sub-5-2', label: 'Improvisation', type: 'sub-trait', category: 'creative', intensity: 0.78, size: 0.55, colorHue: 325, description: 'Creating spontaneously in the moment.', subTraits: [], metadata: { parent: 'trait-5' } },
        { id: 'sub-5-3', label: 'Visual Imagination', type: 'sub-trait', category: 'creative', intensity: 0.82, size: 0.55, colorHue: 310, description: 'Mental visualization and spatial reasoning.', subTraits: [], metadata: { parent: 'trait-5' } },
    ],

    connections: [
        // Core → 5 traits
        { id: 'c-core-1', sourceId: 'core', targetId: 'trait-1', type: 'parent-child', strength: 0.9, animated: true },
        { id: 'c-core-2', sourceId: 'core', targetId: 'trait-2', type: 'parent-child', strength: 0.85, animated: true },
        { id: 'c-core-3', sourceId: 'core', targetId: 'trait-3', type: 'parent-child', strength: 0.95, animated: true },
        { id: 'c-core-4', sourceId: 'core', targetId: 'trait-4', type: 'parent-child', strength: 0.8, animated: true },
        { id: 'c-core-5', sourceId: 'core', targetId: 'trait-5', type: 'parent-child', strength: 0.88, animated: true },
        // Trait 1 → 3 subs
        { id: 'c-1-s1', sourceId: 'trait-1', targetId: 'sub-1-1', type: 'parent-child', strength: 0.8, animated: false },
        { id: 'c-1-s2', sourceId: 'trait-1', targetId: 'sub-1-2', type: 'parent-child', strength: 0.75, animated: false },
        { id: 'c-1-s3', sourceId: 'trait-1', targetId: 'sub-1-3', type: 'parent-child', strength: 0.7, animated: false },
        // Trait 2 → 3 subs
        { id: 'c-2-s1', sourceId: 'trait-2', targetId: 'sub-2-1', type: 'parent-child', strength: 0.7, animated: false },
        { id: 'c-2-s2', sourceId: 'trait-2', targetId: 'sub-2-2', type: 'parent-child', strength: 0.82, animated: false },
        { id: 'c-2-s3', sourceId: 'trait-2', targetId: 'sub-2-3', type: 'parent-child', strength: 0.68, animated: false },
        // Trait 3 → 3 subs
        { id: 'c-3-s1', sourceId: 'trait-3', targetId: 'sub-3-1', type: 'parent-child', strength: 0.88, animated: false },
        { id: 'c-3-s2', sourceId: 'trait-3', targetId: 'sub-3-2', type: 'parent-child', strength: 0.85, animated: false },
        { id: 'c-3-s3', sourceId: 'trait-3', targetId: 'sub-3-3', type: 'parent-child', strength: 0.9, animated: false },
        // Trait 4 → 3 subs
        { id: 'c-4-s1', sourceId: 'trait-4', targetId: 'sub-4-1', type: 'parent-child', strength: 0.7, animated: false },
        { id: 'c-4-s2', sourceId: 'trait-4', targetId: 'sub-4-2', type: 'parent-child', strength: 0.76, animated: false },
        { id: 'c-4-s3', sourceId: 'trait-4', targetId: 'sub-4-3', type: 'parent-child', strength: 0.65, animated: false },
        // Trait 5 → 3 subs
        { id: 'c-5-s1', sourceId: 'trait-5', targetId: 'sub-5-1', type: 'parent-child', strength: 0.85, animated: false },
        { id: 'c-5-s2', sourceId: 'trait-5', targetId: 'sub-5-2', type: 'parent-child', strength: 0.78, animated: false },
        { id: 'c-5-s3', sourceId: 'trait-5', targetId: 'sub-5-3', type: 'parent-child', strength: 0.82, animated: false },
    ],

    synergies: [],
};
