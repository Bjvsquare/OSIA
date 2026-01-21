/**
 * OSIA Claim Engine — v1.0
 * 
 * Transforms raw signals (user inputs, questionnaire responses) into atomic Claims.
 * Claims are the foundation of all OSIA intelligence outputs.
 * 
 * This engine:
 * 1. Receives signals from onboarding/check-ins
 * 2. Generates claims per layer based on signal interpretation
 * 3. Never generates freeform text - only structured claims
 */

import { randomUUID } from 'crypto';
import {
    Claim,
    ClaimPolarity,
    ClaimConfidence,
    LAYER_DEFINITIONS
} from '../types/osia-types';

// ============================================================================
// SIGNAL TYPES: What the claim engine receives as input
// ============================================================================

export interface Signal {
    signalId: string;
    userId: string;
    questionId: string;
    layerIds: number[];          // Which layers this signal maps to
    rawValue: string | string[] | number | boolean;
    normalizedValue?: string;    // Cleaned/normalized version
    timestamp: string;
    source: 'onboarding' | 'checkin' | 'deepening' | 'relational' | 'refinement';
}

// ============================================================================
// CLAIM GENERATION RULES: How signals become claims
// ============================================================================

/**
 * Mapping from question patterns to claim generation logic
 */
interface ClaimGenerationRule {
    questionPattern: RegExp | string;  // Matches questionId or prompt
    layerIds: number[];
    polarityLogic: (value: unknown) => ClaimPolarity;
    claimTemplate: (value: unknown, context: ClaimContext) => string;
    confidenceDefault: ClaimConfidence;
}

interface ClaimContext {
    userId: string;
    signalId: string;
    layerId: number;
}

/**
 * Core claim generation rules - maps signal patterns to claim outputs
 */
