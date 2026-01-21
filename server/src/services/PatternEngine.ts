/**
 * OSIA Pattern Engine — v1.0
 * 
 * Promotes clusters of related Claims into named Patterns.
 * Patterns represent recurring dynamics that appear across multiple claims.
 * 
 * A Pattern is promoted when:
 * 1. Multiple claims from related layers support it
 * 2. The claims have sufficient confidence
 * 3. There's evidence of stability (repeated signals)
 */

import { randomUUID } from 'crypto';
import {
    Claim,
    Pattern,
    PatternCategory,
    PatternStability,
    ClaimConfidence,
    LAYER_DEFINITIONS
} from '../types/osia-types';

// ============================================================================
// PATTERN DEFINITIONS: Named patterns that can be detected
// ============================================================================

interface PatternDefinition {
    patternId: string;
    category: PatternCategory;
    name: string;
    oneLiner: string;
    eligibleLayers: number[];
    claimKeywords: string[];        // Keywords to match in claim text
    minSupportingClaims: number;    // How many claims needed to promote
    growthEdges: string[];
}

/**
 * Pattern library - each pattern can be "detected" from supporting claims
 */
const PATTERN_DEFINITIONS: PatternDefinition[] = [
    // Individual Patterns - Layer Cluster A (Core Architecture)
    {
        patternId: 'PAT.IND.STABILITY_ANCHOR',
        category: 'individual',
        name: 'Stability Anchor',
        oneLiner: 'You naturally create groundedness for yourself and others',
        eligibleLayers: [1, 2],
        claimKeywords: ['stable', 'steady', 'grounded', 'calm', 'composed'],
        minSupportingClaims: 2,
        growthEdges: ['Notice when stability becomes rigidity', 'Explore safe instability']
    },
    {
        patternId: 'PAT.IND.EXPLORER_MIND',
        category: 'individual',
        name: 'Explorer Mind',
        oneLiner: 'You seek novelty and possibility before settling on a path',
        eligibleLayers: [1, 3, 14],
        claimKeywords: ['creative', 'curious', 'explore', 'imaginative', 'novelty'],
        minSupportingClaims: 2,
        growthEdges: ['Ground exploration with commitment windows', 'Notice when exploration avoids completion']
    },
    {
        patternId: 'PAT.IND.STRUCTURED_PROCESSOR',
        category: 'individual',
        name: 'Structured Processor',
        oneLiner: 'You organize information systematically before acting',
        eligibleLayers: [3, 4, 8],
        claimKeywords: ['analytical', 'logical', 'structured', 'precise', 'systematic', 'gather', 'map'],
        minSupportingClaims: 2,
        growthEdges: ['Trust incomplete data sometimes', 'Balance structure with spontaneous action']
    },
    {
        patternId: 'PAT.IND.RELATIONAL_WARMTH',
        category: 'individual',
        name: 'Relational Warmth',
        oneLiner: 'Connection and care are central to how you operate',
        eligibleLayers: [1, 10, 11],
        claimKeywords: ['caring', 'empathetic', 'supportive', 'warm', 'connection'],
        minSupportingClaims: 2,
        growthEdges: ['Protect capacity to give', 'Notice when warmth depletes you']
    },

    // Individual Patterns - Layer Cluster B (Processing & Stress)
    {
        patternId: 'PAT.IND.DRIVE_MAXIMIZER',
        category: 'individual',
        name: 'Drive Maximizer',
        oneLiner: 'You push toward goals with sustained intensity',
        eligibleLayers: [5, 8],
        claimKeywords: ['driven', 'ambitious', 'focused', 'determined', 'push'],
        minSupportingClaims: 2,
        growthEdges: ['Build recovery into achievement cycles', 'Separate self-worth from output']
    },
    {
        patternId: 'PAT.IND.PRESSURE_CONTROLLER',
        category: 'individual',
        name: 'Pressure Controller',
        oneLiner: 'Under stress, you instinctively reach for structure and control',
        eligibleLayers: [6, 8],
        claimKeywords: ['control', 'over-function', 'push harder', 'details', 'rigid'],
        minSupportingClaims: 2,
        growthEdges: ['Practice deliberate release', 'Recognize control as anxiety signal']
    },
    {
        patternId: 'PAT.IND.PRESSURE_WITHDRAWAL',
        category: 'individual',
        name: 'Pressure Withdrawal',
        oneLiner: 'Under stress, you naturally withdraw to protect capacity',
        eligibleLayers: [6, 7, 10],
        claimKeywords: ['withdraw', 'shut down', 'distant', 'quiet', 'retreat'],
        minSupportingClaims: 2,
        growthEdges: ['Signal withdrawal intent to others', 'Build re-emergence rituals']
    },
    {
        patternId: 'PAT.IND.SOLITUDE_RECHARGER',
        category: 'individual',
        name: 'Solitude Recharger',
        oneLiner: 'You recover energy primarily through time alone',
        eligibleLayers: [2],
        claimKeywords: ['solitude', 'alone', 'quiet', 'space'],
        minSupportingClaims: 1,
        growthEdges: ['Protect solitude proactively', 'Communicate recovery needs']
    },
    {
        patternId: 'PAT.IND.PEOPLE_ENERGIZER',
        category: 'individual',
        name: 'People Energizer',
        oneLiner: 'You gain energy through interaction and connection',
        eligibleLayers: [2],
        claimKeywords: ['people', 'connection', 'social', 'talk'],
        minSupportingClaims: 1,
        growthEdges: ['Balance output with solo recovery', 'Notice quality vs quantity of contact']
    },

    // Individual Patterns - Layer Cluster C-D (Relational)
    {
        patternId: 'PAT.IND.BOUNDARY_CLARITY',
        category: 'individual',
        name: 'Boundary Clarity',
        oneLiner: 'You maintain clear definition between yourself and others',
        eligibleLayers: [10],
        claimKeywords: ['clear boundaries', 'definition', 'protect'],
        minSupportingClaims: 1,
        growthEdges: ['Allow appropriate permeability', 'Notice when clarity feels cold']
    },
    {
        patternId: 'PAT.IND.BOUNDARY_POROSITY',
        category: 'individual',
        name: 'Boundary Porosity',
        oneLiner: 'You absorb others\' states more readily than you realize',
        eligibleLayers: [10],
        claimKeywords: ['porous', 'over-merging', 'absorb'],
        minSupportingClaims: 1,
        growthEdges: ['Practice distinguishing self from other', 'Create energetic reset rituals']
    },
    {
        patternId: 'PAT.IND.INITIATOR_STANCE',
        category: 'individual',
        name: 'Initiator Stance',
        oneLiner: 'You naturally start conversations, propose directions, move things forward',
        eligibleLayers: [8, 12],
        claimKeywords: ['initiator', 'start', 'propose', 'forward'],
        minSupportingClaims: 1,
        growthEdges: ['Create space for others to lead', 'Notice initiating as control pattern']
    },
    {
        patternId: 'PAT.IND.RESPONDER_STANCE',
        category: 'individual',
        name: 'Responder Stance',
        oneLiner: 'You prefer to react, refine, and support rather than initiate',
        eligibleLayers: [8, 12],
        claimKeywords: ['responder', 'react', 'refine', 'support'],
        minSupportingClaims: 1,
        growthEdges: ['Practice initiating in safe contexts', 'Own ideas before they\'re polished']
    },

    // Individual Patterns - Layer Cluster E (Edge & Growth)
    {
        patternId: 'PAT.IND.GROWTH_EDGE_ACTIVE',
        category: 'individual',
        name: 'Active Growth Edge',
        oneLiner: 'You have a live development frontier you\'re aware of',
        eligibleLayers: [14, 15],
        claimKeywords: ['growth edge', 'development', 'tension', 'decision'],
        minSupportingClaims: 1,
        growthEdges: ['Pace the edge work', 'Celebrate incremental shifts']
    }
];

