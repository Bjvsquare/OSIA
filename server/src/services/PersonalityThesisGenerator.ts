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
        }

        // Theme intro
        if (primaryThemes.length > 0) {
            const themeNames = primaryThemes.map(t => t.name).join(' and ');
            content += `Central to your arc is the tension of **${themeNames}**.\n\n`;
        }

        content += `*This thesis is a working mirror — it describes patterns we see, not fixed truths about who you are.*`;

        const { clean, violations } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'foundational_overview',
            content: clean,
            sourceClaimIds: [],
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

        strengthPatterns.slice(0, 4).forEach(pattern => {
            content += `**${pattern.name}**: ${pattern.oneLiner}\n\n`;

            // Find supporting claims
            const supporting = strengthClaims.filter(c =>
                pattern.supportingClaimIds.includes(c.claimId)
            );
            if (supporting.length > 0) {
                content += `> ${supporting[0].text}\n\n`;
            }
        });

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'core_strengths',
            content: clean,
            sourceClaimIds: strengthClaims.map(c => c.claimId),
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

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'behavioral_relational',
            content: clean,
            sourceClaimIds: relevantClaims.map(c => c.claimId),
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

        const { clean } = VocabularyEnforcer.enforce(content);

        return {
            sectionType: 'growth_trajectories',
            content: clean,
            sourceClaimIds: relevantClaims.map(c => c.claimId),
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
        } else {
            content += `We're still learning your patterns. This thesis will become more precise with time.`;
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