const CLAIM_GENERATION_RULES: ClaimGenerationRule[] = [
    // Layer 1: Core Disposition claims
    {
        questionPattern: /lex\.self_best/,
        layerIds: [1, 2],
        polarityLogic: () => 'strength',
        claimTemplate: (value, ctx) => {
            const words = Array.isArray(value) ? value : String(value).split(/[,\s]+/);
            const topWords = words.slice(0, 3).join(', ');
            return `At your best, you describe yourself as ${topWords}. This suggests a baseline disposition toward ${inferDisposition(words)}.`;
        },
        confidenceDefault: 'emerging'
    },

    // Layer 6: Stress patterns claims
    {
        questionPattern: /lex\.self_stress/,
        layerIds: [6, 7],
        polarityLogic: () => 'neutral',
        claimTemplate: (value, ctx) => {
            const words = Array.isArray(value) ? value : String(value).split(/[,\s]+/);
            const stressPattern = inferStressPattern(words);
            return `Under pressure, you tend toward ${stressPattern}. This pattern often shows up when stakes feel high.`;
        },
        confidenceDefault: 'emerging'
    },

    // Layer 2: Energy recovery
    {
        questionPattern: /recovery\.methods/,
        layerIds: [2],
        polarityLogic: () => 'strength',
        claimTemplate: (value, ctx) => {
            const methods = Array.isArray(value) ? value : [String(value)];
            return `You restore energy most reliably through ${methods.join(' and ')}. This is a key pattern in how you sustain yourself.`;
        },
        confidenceDefault: 'moderate'
    },

    // Layer 3-4: Processing complexity
    {
        questionPattern: /processing\.complexity_response/,
        layerIds: [3, 4],
        polarityLogic: () => 'neutral',
        claimTemplate: (value, ctx) => {
            const methods = Array.isArray(value) ? value : [String(value)];
            const style = methods[0]?.toLowerCase() || 'gather & integrate';
            return `When facing complexity, you tend to ${style}. This shapes how you approach decisions and uncertainty.`;
        },
        confidenceDefault: 'moderate'
    },

    // Layer 6-8: Stress default move
    {
        questionPattern: /stress\.default_move/,
        layerIds: [6, 8],
        polarityLogic: (value) => {
            const move = String(value).toLowerCase();
            if (['over-function', 'push harder', 'control details'].includes(move)) return 'friction';
            if (['shut down', 'withdraw', 'people-please'].includes(move)) return 'friction';
            return 'neutral';
        },
        claimTemplate: (value, ctx) => {
            const move = String(value);
            return `Under pressure, your default move is to ${move.toLowerCase()}. This pattern often emerges before conscious choice.`;
        },
        confidenceDefault: 'moderate'
    },

    // Layer 10: Relational boundaries
    {
        questionPattern: /rel\.boundary_style/,
        layerIds: [10],
        polarityLogic: (value) => {
            const style = String(value).toLowerCase();
            if (style === 'too porous' || style === 'too rigid') return 'friction';
            if (style === 'clear') return 'strength';
            return 'neutral';
        },
        claimTemplate: (value, ctx) => {
            const style = String(value);
            if (style === 'Clear') {
                return 'You tend to maintain clear boundaries in relationships. This creates definition in how you connect.';
            } else if (style === 'Too porous') {
                return 'Your boundaries can become porous, especially under emotional pressure. This may lead to over-merging or difficulty protecting your space.';
            } else if (style === 'Too rigid') {
                return 'Your boundaries tend toward rigidity. While this creates safety, it may also limit connection or flexibility.';
            }
            return `Your boundary style is context-dependent, shifting based on relationship and situation.`;
        },
        confidenceDefault: 'moderate'
    },

    // Layer 12-8: Collaboration role
    {
        questionPattern: /rel\.collaboration_role/,
        layerIds: [12, 8],
        polarityLogic: () => 'neutral',
        claimTemplate: (value, ctx) => {
            const role = String(value);
            if (role === 'Initiator') {
                return 'In collaboration, you typically take the initiator role — starting conversations, proposing directions, and moving things forward.';
            } else if (role === 'Responder') {
                return 'In collaboration, you typically take the responder role — reacting to proposals, refining ideas, and supporting momentum others create.';
            }
            return 'Your collaboration style is context-dependent, shifting between initiating and responding based on the situation.';
        },
        confidenceDefault: 'moderate'
    },

    // Layer 15: Current edge
    {
        questionPattern: /edge\.current_text/,
        layerIds: [15],
        polarityLogic: () => 'neutral',
        claimTemplate: (value, ctx) => {
            const text = String(value).slice(0, 100);
            return `Right now, your growth edge involves: "${text}${String(value).length > 100 ? '...' : ''}". This is where development pressure currently sits.`;
        },
        confidenceDefault: 'emerging'
    },

    // Layer 5-13: What to protect
    {
        questionPattern: /motivation\.protect_text/,
        layerIds: [5, 13],
        polarityLogic: () => 'strength',
        claimTemplate: (value, ctx) => {
            const text = String(value).slice(0, 80);
            return `What you most want to protect: "${text}". This reveals a core motivational anchor.`;
        },
        confidenceDefault: 'moderate'
    },

    // ===========================================================================
    // TRAIT-BASED CLAIMS: For regeneration from stored blueprint traits
    // ===========================================================================

    // Generic trait handler - matches all TRAIT.L* patterns
    {
        questionPattern: /^TRAIT\.L\d+/,
        layerIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        polarityLogic: (value) => {
            const text = String(value).toLowerCase();
            // Look for strength/positive indicators
            if (text.includes('strength') || text.includes('steady') || text.includes('reliable') ||
                text.includes('clear') || text.includes('grounded') || text.includes('balanced')) {
                return 'strength';
            }
            // Look for friction/challenge indicators
            if (text.includes('challenge') || text.includes('pressure') || text.includes('difficult') ||
                text.includes('struggle') || text.includes('tension')) {
                return 'friction';
            }
            return 'neutral';
        },
        claimTemplate: (value, ctx) => {
            // The trait description is the claim text - just clean it up
            const description = String(value);
            // Split into sentences and take the most meaningful part
            const sentences = description.split(/\.\s+/).filter(s => s.length > 20);
            if (sentences.length >= 2) {
                // Return first two substantial sentences
                return sentences.slice(0, 2).join('. ') + '.';
            }
            return description;
        },
        confidenceDefault: 'developed'
    }
];


// ============================================================================
// HELPER FUNCTIONS: Inference logic for claim text
// ============================================================================