// ============================================================================
// PATTERN ENGINE CLASS
// ============================================================================

class PatternEngine {
    /**
     * Detect which patterns a set of claims support
     */
    detectPatterns(claims: Claim[], userId: string): Pattern[] {
        const detectedPatterns: Pattern[] = [];

        for (const definition of PATTERN_DEFINITIONS) {
            const supportingClaims = this.findSupportingClaims(claims, definition);

            if (supportingClaims.length >= definition.minSupportingClaims) {
                const pattern = this.promoteToPattern(definition, supportingClaims, userId);
                detectedPatterns.push(pattern);
            }
        }

        return detectedPatterns;
    }

    /**
     * Find claims that support a pattern definition
     */
    private findSupportingClaims(claims: Claim[], definition: PatternDefinition): Claim[] {
        return claims.filter(claim => {
            // Must be from eligible layer
            if (!definition.eligibleLayers.includes(claim.layerId)) {
                return false;
            }

            // Must contain at least one keyword
            const claimTextLower = claim.text.toLowerCase();
            return definition.claimKeywords.some(keyword =>
                claimTextLower.includes(keyword.toLowerCase())
            );
        });
    }

    /**
     * Promote a pattern definition to a full Pattern object
     */
    private promoteToPattern(
        definition: PatternDefinition,
        supportingClaims: Claim[],
        userId: string
    ): Pattern {
        // Calculate confidence from supporting claims
        const avgConfidence = this.calculateAggregateConfidence(supportingClaims);

        // Calculate stability index (0-1 based on claim count and spread)
        const stabilityIndex = this.calculateStabilityIndex(supportingClaims, definition);

        return {
            patternId: definition.patternId,
            category: definition.category,
            layerIds: Object.freeze([...new Set(supportingClaims.map(c => c.layerId))]) as readonly number[],
            name: definition.name,
            oneLiner: definition.oneLiner,
            supportingClaimIds: Object.freeze(supportingClaims.map(c => c.claimId)),
            growthEdges: Object.freeze([...definition.growthEdges]),
            confidence: avgConfidence,
            stabilityIndex,
            createdAt: new Date().toISOString(),
            userId
        };
    }

