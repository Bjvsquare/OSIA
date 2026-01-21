/**
 * OSIA Core Insights Hub Generator — v1.0
 * 
 * Generates the "Core Insights Hub" (Module 2) with "The One Thing" for each life domain.
 * 
 * 7 Life Domains:
 * 1. Spiritual - Purpose, meaning, transcendence
 * 2. Physical/Health - Energy, body, vitality
 * 3. Personal - Self-development, identity, inner work
 * 4. Relationships - Connection, intimacy, conflict
 * 5. Career - Professional growth, work fulfillment
 * 6. Business - Entrepreneurship, leadership, systems
 * 7. Finances - Money relationship, security, abundance
 * 
 * "The One Thing" Rules:
 * - Observable: Can be tracked
 * - Time-bounded: 7-30 day experiment
 * - Specific: Clear action, not vague intention
 * - Pattern-aligned: Derived from user's patterns
 */

import {
    Claim,
    Pattern,
    Theme,
    DomainInsight,
    LifeDomain,
    LAYER_DEFINITIONS
} from '../types/osia-types';

// ============================================================================
// DOMAIN CONFIGURATIONS: Layer mappings and focus areas
// ============================================================================

interface DomainConfig {
    domain: LifeDomain;
    displayName: string;
    primaryLayers: number[];          // Which layers most inform this domain
    patternKeywords: string[];        // Keywords to match patterns
    challengeTemplates: string[];     // Templates for primary challenge
    practiceBank: PracticeTemplate[]; // "One Thing" options
}

interface PracticeTemplate {
    trigger: string;                  // What pattern/claim triggers this
    practice: string;                 // The "One Thing" practice
    duration: string;                 // Suggested experiment length
    outcome: string;                  // Expected applied outcome
}