function inferDisposition(words: string[]): string {
    const lowercased = words.map(w => w.toLowerCase());

    // Check for common patterns
    if (lowercased.some(w => ['calm', 'steady', 'stable', 'grounded', 'composed'].includes(w))) {
        return 'stability and groundedness';
    }
    if (lowercased.some(w => ['creative', 'curious', 'innovative', 'imaginative'].includes(w))) {
        return 'creativity and exploration';
    }
    if (lowercased.some(w => ['analytical', 'logical', 'precise', 'thorough', 'structured'].includes(w))) {
        return 'precision and structured thinking';
    }
    if (lowercased.some(w => ['caring', 'empathetic', 'supportive', 'kind', 'warm'].includes(w))) {
        return 'warmth and connection';
    }
    if (lowercased.some(w => ['driven', 'ambitious', 'focused', 'determined'].includes(w))) {
        return 'drive and focus';
    }

    return 'qualities you recognize as central to who you are';
}

function inferStressPattern(words: string[]): string {
    const lowercased = words.map(w => w.toLowerCase());

    if (lowercased.some(w => ['anxious', 'worried', 'overthinking', 'scattered'].includes(w))) {
        return 'heightened mental activity and overthinking';
    }
    if (lowercased.some(w => ['withdrawn', 'quiet', 'distant', 'closed'].includes(w))) {
        return 'withdrawal and containment';
    }
    if (lowercased.some(w => ['irritable', 'snappy', 'impatient', 'reactive'].includes(w))) {
        return 'reactivity and sharpness';
    }
    if (lowercased.some(w => ['controlling', 'rigid', 'demanding'].includes(w))) {
        return 'increased control and rigidity';
    }
    if (lowercased.some(w => ['tired', 'exhausted', 'depleted', 'flat'].includes(w))) {
        return 'energy depletion and fatigue';
    }

    return 'a shift in your usual patterns';
}

// ============================================================================
// CLAIM ENGINE CLASS
// ============================================================================

class ClaimEngine {
    /**
     * Generate claims from a single signal
     */
    generateClaimsFromSignal(signal: Signal): Claim[] {
        const claims: Claim[] = [];

        // Find matching rules
        for (const rule of CLAIM_GENERATION_RULES) {
            const pattern = rule.questionPattern;
            const matches = typeof pattern === 'string'
                ? signal.questionId.includes(pattern)
                : pattern.test(signal.questionId);

            if (!matches) continue;

            // Generate claim for each relevant layer
            for (const layerId of rule.layerIds) {
                if (!signal.layerIds.includes(layerId)) continue;

                const context: ClaimContext = {
                    userId: signal.userId,
                    signalId: signal.signalId,
                    layerId
                };

                const claim: Claim = {
                    claimId: `CLM.L${layerId}.${randomUUID().slice(0, 8)}`,
                    layerId,
                    text: rule.claimTemplate(signal.rawValue, context),
                    polarity: rule.polarityLogic(signal.rawValue),
                    confidence: rule.confidenceDefault,
                    evidenceRefs: Object.freeze([signal.signalId]),
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    userId: signal.userId
                };

                claims.push(claim);
            }
        }

        return claims;
    }

    /**
     * Generate claims from multiple signals (e.g., full onboarding)
     */
    generateClaimsFromSignals(signals: Signal[]): Claim[] {
        const allClaims: Claim[] = [];

        for (const signal of signals) {
            const claims = this.generateClaimsFromSignal(signal);
            allClaims.push(...claims);
        }

        return allClaims;
    }

    /**
     * Get all claims for a specific layer
     */
    filterClaimsByLayer(claims: Claim[], layerId: number): Claim[] {
        return claims.filter(c => c.layerId === layerId);
    }

    /**
     * Get claims by polarity
     */
    filterClaimsByPolarity(claims: Claim[], polarity: ClaimPolarity): Claim[] {
        return claims.filter(c => c.polarity === polarity);
    }

    /**
     * Get the layer definition for a layer ID
     */
    getLayerDefinition(layerId: number) {
        return LAYER_DEFINITIONS.find(l => l.layerId === layerId);
    }

    /**
     * Count claims per layer (useful for coverage analysis)
     */
    getLayerCoverage(claims: Claim[]): Map<number, number> {
        const coverage = new Map<number, number>();

        for (const claim of claims) {
            const current = coverage.get(claim.layerId) || 0;
            coverage.set(claim.layerId, current + 1);
        }

        return coverage;
    }
}

export const claimEngine = new ClaimEngine();