    /**
     * Calculate aggregate confidence from multiple claims
     */
    private calculateAggregateConfidence(claims: Claim[]): ClaimConfidence {
        const confidenceValues: Record<ClaimConfidence, number> = {
            'emerging': 1,
            'moderate': 2,
            'developed': 3,
            'integrated': 4
        };

        const total = claims.reduce((sum, c) => sum + confidenceValues[c.confidence], 0);
        const avg = total / claims.length;

        if (avg >= 3.5) return 'integrated';
        if (avg >= 2.5) return 'developed';
        if (avg >= 1.5) return 'moderate';
        return 'emerging';
    }

    /**
     * Calculate stability index (0-1) based on evidence strength
     */
    private calculateStabilityIndex(claims: Claim[], definition: PatternDefinition): number {
        // Factors:
        // 1. Claim count relative to minimum (more claims = more stable)
        // 2. Layer spread (patterns across more layers = more integrated)
        // 3. Average confidence

        const claimCountFactor = Math.min(claims.length / (definition.minSupportingClaims * 2), 1);

        const uniqueLayers = new Set(claims.map(c => c.layerId)).size;
        const maxLayers = definition.eligibleLayers.length;
        const layerSpreadFactor = uniqueLayers / maxLayers;

        const confidenceValues: Record<ClaimConfidence, number> = {
            'emerging': 0.25,
            'moderate': 0.5,
            'developed': 0.75,
            'integrated': 1
        };
        const avgConfidenceFactor = claims.reduce((sum, c) => sum + confidenceValues[c.confidence], 0) / claims.length;

        // Weighted combination
        const stability = (claimCountFactor * 0.3) + (layerSpreadFactor * 0.3) + (avgConfidenceFactor * 0.4);

        return Math.round(stability * 100) / 100;  // Round to 2 decimal places
    }

    /**
     * Get patterns grouped by category
     */
    groupPatternsByCategory(patterns: Pattern[]): Map<PatternCategory, Pattern[]> {
        const grouped = new Map<PatternCategory, Pattern[]>();

        for (const pattern of patterns) {
            const existing = grouped.get(pattern.category) || [];
            existing.push(pattern);
            grouped.set(pattern.category, existing);
        }

        return grouped;
    }

    /**
     * Get the most stable patterns (highest stability index)
     */
    getMostStablePatterns(patterns: Pattern[], limit: number = 5): Pattern[] {
        return [...patterns]
            .sort((a, b) => b.stabilityIndex - a.stabilityIndex)
            .slice(0, limit);
    }

    /**
     * Get pattern by ID
     */
    getPatternDefinition(patternId: string): PatternDefinition | undefined {
        return PATTERN_DEFINITIONS.find(p => p.patternId === patternId);
    }

    /**
     * List all available pattern definitions
     */
    getAllPatternDefinitions(): PatternDefinition[] {
        return [...PATTERN_DEFINITIONS];
    }
}

export const patternEngine = new PatternEngine();
