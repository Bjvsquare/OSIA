/**
 * Compatibility Service — v1.0
 * 
 * Compares two users' OSIA snapshots to calculate compatibility scores
 * and generate relational insights.
 * 
 * Features:
 * - Fast, free compatibility scoring (no AI)
 * - AI-powered deep analysis (costs credits)
 * - Pattern matching between users
 * - Strength/challenge mapping
 */

import { db } from '../db/JsonDb';
import { Claim, Pattern, Theme } from '../types/osia-types';
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { aiCreditsService } from './AICreditsService';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface CompatibilityScore {
    userId1: string;
    userId2: string;
    overallScore: number; // 0-100
    patternAlignment: number; // 0-100
    themeResonance: number; // 0-100
    claimComplementarity: number; // 0-100
    calculatedAt: string;
    breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
    category: string;
    score: number;
    details: string;
}

export interface DeepCompatibilityAnalysis {
    userId1: string;
    userId2: string;
    generatedAt: string;
    relationshipStrengths: RelationalStrength[];
    potentialChallenges: RelationalChallenge[];
    growthOpportunities: string[];
    communicationStyle: string;
    conflictPatterns: string;
    synergyAreas: string[];
    overallNarrative: string;
}

export interface RelationalStrength {
    name: string;
    description: string;
    sourcePatterns: string[];
}

export interface RelationalChallenge {
    name: string;
    description: string;
    mitigationStrategy: string;
}

// ============================================================================
// COMPATIBILITY SERVICE
// ============================================================================

