/**
 * OSIA Theme Engine — v1.0
 * 
 * Synthesizes Themes from convergent Patterns across multiple layers.
 * Themes represent high-level polarity tensions that shape a person's arc.
 * 
 * Example themes:
 * - "Control ↔ Trust"
 * - "Achievement ↔ Balance"
 * - "Connection ↔ Autonomy"
 */

import { randomUUID } from 'crypto';
import {
    Pattern,
    Theme,
    ClaimConfidence
} from '../types/osia-types';

// ============================================================================
// THEME DEFINITIONS: High-level polarity tensions
// ============================================================================

interface ThemeDefinition {
    themeId: string;
    name: string;
    description: string;
    detectFromPatterns: string[];    // Pattern IDs that indicate this theme
    requiredPatternCount: number;    // How many patterns needed to detect
    eligibleLayerClusters: ('A' | 'B' | 'C' | 'D' | 'E')[];
}

const THEME_DEFINITIONS: ThemeDefinition[] = [
    {
        themeId: 'THM.CONTROL_VS_TRUST',
        name: 'Control ↔ Trust',
        description: 'A recurring tension between controlling outcomes and trusting emergence',
        detectFromPatterns: ['PAT.IND.PRESSURE_CONTROLLER', 'PAT.IND.STRUCTURED_PROCESSOR', 'PAT.IND.INITIATOR_STANCE'],
        requiredPatternCount: 2,
        eligibleLayerClusters: ['B', 'C']
    },
    {
        themeId: 'THM.ACHIEVEMENT_VS_BALANCE',
        name: 'Achievement ↔ Balance',
        description: 'A recurring tension between driving toward goals and sustaining equilibrium',
        detectFromPatterns: ['PAT.IND.DRIVE_MAXIMIZER', 'PAT.IND.PRESSURE_CONTROLLER'],
        requiredPatternCount: 1,
        eligibleLayerClusters: ['B']
    },
    {
        themeId: 'THM.CONNECTION_VS_AUTONOMY',
        name: 'Connection ↔ Autonomy',
        description: 'A recurring tension between deep connection and protected independence',
        detectFromPatterns: ['PAT.IND.RELATIONAL_WARMTH', 'PAT.IND.BOUNDARY_CLARITY', 'PAT.IND.SOLITUDE_RECHARGER', 'PAT.IND.PEOPLE_ENERGIZER'],
        requiredPatternCount: 2,
        eligibleLayerClusters: ['C', 'D']
    },
    {
        themeId: 'THM.STABILITY_VS_GROWTH',
        name: 'Stability ↔ Growth',
        description: 'A recurring tension between maintaining stability and pursuing development',
        detectFromPatterns: ['PAT.IND.STABILITY_ANCHOR', 'PAT.IND.EXPLORER_MIND', 'PAT.IND.GROWTH_EDGE_ACTIVE'],
        requiredPatternCount: 2,
        eligibleLayerClusters: ['A', 'E']
    },
    {
        themeId: 'THM.EXPRESSION_VS_PROTECTION',
        name: 'Expression ↔ Protection',
        description: 'A recurring tension between showing up fully and protecting capacity',
        detectFromPatterns: ['PAT.IND.PRESSURE_WITHDRAWAL', 'PAT.IND.BOUNDARY_POROSITY', 'PAT.IND.RESPONDER_STANCE'],
        requiredPatternCount: 2,
        eligibleLayerClusters: ['C', 'D']
    },
    {
        themeId: 'THM.STRUCTURE_VS_EMERGENCE',
        name: 'Structure ↔ Emergence',
        description: 'A recurring tension between planning and allowing things to unfold',
        detectFromPatterns: ['PAT.IND.STRUCTURED_PROCESSOR', 'PAT.IND.EXPLORER_MIND'],
        requiredPatternCount: 2,
        eligibleLayerClusters: ['A', 'B']
    }
];

// ============================================================================
// THEME ENGINE CLASS
// ============================================================================

class ThemeEngine {
    /**
     * Detect themes from a set of patterns
     */
    detectThemes(patterns: Pattern[], userId: string): Theme[] {
        const detectedThemes: Theme[] = [];
        const patternIds = new Set(patterns.map(p => p.patternId));

        for (const definition of THEME_DEFINITIONS) {
            const matchingPatterns = definition.detectFromPatterns.filter(
                pId => patternIds.has(pId)
            );

            if (matchingPatterns.length >= definition.requiredPatternCount) {
                const supportingPatterns = patterns.filter(
                    p => matchingPatterns.includes(p.patternId)
                );

                const theme = this.createTheme(definition, supportingPatterns, userId);
                detectedThemes.push(theme);
            }
        }

        return this.prioritizeThemes(detectedThemes);
    }

    /**
     * Create a Theme from a definition and supporting patterns
     */
    private createTheme(
        definition: ThemeDefinition,
        supportingPatterns: Pattern[],
        userId: string
    ): Theme {
        // Aggregate layer IDs from supporting patterns
        const layerIds = new Set<number>();
        for (const pattern of supportingPatterns) {
            for (const layerId of pattern.layerIds) {
                layerIds.add(layerId);
            }
        }

        // Determine priority based on pattern stability
        const avgStability = supportingPatterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / supportingPatterns.length;
        const priority: 'low' | 'medium' | 'high' =
            avgStability >= 0.6 ? 'high' :
                avgStability >= 0.4 ? 'medium' : 'low';

        return {
            themeId: definition.themeId,
            name: definition.name,
            layerIds: Object.freeze([...layerIds]) as readonly number[],
            summary: definition.description,
            supportingPatternIds: Object.freeze(supportingPatterns.map(p => p.patternId)),
            priority,
            createdAt: new Date().toISOString(),
            userId
        };
    }

    /**
     * Prioritize themes by strength (high priority first)
     */
    private prioritizeThemes(themes: Theme[]): Theme[] {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return [...themes].sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    /**
     * Get primary themes (high priority only)
     */
    getPrimaryThemes(themes: Theme[]): Theme[] {
        return themes.filter(t => t.priority === 'high');
    }

    /**
     * Get theme by ID
     */
    getThemeDefinition(themeId: string): ThemeDefinition | undefined {
        return THEME_DEFINITIONS.find(t => t.themeId === themeId);
    }

    /**
     * List all theme definitions
     */
    getAllThemeDefinitions(): ThemeDefinition[] {
        return [...THEME_DEFINITIONS];
    }
}

export const themeEngine = new ThemeEngine();
