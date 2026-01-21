/**
 * AI Intelligence Service — v2.0 PREMIUM
 * 
 * Generates BILLION-DOLLAR level psychological insights using Claude AI.
 * This is NOT a basic personality quiz output — this is premium,
 * psychologically profound, eloquently written content that transforms lives.
 * 
 * Output Quality Standard:
 * - Deep psychological insight
 * - Eloquent, flowing prose
 * - Highly personalized narratives
 * - Actionable growth trajectories
 * - Premium writing that justifies premium pricing
 */

import Anthropic from '@anthropic-ai/sdk';
import { Blueprint } from './AstrologyService';
import { Claim, Pattern, Theme, DomainInsight, LifeDomain, ModuleSection, ThesisSectionType } from '../types/osia-types';
import { TraitProbability } from './BlueprintService';
import { PersonalityThesis } from './PersonalityThesisGenerator';
import { CoreInsightsHub } from './CoreInsightsHubGenerator';
import { RelationalConnectorsProfile, RelationalConnectorInsight } from './RelationalConnectorsGenerator';
import { aiCreditsService, AIGenerationType } from './AICreditsService';


// ============================================================================
// AI SERVICE CLASS
// ============================================================================

class AIIntelligenceService {
    private client: Anthropic | null = null;
    private readonly model = 'claude-sonnet-4-20250514';

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.client = new Anthropic({ apiKey });
            console.log('[AIIntelligence] Claude API configured successfully');
        } else {
            console.log('[AIIntelligence] No API key - running in template-only mode');
        }
    }

    isAvailable(): boolean {
        return this.client !== null;
    }

    // ========================================================================
    // PERSONALITY THESIS GENERATION (Module 1)
    // ========================================================================

    async generatePersonalityThesis(
        userId: string,
        snapshotId: string,
        blueprint: Blueprint | null,
        traits: TraitProbability[],
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[]
    ): Promise<PersonalityThesis | null> {
        if (!this.client) return null;

        // Check credits before generating
        const creditCheck = await aiCreditsService.canGenerate(userId, 'personal_thesis');
        if (!creditCheck.allowed) {
            console.log(`[AIIntelligence] User ${userId} cannot generate thesis: ${creditCheck.reason}`);
            return null;
        }

        console.log(`[AIIntelligence] Generating Personality Thesis for user ${userId}...`);

        // Build the comprehensive context
        const traitContext = this.buildTraitContext(traits);
        const claimContext = this.buildClaimContext(claims);
        const patternContext = this.buildPatternContext(patterns);
        const blueprintContext = blueprint ? this.buildBlueprintContext(blueprint) : '';


        const systemPrompt = `You are the world's most gifted psychological writer and depth analyst. You write with the precision of Carl Jung, the insight of Karen Horney, and the eloquence of Alain de Botton. Your output is worth thousands of dollars because it transforms how people understand themselves.

CRITICAL QUALITY STANDARDS:
- Write in flowing, eloquent prose — NOT bullet points or templates
- Every sentence must reveal genuine psychological insight
- Be SPECIFIC to this individual — generic statements are unacceptable
- Write as if you've spent months studying this person
- Your analysis should feel like a profound mirror, not a horoscope
- Quality must justify a $500+ premium product

STRUCTURAL REQUIREMENTS:
Each section must be 400-600 words of premium, flowing prose.
Do NOT use bullet points in the narrative sections.
Do NOT use generic phrases like "you are a complex individual"
Every insight must connect to specific patterns in their data.`;

        const userPrompt = `Generate a PREMIUM Personality Thesis for this individual. This must be publication-quality psychological analysis that transforms self-understanding.

=== PSYCHOLOGICAL DATA ===

${traitContext}

${claimContext}

${patternContext}

${blueprintContext}

=== REQUIRED SECTIONS ===

Generate a JSON object with exactly 7 sections. Each section must have rich, flowing prose (400-600 words):

1. "foundational_overview" — The individual's core personality architecture. Write this as a profound character study — their essential nature, how they move through the world, what drives them at the deepest level. This should read like the opening of a literary biography.

2. "cognitive_emotional_blueprint" — Deep analysis of how their mind processes information and how they experience emotion. Explore the interplay between their thinking style and feeling nature. Discuss their unique cognitive gifts and emotional intelligence patterns.

3. "core_strengths" — NOT a bullet list. Write flowing prose about their 4-5 most significant capacities. For each strength, describe: what it is, how it manifests in their life, why it's valuable, and how it connects to their core nature. Name each strength with a compelling title embedded in the prose.

4. "friction_zones" — Their shadow patterns and growth edges. Write with compassion but honesty about where they struggle. These are NOT weaknesses to fix but tensions to understand. Explore the deeper psychology behind each friction pattern.

5. "behavioral_relational" — How they show up in work, in relationships, in daily life. Their behavioral rhythms, social patterns, professional expression. How others experience them. Their relationship to leadership, collaboration, and solitude.

6. "growth_trajectories" — 4-5 developmental themes for their evolution. NOT generic advice. Specific, personalized growth paths that emerge from their unique configuration. What would it look like for this person to become their most integrated self?

7. "closing_reflection" — A profound synthesis. Who is this person at their essence? What is their life's work? What gift do they bring to the world? End with a statement that encapsulates their archetypal nature.

=== OUTPUT FORMAT ===

Return ONLY valid JSON in this exact structure:
{
  "sections": [
    {
      "sectionType": "foundational_overview",
      "title": "Foundational Overview",
      "content": "...(400-600 words of flowing prose)...",
      "wordCount": (number)
    },
    ...
  ],
  "totalWordCount": (number),
  "patternCount": ${patterns.length},
  "themeCount": ${themes.length},
  "stabilityIndex": 0.85
}

REMEMBER: This is a BILLION-DOLLAR product. Write accordingly.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 8000,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            // Parse the JSON response
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('[AIIntelligence] Could not extract JSON from response');
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Build the PersonalityThesis object matching the interface
            const thesis: PersonalityThesis = {
                userId,
                snapshotId,
                generatedAt: new Date().toISOString(),
                sections: parsed.sections.map((s: any): ModuleSection => ({
                    sectionType: s.sectionType as ThesisSectionType,
                    content: s.content,
                    sourceClaimIds: claims.slice(0, 5).map(c => c.claimId),
                    sourcePatternIds: patterns.slice(0, 3).map(p => p.patternId),
                    sourceThemeIds: themes.slice(0, 2).map(t => t.themeId),
                    wordCount: s.wordCount || s.content.split(/\s+/).length
                })),
                totalWordCount: parsed.totalWordCount || parsed.sections.reduce((sum: number, s: any) => sum + (s.wordCount || s.content.split(/\s+/).length), 0),
                patternCount: patterns.length,
                themeCount: themes.length,
                stabilityIndex: parsed.stabilityIndex || 0.85
            };


            console.log(`[AIIntelligence] Generated thesis with ${thesis.totalWordCount} words`);

            // Deduct credits after successful generation
            await aiCreditsService.deductCredits(userId, 'personal_thesis', { snapshotId });

            return thesis;

        } catch (error: any) {
            console.error('[AIIntelligence] Thesis generation error:', error.message);
            return null;
        }
    }


    // ========================================================================
    // CORE INSIGHTS HUB GENERATION (Module 2)
    // ========================================================================

    async generateCoreInsightsHub(
        userId: string,
        snapshotId: string,
        blueprint: Blueprint | null,
        traits: TraitProbability[],
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[]
    ): Promise<CoreInsightsHub | null> {
        if (!this.client) return null;

        // Check credits before generating
        const creditCheck = await aiCreditsService.canGenerate(userId, 'core_insights');
        if (!creditCheck.allowed) {
            console.log(`[AIIntelligence] User ${userId} cannot generate insights: ${creditCheck.reason}`);
            return null;
        }

        console.log(`[AIIntelligence] Generating Core Insights Hub for user ${userId}...`);

        const traitContext = this.buildTraitContext(traits);
        const claimContext = this.buildClaimContext(claims);
        const patternContext = this.buildPatternContext(patterns);


        const systemPrompt = `You are an elite life strategist and depth psychologist. Your role is to identify THE most impactful single action ("The One Thing") for each life domain that, if maintained, makes all other improvements easier or unnecessary.

Your insights must be:
- Deeply personalized to this specific individual's psychology
- Actionable yet profound
- Written with elegant precision
- Worth the price of premium coaching

Each domain insight should include:
1. Core Theme — The essential pattern in this domain
2. Primary Challenge — What blocks them specifically
3. The One Thing — A single, specific practice (formatted as a quote)
4. Applied Outcome — What changes when they do this`;

        const userPrompt = `Generate a PREMIUM Core Insights Hub for this individual across 7 life domains.

=== PSYCHOLOGICAL DATA ===

${traitContext}

${claimContext}

${patternContext}

=== REQUIRED DOMAINS ===

Generate insights for these 7 life domains (use exact domain names):
1. "spiritual" — Their inner life, meaning-making, stillness practice
2. "physical" — Health, energy, body-mind connection
3. "personal" — Self-development, daily rhythms, personal growth
4. "relationships" — Key connections, intimacy, family
5. "career" — Work expression, leadership, professional identity
6. "business" — Entrepreneurship, strategy, innovation
7. "financial" — Resource relationship, abundance patterns

=== OUTPUT FORMAT ===

Return ONLY valid JSON:
{
  "domainInsights": [
    {
      "domain": "spiritual",
      "coreTheme": "...(one powerful sentence)...",
      "primaryChallenge": "...(specific to them)...",
      "oneThing": "...(specific daily/weekly practice as a quote)...",
      "appliedOutcome": "...(what transforms when they do this)...",
      "sourceLayerIds": [1, 2],
      "sourcePatternsIds": []
    },
    ... (for all 7 domains)
  ],
  "primaryFocusDomain": "career"
}

Make every insight feel like it was written by someone who truly knows them.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 6000,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Build matching the CoreInsightsHub interface
            const hub: CoreInsightsHub = {
                userId,
                snapshotId,
                generatedAt: new Date().toISOString(),
                domainInsights: parsed.domainInsights.map((d: any): DomainInsight => ({
                    domain: d.domain as LifeDomain,
                    coreTheme: d.coreTheme,
                    primaryChallenge: d.primaryChallenge,
                    oneThing: d.oneThing,
                    appliedOutcome: d.appliedOutcome,
                    sourceLayerIds: d.sourceLayerIds || [],
                    sourcePatternsIds: d.sourcePatternsIds || []
                })),
                primaryFocusDomain: parsed.primaryFocusDomain as LifeDomain || 'career',
                coverageScore: parsed.domainInsights.length / 7
            };

            console.log(`[AIIntelligence] Generated insights for ${hub.domainInsights.length} domains`);

            // Deduct credits after successful generation
            await aiCreditsService.deductCredits(userId, 'core_insights', { snapshotId });

            return hub;

        } catch (error: any) {
            console.error('[AIIntelligence] Insights generation error:', error.message);
            return null;
        }
    }


    // ========================================================================
    // RELATIONAL CONNECTORS GENERATION (Module 3)
    // ========================================================================

    async generateRelationalConnectors(
        userId: string,
        snapshotId: string,
        blueprint: Blueprint | null,
        traits: TraitProbability[],
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[]
    ): Promise<RelationalConnectorsProfile | null> {
        if (!this.client) return null;

        // Check credits before generating
        const creditCheck = await aiCreditsService.canGenerate(userId, 'relational_analysis');
        if (!creditCheck.allowed) {
            console.log(`[AIIntelligence] User ${userId} cannot generate connectors: ${creditCheck.reason}`);
            return null;
        }

        console.log(`[AIIntelligence] Generating Relational Connectors for user ${userId}...`);

        const traitContext = this.buildTraitContext(traits);
        const claimContext = this.buildClaimContext(claims);
        const patternContext = this.buildPatternContext(patterns);


        const systemPrompt = `You are an expert in relational psychology and attachment dynamics. Your analysis reveals how this individual's core personality shapes their connections across different relationship types.

Write with warmth, precision, and psychological depth. Every insight must feel personally relevant, not generic advice about relationships.`;

        const userPrompt = `Generate a PREMIUM Relational Connectors Profile analyzing how this individual connects in different relationship types.

=== PSYCHOLOGICAL DATA ===

${traitContext}

${claimContext}

${patternContext}

=== RELATIONSHIP TYPES TO ANALYZE ===
Use these exact relationship type values: spouse_partner, parent_child, family_member, friend, colleague_team, mentor_student

=== OUTPUT FORMAT ===

Return ONLY valid JSON:
{
  "connectorInsights": [
    {
      "relationshipType": "spouse_partner",
      "displayName": "Romantic Partnership",
      "interpretationFocus": "...(what matters most in this relationship type for them)...",
      "primaryPatterns": [
        {
          "patternName": "...(name of pattern)...",
          "interpretation": "...(how this pattern shows up in this relationship type)..."
        }
      ],
      "suggestedPractice": {
        "practice": "...(one specific practice)...",
        "duration": "...(how often)...",
        "outcome": "...(what changes)..."
      }
    },
    ... (for each relationship type)
  ],
  "primaryRelationshipFocus": "spouse_partner"
}`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 5000,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Build matching the RelationalConnectorsProfile interface
            const profile: RelationalConnectorsProfile = {
                userId,
                snapshotId,
                generatedAt: new Date().toISOString(),
                connectorInsights: parsed.connectorInsights.map((c: any): RelationalConnectorInsight => ({
                    relationshipType: c.relationshipType,
                    displayName: c.displayName,
                    interpretationFocus: c.interpretationFocus,
                    primaryPatterns: c.primaryPatterns || [],
                    suggestedPractice: c.suggestedPractice
                })),
                primaryRelationshipFocus: parsed.primaryRelationshipFocus
            };

            console.log(`[AIIntelligence] Generated ${profile.connectorInsights.length} connector insights`);

            // Deduct credits after successful generation
            await aiCreditsService.deductCredits(userId, 'relational_analysis', { snapshotId });

            return profile;

        } catch (error: any) {
            console.error('[AIIntelligence] Connectors generation error:', error.message);
            return null;
        }
    }


    // ========================================================================
    // CONTEXT BUILDING HELPERS
    // ========================================================================

    private buildTraitContext(traits: TraitProbability[]): string {
        if (!traits || traits.length === 0) return 'No trait data available.';

        const lines = traits.map(t => {
            const layerName = this.getLayerName(t.layerId);
            return `LAYER ${t.layerId} (${layerName}):
${t.description}
Confidence: ${Math.round(t.confidence * 100)}%`;
        });

        return `=== PERSONALITY LAYERS (15-Layer Deep Profile) ===\n\n${lines.join('\n\n---\n\n')}`;
    }

    private buildClaimContext(claims: Claim[]): string {
        if (!claims || claims.length === 0) return '';

        const byPolarity = {
            strength: claims.filter(c => c.polarity === 'strength'),
            friction: claims.filter(c => c.polarity === 'friction'),
            neutral: claims.filter(c => c.polarity === 'neutral')
        };

        let context = '=== VERIFIED CLAIMS ===\n\n';

        if (byPolarity.strength.length > 0) {
            context += 'STRENGTHS:\n';
            byPolarity.strength.forEach(c => {
                context += `• Layer ${c.layerId}: ${c.text}\n`;
            });
            context += '\n';
        }

        if (byPolarity.friction.length > 0) {
            context += 'FRICTION ZONES:\n';
            byPolarity.friction.forEach(c => {
                context += `• Layer ${c.layerId}: ${c.text}\n`;
            });
            context += '\n';
        }

        if (byPolarity.neutral.length > 0) {
            context += 'PATTERNS:\n';
            byPolarity.neutral.forEach(c => {
                context += `• Layer ${c.layerId}: ${c.text}\n`;
            });
        }

        return context;
    }

    private buildPatternContext(patterns: Pattern[]): string {
        if (!patterns || patterns.length === 0) return '';

        let context = '=== DETECTED PATTERNS ===\n\n';
        patterns.forEach(p => {
            context += `${p.name}: ${p.oneLiner}\n`;
            if (p.growthEdges && p.growthEdges.length > 0) {
                context += `  Growth edges: ${p.growthEdges.join(', ')}\n`;
            }
        });

        return context;
    }

    private buildBlueprintContext(blueprint: Blueprint): string {
        if (!blueprint) return '';

        let context = '=== FOUNDATIONAL BLUEPRINT ===\n\n';

        // Blueprint may have different field names - check what's available
        const bp = blueprint as any;
        if (bp.sunSign || bp.sun) {
            context += `Solar Expression: ${bp.sunSign || bp.sun}\n`;
        }
        if (bp.moonSign || bp.moon) {
            context += `Emotional Core: ${bp.moonSign || bp.moon}\n`;
        }
        if (bp.risingSign || bp.rising || bp.ascendant) {
            context += `External Presentation: ${bp.risingSign || bp.rising || bp.ascendant}\n`;
        }

        return context;
    }

    private getLayerName(layerId: number): string {
        const names: Record<number, string> = {
            1: 'Core Disposition',
            2: 'Energy Orientation',
            3: 'Cognitive Method',
            4: 'Internal Foundation',
            5: 'Creative Expression',
            6: 'Operational Rhythm',
            7: 'Relational Stance',
            8: 'Transformative Potential',
            9: 'Expansive Orientation',
            10: 'Architectural Focus',
            11: 'Social Resonance',
            12: 'Integrative Depth',
            13: 'Navigational Interface',
            14: 'Evolutionary Trajectory',
            15: 'Systemic Integration'
        };
        return names[layerId] || `Layer ${layerId}`;
    }

    private getSectionTitle(sectionType: string): string {
        const titles: Record<string, string> = {
            'foundational_overview': 'Foundational Overview',
            'cognitive_emotional_blueprint': 'Cognitive & Emotional Blueprint',
            'core_strengths': 'Core Strengths & Capacities',
            'friction_zones': 'Friction Zones & Shadow Patterns',
            'behavioral_relational': 'Behavioral & Relational Expression',
            'growth_trajectories': 'Growth Trajectories & Development Themes',
            'closing_reflection': 'Closing Reflection'
        };
        return titles[sectionType] || sectionType;
    }
}

export const aiIntelligenceService = new AIIntelligenceService();