class CompatibilityService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
        }
    }

    /**
     * Calculate fast compatibility score (no AI, free)
     */
    async calculateQuickScore(userId1: string, userId2: string): Promise<CompatibilityScore | null> {
        console.log(`[Compatibility] Calculating quick score: ${userId1} <-> ${userId2}`);

        const snapshot1 = await osiaSnapshotStore.getLatestSnapshot(userId1);
        const snapshot2 = await osiaSnapshotStore.getLatestSnapshot(userId2);

        if (!snapshot1 || !snapshot2) {
            console.log('[Compatibility] Missing snapshot for one or both users');
            return null;
        }

        const claims1 = snapshot1.claims;
        const claims2 = snapshot2.claims;
        const patterns1 = snapshot1.patterns;
        const patterns2 = snapshot2.patterns;
        const themes1 = snapshot1.themes;
        const themes2 = snapshot2.themes;

        // Calculate pattern alignment (similar patterns = good match)
        const patternAlignment = this.calculatePatternAlignment(patterns1, patterns2);

        // Calculate theme resonance (overlapping themes)
        const themeResonance = this.calculateThemeResonance(themes1, themes2);

        // Calculate claim complementarity (strengths complement weaknesses)
        const claimComplementarity = this.calculateClaimComplementarity(claims1, claims2);

        // Weighted overall score
        const overallScore = Math.round(
            patternAlignment * 0.35 +
            themeResonance * 0.35 +
            claimComplementarity * 0.30
        );

        const score: CompatibilityScore = {
            userId1,
            userId2,
            overallScore,
            patternAlignment,
            themeResonance,
            claimComplementarity,
            calculatedAt: new Date().toISOString(),
            breakdown: [
                {
                    category: 'Pattern Alignment',
                    score: patternAlignment,
                    details: 'How well your behavioral patterns complement each other'
                },
                {
                    category: 'Theme Resonance',
                    score: themeResonance,
                    details: 'Shared values and life themes'
                },
                {
                    category: 'Complementarity',
                    score: claimComplementarity,
                    details: 'How your strengths balance each other\'s growth areas'
                }
            ]
        };

        // Store the score
        await this.storeScore(score);

        console.log(`[Compatibility] Quick score: ${overallScore}%`);
        return score;
    }

    /**
     * Generate deep AI analysis (costs credits)
     */
    async generateDeepAnalysis(
        requestingUserId: string,
        userId1: string,
        userId2: string
    ): Promise<DeepCompatibilityAnalysis | null> {
        if (!this.anthropic) {
            console.log('[Compatibility] AI not available for deep analysis');
            return null;
        }

        // Check credits
        const creditCheck = await aiCreditsService.canGenerate(requestingUserId, 'relational_analysis');
        if (!creditCheck.allowed) {
            console.log(`[Compatibility] Insufficient credits for user ${requestingUserId}`);
            return null;
        }

        console.log(`[Compatibility] Generating deep analysis: ${userId1} <-> ${userId2}`);

        const snapshot1 = await osiaSnapshotStore.getLatestSnapshot(userId1);
        const snapshot2 = await osiaSnapshotStore.getLatestSnapshot(userId2);

        if (!snapshot1 || !snapshot2) return null;

        // Build context for AI
        const user1Context = this.buildUserContext(snapshot1.claims, snapshot1.patterns, snapshot1.themes, 'Person A');
        const user2Context = this.buildUserContext(snapshot2.claims, snapshot2.patterns, snapshot2.themes, 'Person B');

        const systemPrompt = `You are an expert relational psychologist who analyzes compatibility between two individuals based on their psychological profiles. Your insights are profound, specific, and actionable.`;

        const userPrompt = `Analyze the relational compatibility between these two individuals:

${user1Context}

---

${user2Context}

---

Generate a comprehensive compatibility analysis in JSON format:
{
    "relationshipStrengths": [
        {
            "name": "...",
            "description": "...(specific to these two people)...",
            "sourcePatterns": ["pattern from A", "pattern from B"]
        }
    ],
    "potentialChallenges": [
        {
            "name": "...",
            "description": "...(specific friction point)...",
            "mitigationStrategy": "...(how they can navigate this)..."
        }
    ],
    "growthOpportunities": ["...opportunity 1...", "...opportunity 2..."],
    "communicationStyle": "...(how they naturally communicate together)...",
    "conflictPatterns": "...(how conflicts might emerge and resolve)...",
    "synergyAreas": ["...area 1...", "...area 2..."],
    "overallNarrative": "...(2-3 paragraphs summarizing this relationship's potential)..."
}`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                messages: [{ role: 'user', content: userPrompt }],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Deduct credits
            await aiCreditsService.deductCredits(requestingUserId, 'relational_analysis', {
                targetUserId: userId1 === requestingUserId ? userId2 : userId1
            });

            const analysis: DeepCompatibilityAnalysis = {
                userId1,
                userId2,
                generatedAt: new Date().toISOString(),
                ...parsed
            };

            console.log(`[Compatibility] Deep analysis generated for ${userId1} <-> ${userId2}`);
            return analysis;

        } catch (error: any) {
            console.error('[Compatibility] Deep analysis error:', error.message);
            return null;
        }
    }

    // ========================================================================
    // SCORING ALGORITHMS
    // ========================================================================

    private calculatePatternAlignment(patterns1: readonly Pattern[], patterns2: readonly Pattern[]): number {
        if (patterns1.length === 0 || patterns2.length === 0) return 50;

        const patternTypes1 = new Set(patterns1.map(p => p.patternId));
        const patternTypes2 = new Set(patterns2.map(p => p.patternId));

        // Calculate Jaccard similarity
        const intersection = new Set([...patternTypes1].filter(x => patternTypes2.has(x)));
        const union = new Set([...patternTypes1, ...patternTypes2]);

        const similarity = intersection.size / union.size;

        // Also consider stability alignment
        const avgStability1 = patterns1.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns1.length;
        const avgStability2 = patterns2.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns2.length;
        const stabilityMatch = 1 - Math.abs(avgStability1 - avgStability2);

        return Math.round((similarity * 0.6 + stabilityMatch * 0.4) * 100);
    }

    private calculateThemeResonance(themes1: readonly Theme[], themes2: readonly Theme[]): number {
        if (themes1.length === 0 || themes2.length === 0) return 50;

        const themeIdentifiers1 = new Set(themes1.map(t => t.themeId));
        const themeIdentifiers2 = new Set(themes2.map(t => t.themeId));

        const intersection = new Set([...themeIdentifiers1].filter(x => themeIdentifiers2.has(x)));
        const union = new Set([...themeIdentifiers1, ...themeIdentifiers2]);

        return Math.round((intersection.size / union.size) * 100);
    }

    private calculateClaimComplementarity(claims1: readonly Claim[], claims2: readonly Claim[]): number {
        if (claims1.length === 0 || claims2.length === 0) return 50;

        // Find strengths in one that match friction in other
        const strengths1 = claims1.filter(c => c.polarity === 'strength');
        const friction1 = claims1.filter(c => c.polarity === 'friction');
        const strengths2 = claims2.filter(c => c.polarity === 'strength');
        const friction2 = claims2.filter(c => c.polarity === 'friction');

        // Count layer overlaps (strength in one matches friction layer in other)
        let complementaryCount = 0;
        const strengthLayers1 = new Set(strengths1.map(c => c.layerId));
        const frictionLayers2 = new Set(friction2.map(c => c.layerId));
        const strengthLayers2 = new Set(strengths2.map(c => c.layerId));
        const frictionLayers1 = new Set(friction1.map(c => c.layerId));

        // Person 1's strengths cover Person 2's friction
        [...strengthLayers1].forEach(layer => {
            if (frictionLayers2.has(layer)) complementaryCount++;
        });

        // Person 2's strengths cover Person 1's friction
        [...strengthLayers2].forEach(layer => {
            if (frictionLayers1.has(layer)) complementaryCount++;
        });

        const maxPossible = Math.max(frictionLayers1.size + frictionLayers2.size, 1);
        return Math.min(100, Math.round((complementaryCount / maxPossible) * 100) + 50);
    }

    private buildUserContext(claims: readonly Claim[], patterns: readonly Pattern[], themes: readonly Theme[], label: string): string {
        let context = `=== ${label} ===\n\n`;

        if (patterns.length > 0) {
            context += 'PATTERNS:\n';
            patterns.forEach(p => {
                context += `- ${p.name}: ${p.oneLiner}\n`;
            });
            context += '\n';
        }

        if (themes.length > 0) {
            context += 'THEMES:\n';
            themes.forEach(t => {
                context += `- ${t.name}: ${t.summary}\n`;
            });
            context += '\n';
        }

        const strengths = claims.filter(c => c.polarity === 'strength');
        if (strengths.length > 0) {
            context += 'STRENGTHS:\n';
            strengths.forEach(c => context += `- ${c.text}\n`);
            context += '\n';
        }

        const frictions = claims.filter(c => c.polarity === 'friction');
        if (frictions.length > 0) {
            context += 'GROWTH AREAS:\n';
            frictions.forEach(c => context += `- ${c.text}\n`);
        }

        return context;
    }

    private async storeScore(score: CompatibilityScore): Promise<void> {
        try {
            const allScores = await db.getCollection<CompatibilityScore>('compatibility_scores');

            // Remove existing score for this pair
            const filtered = allScores.filter(
                s => !((s.userId1 === score.userId1 && s.userId2 === score.userId2) ||
                    (s.userId1 === score.userId2 && s.userId2 === score.userId1))
            );

            filtered.push(score);
            await db.saveCollection('compatibility_scores', filtered);
        } catch (e: any) {
            console.error('[Compatibility] Failed to store score:', e.message);
        }
    }

    /**
     * Get stored compatibility score
     */
    async getStoredScore(userId1: string, userId2: string): Promise<CompatibilityScore | null> {
        const allScores = await db.getCollection<CompatibilityScore>('compatibility_scores');

        return allScores.find(
            s => (s.userId1 === userId1 && s.userId2 === userId2) ||
                (s.userId1 === userId2 && s.userId2 === userId1)
        ) || null;
    }
}

export const compatibilityService = new CompatibilityService();