const DOMAIN_CONFIGS: DomainConfig[] = [
    {
        domain: 'spiritual',
        displayName: 'Spiritual & Purpose',
        primaryLayers: [5, 13, 14],    // Motivation, Identity, Growth Arc
        patternKeywords: ['purpose', 'meaning', 'motivation', 'protect', 'values'],
        challengeTemplates: [
            'Staying connected to what matters most',
            'Balancing achievement with meaning',
            'Finding clarity in your core values'
        ],
        practiceBank: [
            {
                trigger: 'motivation.protect',
                practice: 'Each morning, write 1 sentence about what you want to protect today',
                duration: '14 days',
                outcome: 'Increased alignment between daily actions and core values'
            },
            {
                trigger: 'drive_maximizer',
                practice: 'Block 15 minutes daily for reflection on "why" behind your goals',
                duration: '21 days',
                outcome: 'Reconnection between effort and purpose'
            },
            {
                trigger: 'default',
                practice: 'End each day noting one moment that felt meaningful',
                duration: '14 days',
                outcome: 'Heightened awareness of purpose threads in daily life'
            }
        ]
    },
    {
        domain: 'physical_health',
        displayName: 'Physical & Health',
        primaryLayers: [2, 6],         // Energy, Stress
        patternKeywords: ['energy', 'recovery', 'drain', 'stress', 'pressure'],
        challengeTemplates: [
            'Managing energy across demands',
            'Protecting recovery time',
            'Recognizing stress signals earlier'
        ],
        practiceBank: [
            {
                trigger: 'solitude_recharger',
                practice: 'Schedule one 30-minute "do nothing" block daily',
                duration: '14 days',
                outcome: 'More consistent energy levels'
            },
            {
                trigger: 'pressure_controller',
                practice: 'When you notice controlling impulses, pause for 3 breaths before acting',
                duration: '21 days',
                outcome: 'Reduced stress-driven over-function'
            },
            {
                trigger: 'pressure_withdrawal',
                practice: 'Signal to one person when you need space, before fully withdrawing',
                duration: '14 days',
                outcome: 'Withdrawal becomes a choice, not a reaction'
            },
            {
                trigger: 'default',
                practice: 'Track energy levels 3x daily (morning, afternoon, evening) on 1-10 scale',
                duration: '14 days',
                outcome: 'Clear data on your energy rhythm'
            }
        ]
    },
    {
        domain: 'personal',
        displayName: 'Personal Development',
        primaryLayers: [1, 13, 14, 15], // Core, Identity, Growth
        patternKeywords: ['growth', 'edge', 'development', 'stability', 'identity'],
        challengeTemplates: [
            'Balancing stability with growth',
            'Integrating new parts of yourself',
            'Working your current growth edge'
        ],
        practiceBank: [
            {
                trigger: 'growth_edge_active',
                practice: 'Take one small action toward your growth edge every 3 days',
                duration: '21 days',
                outcome: 'Incremental movement on what matters most'
            },
            {
                trigger: 'stability_anchor',
                practice: 'Introduce one small disruption to routine weekly to build flexibility',
                duration: '28 days',
                outcome: 'Expanded comfort with change'
            },
            {
                trigger: 'explorer_mind',
                practice: 'Commit to completing one exploration before starting another',
                duration: '14 days',
                outcome: 'Deeper completion alongside curiosity'
            },
            {
                trigger: 'default',
                practice: 'Journal for 10 minutes weekly on "what am I learning about myself"',
                duration: '28 days',
                outcome: 'Increased self-awareness'
            }
        ]
    },
    {
        domain: 'relationships',
        displayName: 'Relationships',
        primaryLayers: [10, 11, 9],    // Boundaries, Relational Patterning, Communication
        patternKeywords: ['boundary', 'connection', 'conflict', 'relational', 'warmth'],
        challengeTemplates: [
            'Maintaining boundaries while staying connected',
            'Navigating conflict without losing yourself',
            'Expressing needs clearly'
        ],
        practiceBank: [
            {
                trigger: 'boundary_porosity',
                practice: 'Before saying yes to a request, pause and ask: "Is this mine to carry?"',
                duration: '21 days',
                outcome: 'Clearer sense of your space versus others'
            },
            {
                trigger: 'boundary_clarity',
                practice: 'Practice one moment of deliberate permeability with a safe person this week',
                duration: '14 days',
                outcome: 'Flexibility alongside clarity'
            },
            {
                trigger: 'relational_warmth',
                practice: 'After giving care, take 5 minutes for yourself before the next giving moment',
                duration: '14 days',
                outcome: 'Protected capacity for connection'
            },
            {
                trigger: 'default',
                practice: 'Name one need clearly to one person this week',
                duration: '14 days',
                outcome: 'Increased clarity in relational communication'
            }
        ]
    },
    {
        domain: 'career',
        displayName: 'Career',
        primaryLayers: [8, 12, 5],     // Execution, Social Role, Motivation
        patternKeywords: ['work', 'execution', 'collaboration', 'initiator', 'responder', 'drive'],
        challengeTemplates: [
            'Aligning work style with role demands',
            'Showing up in ways that serve you',
            'Sustaining drive without burnout'
        ],
        practiceBank: [
            {
                trigger: 'initiator_stance',
                practice: 'In one meeting this week, practice responding before proposing',
                duration: '14 days',
                outcome: 'Expanded range beyond initiating'
            },
            {
                trigger: 'responder_stance',
                practice: 'Propose one idea before it feels "ready" this week',
                duration: '14 days',
                outcome: 'Increased ownership of your contributions'
            },
            {
                trigger: 'structured_processor',
                practice: 'Make one decision with 70% information instead of waiting for 100%',
                duration: '21 days',
                outcome: 'Faster decision velocity'
            },
            {
                trigger: 'drive_maximizer',
                practice: 'Set a hard stop time for work 3 days this week and honor it',
                duration: '14 days',
                outcome: 'Recovery integrated into achievement'
            },
            {
                trigger: 'default',
                practice: 'Identify one task that drains you and delegate or eliminate it',
                duration: '7 days',
                outcome: 'More energy for high-value work'
            }
        ]
    },
    {
        domain: 'business',
        displayName: 'Business & Leadership',
        primaryLayers: [4, 8, 12],     // Decision Logic, Execution, Influence
        patternKeywords: ['decision', 'complexity', 'leadership', 'influence', 'control'],
        challengeTemplates: [
            'Making decisions in ambiguity',
            'Leading without over-controlling',
            'Building systems that scale with you'
        ],
        practiceBank: [
            {
                trigger: 'pressure_controller',
                practice: 'Delegate one decision fully this week—no retrieval',
                duration: '14 days',
                outcome: 'Trust in systems beyond yourself'
            },
            {
                trigger: 'structured_processor',
                practice: 'Set a decision deadline before gathering information, not after',
                duration: '21 days',
                outcome: 'Faster iteration cycles'
            },
            {
                trigger: 'default',
                practice: 'Document one decision rationale weekly for future reference',
                duration: '28 days',
                outcome: 'Systematized decision-making'
            }
        ]
    },
    {
        domain: 'finances',
        displayName: 'Finances',
        primaryLayers: [5, 6, 4],      // Motivation (scarcity/abundance), Stress, Decision
        patternKeywords: ['protect', 'security', 'risk', 'control', 'abundance'],
        challengeTemplates: [
            'Managing money without anxiety driving choices',
            'Balancing security with generosity',
            'Aligning spending with values'
        ],
        practiceBank: [
            {
                trigger: 'pressure_controller',
                practice: 'Before a financial decision, notice if stress is driving the choice',
                duration: '21 days',
                outcome: 'Decoupled finances from anxiety'
            },
            {
                trigger: 'stability_anchor',
                practice: 'Make one small "stretch" financial decision outside your comfort zone',
                duration: '14 days',
                outcome: 'Expanded comfort with financial flexibility'
            },
            {
                trigger: 'default',
                practice: 'Review one week of spending and tag each item as "value-aligned" or "reactive"',
                duration: '7 days',
                outcome: 'Clarity on financial patterns'
            }
        ]
    }
];

