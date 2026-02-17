/**
 * OSIA Personality Thesis Generator — v1.0
 * 
 * Generates the "Personality Thesis Blueprint" (Module 1) from Claims, Patterns, and Themes.
 * This is the foundational narrative document that describes someone's core architecture.
 * 
 * Output Structure:
 * 1. Foundational Overview - Pattern summary and intro statement
 * 2. Cognitive & Emotional Blueprint - Layers 1-4 synthesis
 * 3. Core Strengths - Strength-polarity patterns
 * 4. Friction Zones - Friction-polarity patterns and stress responses
 * 5. Behavioral & Relational Tendencies - Layers 8-12 synthesis
 * 6. Growth Trajectories - Layers 13-15 + growth edges
 * 7. Closing Reflection - Integration themes
 */

import {
    Claim,
    Pattern,
    Theme,
    ModuleSection,
    ThesisSectionType,
    FORBIDDEN_VOCABULARY,
    PREFERRED_VOCABULARY,
    LAYER_DEFINITIONS
} from '../types/osia-types';

// ============================================================================
// VOCABULARY ENFORCEMENT
// ============================================================================

class VocabularyEnforcer {
    /**
     * Check text for forbidden vocabulary and replace/flag
     */
    static enforce(text: string): { clean: string; violations: string[] } {
        let clean = text;
        const violations: string[] = [];

        for (const forbidden of FORBIDDEN_VOCABULARY) {
            const regex = new RegExp(`\\b${forbidden}\\b`, 'gi');
            if (regex.test(clean)) {
                violations.push(forbidden);
                // Replace with hypothesis-framed alternatives
                clean = clean.replace(regex, this.getAlternative(forbidden));
            }
        }

        return { clean, violations };
    }

    /**
     * Get a safe alternative for a forbidden term
     */
    private static getAlternative(forbidden: string): string {
        const alternatives: Record<string, string> = {
            'you are': 'you may show up as',
            'this proves': 'this suggests',
            'always will be': 'often shows as',
            'never can': 'may find challenging',
            'toxic': 'challenging dynamic',
            'broken': 'under pressure',
            'weak': 'developing',
            'lazy': 'conserving energy',
            'selfish': 'self-protective',
            'manipulative': 'indirect communicator',
            'narcissistic': 'self-focused pattern',
            'codependent': 'high relational investment',
            'trauma response': 'protective pattern'
        };

        return alternatives[forbidden.toLowerCase()] || 'pattern';
    }

    /**
     * Add hypothesis framing if missing
     */
    static addHypothesisFraming(text: string): string {
        // If text starts with a definitive statement, soften it
        if (text.match(/^You are\b/i)) {
            return text.replace(/^You are\b/i, 'You tend to be');
        }
        if (text.match(/^This is\b/i)) {
            return text.replace(/^This is\b/i, 'This appears to be');
        }
        return text;
    }
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

interface SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection;
}

/**
 * Section 1: Foundational Overview
 */
class FoundationalOverviewGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        const stablePatterns = patterns.filter(p => p.stabilityIndex >= 0.5);
        const primaryThemes = themes.filter(t => t.priority === 'high');

        let content = '## Foundational Overview\n\n';

        // Pattern summary
        if (stablePatterns.length > 0) {
            const patternNames = stablePatterns.slice(0, 3).map(p => p.name).join(', ');
            content += `Your blueprint reveals ${stablePatterns.length} stable patterns, including: **${patternNames}**. `;
        } else if (claims.length > 0) {
            // Fallback for new users: synthesize from available claims
            const uniqueLayers = [...new Set(claims.map(c => c.layerId))];
            content += `Your initial blueprint captures signals across ${uniqueLayers.length} dimensions of your personality. `;
            const topClaims = claims.filter(c => c.confidence !== 'emerging').slice(0, 3);
            if (topClaims.length > 0) {
                content += `Early patterns suggest a personality shaped by how you process the world — through your natural dispositions, energy orientation, and core values. `;
            }
        }

        // Theme intro
        if (primaryThemes.length > 0) {
            const themeNames = primaryThemes.map(t => t.name).join(' and ');
            content += `Central to your arc is the tension of **${themeNames}**.\n\n`;
        } else {
            content += `As more data accumulates, the deeper tensions and themes in your personality will come into sharper focus.\n\n`;
        }

        content += `*This thesis is a working mirror — it describes patterns we see, not fixed truths about who you are.*`;

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'foundational_overview',
            content: clean,
            sourceClaimIds: claims.slice(0, 5).map(c => c.claimId),
            sourcePatternIds: stablePatterns.map(p => p.patternId),
            sourceThemeIds: primaryThemes.map(t => t.themeId),
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 2: Cognitive & Emotional Blueprint
 */
class CognitiveEmotionalGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        // Filter to Layers 1-4 claims and patterns
        const relevantClaims = claims.filter(c => [1, 2, 3, 4].includes(c.layerId));
        const relevantPatterns = patterns.filter(p =>
            p.layerIds.some(l => [1, 2, 3, 4].includes(l))
        );

        let content = '## Cognitive & Emotional Blueprint\n\n';

        // Layer 1: Core Disposition
        const l1Claims = relevantClaims.filter(c => c.layerId === 1);
        if (l1Claims.length > 0) {
            content += '### Core Disposition\n\n';
            content += l1Claims[0].text + '\n\n';
        }

        // Layer 2: Energy
        const l2Claims = relevantClaims.filter(c => c.layerId === 2);
        if (l2Claims.length > 0) {
            content += '### Energy Orientation\n\n';
            l2Claims.forEach(c => {
                content += c.text + ' ';
            });
            content += '\n\n';
        }

        // Layer 3-4: Processing
        const l34Claims = relevantClaims.filter(c => [3, 4].includes(c.layerId));
        if (l34Claims.length > 0) {
            content += '### Information Processing & Decision-Making\n\n';
            l34Claims.forEach(c => {
                content += c.text + ' ';
            });
            content += '\n\n';
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'cognitive_emotional_blueprint',
            content: clean,
            sourceClaimIds: relevantClaims.map(c => c.claimId),
            sourcePatternIds: relevantPatterns.map(p => p.patternId),
            sourceThemeIds: [],
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 3: Core Strengths
 */
class CoreStrengthsGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        const strengthClaims = claims.filter(c => c.polarity === 'strength');
        const strengthPatterns = patterns.filter(p =>
            p.supportingClaimIds.some(cId =>
                strengthClaims.some(c => c.claimId === cId)
            )
        );

        let content = '## Core Strengths\n\n';

        content += 'These patterns represent where you operate most naturally and effectively:\n\n';

        if (strengthPatterns.length > 0) {
            strengthPatterns.slice(0, 4).forEach(pattern => {
                content += `**${pattern.name}**: ${pattern.oneLiner}\n\n`;
                const supporting = strengthClaims.filter(c =>
                    pattern.supportingClaimIds.includes(c.claimId)
                );
                if (supporting.length > 0) {
                    content += `> ${supporting[0].text}\n\n`;
                }
            });
        } else if (strengthClaims.length > 0) {
            // Fallback: use strength claims directly
            strengthClaims.slice(0, 4).forEach(c => {
                content += `> ${c.text}\n\n`;
            });
        } else {
            // Deep fallback: infer strengths from highest confidence claims
            const highConfidence = [...claims]
                .filter(c => c.confidence === 'developed' || c.confidence === 'integrated' || c.confidence === 'moderate')
                .slice(0, 4);
            if (highConfidence.length > 0) {
                content += 'Based on your foundational signals, your natural strengths appear in these areas:\n\n';
                highConfidence.forEach(c => {
                    const layerName = LAYER_DEFINITIONS[c.layerId]?.name || `Layer ${c.layerId}`;
                    content += `**${layerName}**: ${c.text}\n\n`;
                });
            } else {
                content += 'Your core strengths will become clearer as you engage with more protocols and reflections. Each interaction adds signal to your blueprint.\n\n';
            }
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'core_strengths',
            content: clean,
            sourceClaimIds: (strengthClaims.length > 0 ? strengthClaims : claims.slice(0, 4)).map(c => c.claimId),
            sourcePatternIds: strengthPatterns.map(p => p.patternId),
            sourceThemeIds: [],
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 4: Friction Zones
 */
class FrictionZonesGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        const frictionClaims = claims.filter(c => c.polarity === 'friction');
        const stressClaims = claims.filter(c => c.layerId === 6);

        let content = '## Friction Zones\n\n';

        content += 'These patterns emerge when pressure rises. They are not flaws—they are signals worth understanding:\n\n';

        // Stress patterns
        if (stressClaims.length > 0) {
            content += '### Under Pressure\n\n';
            stressClaims.forEach(c => {
                content += c.text + '\n\n';
            });
        }

        // Friction patterns
        if (frictionClaims.length > 0) {
            content += '### Growth Edges\n\n';
            frictionClaims.slice(0, 3).forEach(c => {
                content += `- ${c.text}\n`;
            });
            content += '\n';
        }

        // Fallback for new users: infer friction from lower-confidence or contrasting claims
        if (frictionClaims.length === 0 && stressClaims.length === 0) {
            const lowerConfidence = claims.filter(c => c.confidence === 'emerging' || c.confidence === 'moderate');
            if (lowerConfidence.length > 0) {
                content += '### Emerging Tensions\n\n';
                content += 'While your friction zones are still being mapped, these early signals hint at areas where you may experience internal tension:\n\n';
                lowerConfidence.slice(0, 3).forEach(c => {
                    const layerName = LAYER_DEFINITIONS[c.layerId]?.name || `Layer ${c.layerId}`;
                    content += `- **${layerName}**: The patterns here suggest a dynamic still finding its equilibrium. ${c.text}\n`;
                });
                content += '\n';
            } else {
                content += '### Areas to Watch\n\n';
                content += 'Your friction zones have not yet surfaced clearly in the data. This is common early in the journey — as you engage with protocols and thought experiments, the system will identify where pressure tends to build and how you naturally respond to challenge.\n\n';
                content += 'Every personality carries creative tensions. These tensions are not weaknesses — they are the edges where growth happens most naturally.\n\n';
            }
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'friction_zones',
            content: clean,
            sourceClaimIds: [...frictionClaims, ...stressClaims].map(c => c.claimId),
            sourcePatternIds: [],
            sourceThemeIds: [],
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 5: Behavioral & Relational Tendencies
 */
class BehavioralRelationalGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        // Filter to Layers 8-12
        const relevantClaims = claims.filter(c => [8, 9, 10, 11, 12].includes(c.layerId));
        const relevantPatterns = patterns.filter(p =>
            p.layerIds.some(l => [8, 9, 10, 11, 12].includes(l))
        );

        let content = '## Behavioral & Relational Tendencies\n\n';

        // Collaboration & Execution
        const l8Claims = relevantClaims.filter(c => c.layerId === 8);
        if (l8Claims.length > 0 || relevantPatterns.some(p => p.layerIds.includes(8))) {
            content += '### Work Style & Execution\n\n';
            l8Claims.forEach(c => content += c.text + ' ');
            content += '\n\n';
        }

        // Boundaries & Connection
        const l10Claims = relevantClaims.filter(c => c.layerId === 10);
        if (l10Claims.length > 0) {
            content += '### Boundaries & Connection\n\n';
            l10Claims.forEach(c => content += c.text + ' ');
            content += '\n\n';
        }

        // Relational Patterns
        if (relevantPatterns.some(p => p.category === 'relational')) {
            content += '### Key Relational Patterns\n\n';
            relevantPatterns
                .filter(p => p.category === 'relational')
                .slice(0, 3)
                .forEach(p => {
                    content += `- **${p.name}**: ${p.oneLiner}\n`;
                });
            content += '\n';
        }

        // Fallback for new users: extrapolate relational tendencies from core layers
        if (relevantClaims.length === 0 && relevantPatterns.length === 0) {
            const coreClaims = claims.filter(c => [1, 2, 3, 4, 5].includes(c.layerId));
            if (coreClaims.length > 0) {
                content += '### Relational Indicators\n\n';
                content += 'While your relational layers are still developing, your foundational signals offer early clues about how you may show up in relationships:\n\n';

                // Extrapolate from core disposition
                const dispositionClaims = coreClaims.filter(c => c.layerId === 1);
                if (dispositionClaims.length > 0) {
                    content += `Your core disposition influences how others experience you — ${dispositionClaims[0].text.toLowerCase()} This naturally shapes your relational dynamics.\n\n`;
                }

                // Energy and communication style
                const energyClaims = coreClaims.filter(c => c.layerId === 2);
                if (energyClaims.length > 0) {
                    content += `Your energetic orientation suggests a particular communication rhythm. ${energyClaims[0].text}\n\n`;
                }

                content += 'As you connect with others on the platform and complete relational protocols, a richer picture of your behavioral tendencies will emerge.\n\n';
            } else {
                content += 'Your behavioral and relational patterns will become visible as you interact with protocols and connect with others. The system maps how your core architecture influences your relationships, work style, and boundaries.\n\n';
            }
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'behavioral_relational',
            content: clean,
            sourceClaimIds: (relevantClaims.length > 0 ? relevantClaims : claims.filter(c => [1, 2, 3, 4, 5].includes(c.layerId))).map(c => c.claimId),
            sourcePatternIds: relevantPatterns.map(p => p.patternId),
            sourceThemeIds: [],
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 6: Growth Trajectories
 */
class GrowthTrajectoriesGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        // Layers 13-15 focus
        const relevantClaims = claims.filter(c => [13, 14, 15].includes(c.layerId));

        let content = '## Growth Trajectories\n\n';

        // Current edge
        const edgeClaims = relevantClaims.filter(c => c.layerId === 15);
        if (edgeClaims.length > 0) {
            content += '### Current Growth Edge\n\n';
            content += edgeClaims[0].text + '\n\n';
        }

        // Growth edges from patterns
        const allGrowthEdges: string[] = [];
        patterns.forEach(p => {
            p.growthEdges.forEach(edge => {
                if (!allGrowthEdges.includes(edge)) {
                    allGrowthEdges.push(edge);
                }
            });
        });

        if (allGrowthEdges.length > 0) {
            content += '### Suggested Experiments\n\n';
            allGrowthEdges.slice(0, 5).forEach(edge => {
                content += `- ${edge}\n`;
            });
            content += '\n';
        }

        // Fallback for new users: generate growth directions from available data
        if (relevantClaims.length === 0 && allGrowthEdges.length === 0) {
            const allClaims = [...claims];
            const uniqueLayers = [...new Set(allClaims.map(c => c.layerId))];

            content += '### Your Growth Landscape\n\n';
            content += 'Your journey of self-discovery is just beginning. Based on your foundational signals, here are areas where growth may unfold:\n\n';

            // Generate growth directions from whatever layers are populated
            if (uniqueLayers.includes(1)) {
                content += '- **Deepening Self-Awareness**: Your core disposition patterns offer a starting point. Explore protocols that challenge your default responses and reveal hidden dimensions.\n';
            }
            if (uniqueLayers.includes(2)) {
                content += '- **Energy Management**: Understanding your natural energy cycles can unlock more sustainable engagement patterns and prevent burnout.\n';
            }
            if (uniqueLayers.includes(3) || uniqueLayers.includes(4)) {
                content += '- **Cognitive Flexibility**: Your processing style has natural strengths — growth often comes from intentionally practicing the complementary approach.\n';
            }
            if (uniqueLayers.includes(5)) {
                content += '- **Values Integration**: When your actions consistently align with your core values, a sense of integrity and purpose deepens naturally.\n';
            }

            content += '\n### Recommended Next Steps\n\n';
            content += '- Complete thought experiments to add depth to your blueprint\n';
            content += '- Engage with daily protocols to develop consistency signals\n';
            content += '- Connect with others to unlock relational intelligence layers\n';
            content += '\n';
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'growth_trajectories',
            content: clean,
            sourceClaimIds: (relevantClaims.length > 0 ? relevantClaims : claims.slice(0, 3)).map(c => c.claimId),
            sourcePatternIds: patterns.map(p => p.patternId),
            sourceThemeIds: [],
            wordCount: clean.split(/\s+/).length
        };
    }
}

/**
 * Section 7: Closing Reflection
 */
class ClosingReflectionGenerator implements SectionGenerator {
    generate(claims: Claim[], patterns: Pattern[], themes: Theme[]): ModuleSection {
        let content = '## Closing Reflection\n\n';

        // Theme synthesis
        if (themes.length > 0) {
            content += 'The tensions you navigate—';
            content += themes.slice(0, 2).map(t => t.name).join(' and ');
            content += '—are not problems to solve but polarities to hold.\n\n';
        } else if (claims.length > 0) {
            const uniqueLayers = [...new Set(claims.map(c => c.layerId))];
            content += `Your thesis currently draws from signals across ${uniqueLayers.length} personality layers, with ${claims.length} distinct observations mapped so far. `;
            content += 'As you engage with more of the platform, each interaction adds resolution to this portrait.\n\n';
        }

        content += '*This thesis will evolve as you do. Use it as a mirror, not a map.*\n\n';

        // Stability note
        const avgStability = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns.length
            : 0;

        if (avgStability >= 0.6) {
            content += `Your patterns show **${Math.round(avgStability * 100)}% stability** — these are well-established dynamics.`;
        } else if (avgStability >= 0.4) {
            content += `Your patterns are still **emerging** — expect refinement as more data accumulates.`;
        } else if (patterns.length > 0) {
            content += `We're still learning your patterns. This thesis will become more precise with time.`;
        } else {
            content += `This is the beginning of your OSIA journey. Your thesis will deepen with every protocol, thought experiment, and connection you make. The system learns as you do — and the blueprint it builds becomes more precise, more personal, and more powerful over time.`;
        }

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'closing_reflection',
            content: clean,
            sourceClaimIds: [],
            sourcePatternIds: patterns.map(p => p.patternId),
            sourceThemeIds: themes.map(t => t.themeId),
            wordCount: clean.split(/\s+/).length
        };
    }
}

// ============================================================================
// MAIN GENERATOR CLASS
// ============================================================================

export interface PersonalityThesis {
    userId: string;
    generatedAt: string;
    snapshotId: string;
    sections: ModuleSection[];
    totalWordCount: number;
    patternCount: number;
    themeCount: number;
    stabilityIndex: number;
}

class PersonalityThesisGenerator {
    private sectionGenerators: Map<ThesisSectionType, SectionGenerator>;

    constructor() {
        this.sectionGenerators = new Map([
            ['foundational_overview', new FoundationalOverviewGenerator()],
            ['cognitive_emotional_blueprint', new CognitiveEmotionalGenerator()],
            ['core_strengths', new CoreStrengthsGenerator()],
            ['friction_zones', new FrictionZonesGenerator()],
            ['behavioral_relational', new BehavioralRelationalGenerator()],
            ['growth_trajectories', new GrowthTrajectoriesGenerator()],
            ['closing_reflection', new ClosingReflectionGenerator()]
        ]);
    }

    /**
     * Generate a complete Personality Thesis from claims, patterns, and themes
     */
    generate(
        userId: string,
        snapshotId: string,
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[]
    ): PersonalityThesis {
        const sections: ModuleSection[] = [];

        // Generate each section in order
        const sectionOrder: ThesisSectionType[] = [
            'foundational_overview',
            'cognitive_emotional_blueprint',
            'core_strengths',
            'friction_zones',
            'behavioral_relational',
            'growth_trajectories',
            'closing_reflection'
        ];

        for (const sectionType of sectionOrder) {
            const generator = this.sectionGenerators.get(sectionType);
            if (generator) {
                const section = generator.generate(claims, patterns, themes);
                sections.push(section);
            }
        }

        // Calculate totals
        const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);
        const avgStability = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns.length
            : 0;

        return {
            userId,
            generatedAt: new Date().toISOString(),
            snapshotId,
            sections,
            totalWordCount,
            patternCount: patterns.length,
            themeCount: themes.length,
            stabilityIndex: Math.round(avgStability * 100) / 100
        };
    }

    /**
     * Render thesis to markdown string
     */
    renderToMarkdown(thesis: PersonalityThesis): string {
        let markdown = `# Personality Thesis\n\n`;
        markdown += `*Generated: ${new Date(thesis.generatedAt).toLocaleDateString()}*\n\n`;
        markdown += `---\n\n`;

        for (const section of thesis.sections) {
            markdown += section.content + '\n\n---\n\n';
        }

        return markdown;
    }
}

export const personalityThesisGenerator = new PersonalityThesisGenerator();