// ============================================================================
// CORE INSIGHTS HUB GENERATOR
// ============================================================================

export interface CoreInsightsHub {
    userId: string;
    generatedAt: string;
    snapshotId: string;
    domainInsights: DomainInsight[];
    primaryFocusDomain: LifeDomain;
    coverageScore: number;  // 0-1, how many domains have insights
}

class CoreInsightsHubGenerator {
    /**
     * Generate the complete Core Insights Hub from patterns and claims
     */
    generate(
        userId: string,
        snapshotId: string,
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[]
    ): CoreInsightsHub {
        const insights: DomainInsight[] = [];

        for (const config of DOMAIN_CONFIGS) {
            const insight = this.generateDomainInsight(config, claims, patterns);
            insights.push(insight);
        }

        // Determine primary focus domain (highest relevance)
        const primaryFocusDomain = this.determinePrimaryDomain(insights, patterns);

        // Calculate coverage
        const coverageScore = insights.filter(i => i.oneThing !== '').length / insights.length;

        return {
            userId,
            generatedAt: new Date().toISOString(),
            snapshotId,
            domainInsights: insights,
            primaryFocusDomain,
            coverageScore
        };
    }

    /**
     * Generate insight for a single domain
     */
    private generateDomainInsight(
        config: DomainConfig,
        claims: Claim[],
        patterns: Pattern[]
    ): DomainInsight {
        // Find relevant claims and patterns
        const relevantClaims = claims.filter(c =>
            config.primaryLayers.includes(c.layerId)
        );
        const relevantPatterns = patterns.filter(p => {
            const nameMatch = config.patternKeywords.some(kw =>
                p.name.toLowerCase().includes(kw) ||
                p.oneLiner.toLowerCase().includes(kw)
            );
            const layerMatch = p.layerIds.some(l => config.primaryLayers.includes(l));
            return nameMatch || layerMatch;
        });

        // Generate core theme
        const coreTheme = this.generateCoreTheme(config, relevantPatterns);

        // Select primary challenge
        const primaryChallenge = this.selectPrimaryChallenge(config, relevantPatterns);

        // Select "The One Thing" practice
        const { practice, outcome } = this.selectOneThing(config, relevantPatterns);

        return {
            domain: config.domain,
            coreTheme,
            primaryChallenge,
            oneThing: practice,
            appliedOutcome: outcome,
            sourceLayerIds: config.primaryLayers,
            sourcePatternsIds: relevantPatterns.map(p => p.patternId)
        };
    }

    /**
     * Generate the core theme for a domain
     */
    private generateCoreTheme(config: DomainConfig, patterns: Pattern[]): string {
        if (patterns.length === 0) {
            return `Emerging understanding of your ${config.displayName.toLowerCase()} patterns`;
        }

        const topPattern = patterns.sort((a, b) => b.stabilityIndex - a.stabilityIndex)[0];
        return `Your ${config.displayName.toLowerCase()} is shaped by **${topPattern.name}**: ${topPattern.oneLiner}`;
    }

    /**
     * Select the most relevant primary challenge
     */
    private selectPrimaryChallenge(config: DomainConfig, patterns: Pattern[]): string {
        // If we have friction patterns, use those to inform challenge
        const frictionPatterns = patterns.filter(p =>
            p.name.toLowerCase().includes('pressure') ||
            p.name.toLowerCase().includes('friction') ||
            p.name.toLowerCase().includes('porosity')
        );

        if (frictionPatterns.length > 0) {
            return config.challengeTemplates[0]; // Use first template for friction
        }

        // Default to middle template
        return config.challengeTemplates[Math.floor(config.challengeTemplates.length / 2)];
    }

    /**
     * Select "The One Thing" practice based on patterns
     */
    private selectOneThing(
        config: DomainConfig,
        patterns: Pattern[]
    ): { practice: string; outcome: string } {
        const patternIds = patterns.map(p => p.patternId.toLowerCase());

        // Find matching practice
        for (const pt of config.practiceBank) {
            if (pt.trigger === 'default') continue;

            const matchesPattern = patternIds.some(pId =>
                pId.includes(pt.trigger.toLowerCase())
            );

            if (matchesPattern) {
                return {
                    practice: `**The One Thing (${pt.duration}):** ${pt.practice}`,
                    outcome: pt.outcome
                };
            }
        }

        // Fall back to default practice
        const defaultPractice = config.practiceBank.find(pt => pt.trigger === 'default');
        if (defaultPractice) {
            return {
                practice: `**The One Thing (${defaultPractice.duration}):** ${defaultPractice.practice}`,
                outcome: defaultPractice.outcome
            };
        }

        return { practice: '', outcome: '' };
    }

    /**
     * Determine which domain should be the primary focus
     */
    private determinePrimaryDomain(
        insights: DomainInsight[],
        patterns: Pattern[]
    ): LifeDomain {
        // Score each domain by pattern density
        const scores = new Map<LifeDomain, number>();

        for (const insight of insights) {
            scores.set(insight.domain, insight.sourcePatternsIds.length);
        }

        // Find domain with highest score
        let primaryDomain: LifeDomain = 'personal';
        let highestScore = 0;

        for (const [domain, score] of scores) {
            if (score > highestScore) {
                highestScore = score;
                primaryDomain = domain;
            }
        }

        return primaryDomain;
    }

    /**
     * Render hub to markdown
     */
    renderToMarkdown(hub: CoreInsightsHub): string {
        let md = `# Core Insights Hub\n\n`;
        md += `*Generated: ${new Date(hub.generatedAt).toLocaleDateString()}*\n\n`;
        md += `**Primary Focus:** ${hub.primaryFocusDomain.replace('_', ' ')}\n\n`;
        md += `---\n\n`;

        for (const insight of hub.domainInsights) {
            const config = DOMAIN_CONFIGS.find(c => c.domain === insight.domain);
            const displayName = config?.displayName || insight.domain;

            md += `## ${displayName}\n\n`;
            md += `${insight.coreTheme}\n\n`;
            md += `**Primary Challenge:** ${insight.primaryChallenge}\n\n`;

            if (insight.oneThing) {
                md += `${insight.oneThing}\n\n`;
                md += `*Expected outcome: ${insight.appliedOutcome}*\n\n`;
            }

            md += `---\n\n`;
        }

        return md;
    }
}

export const coreInsightsHubGenerator = new CoreInsightsHubGenerator();
