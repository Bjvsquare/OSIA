/**
 * Nudges Service — v1.0
 * 
 * Generates personalized behavioral nudges based on OSIA data.
 * Nudges are micro-suggestions that help users leverage their patterns
 * and address friction areas throughout their day.
 * 
 * Features:
 * - Daily nudges based on claims and patterns
 * - Contextual nudges (morning, work, relationships)
 * - AI-enhanced nudge generation (optional, costs credits)
 */

import { db } from '../db/JsonDb';
import { Claim, Pattern, Theme } from '../types/osia-types';
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { aiCreditsService } from './AICreditsService';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export type NudgeContext = 'morning' | 'work' | 'relationship' | 'stress' | 'growth' | 'general';
export type NudgePriority = 'low' | 'medium' | 'high';

export interface Nudge {
    id: string;
    userId: string;
    text: string;
    context: NudgeContext;
    priority: NudgePriority;
    sourcePatternId?: string;
    sourceClaimId?: string;
    actionSuggestion?: string;
    createdAt: string;
    expiresAt?: string;
    dismissed?: boolean;
    completed?: boolean;
}

export interface DailyNudges {
    userId: string;
    date: string;
    nudges: Nudge[];
    refreshCount: number;
}

// ============================================================================
// NUDGE TEMPLATES
// ============================================================================

const NUDGE_TEMPLATES: Record<string, { text: string; context: NudgeContext; action?: string }[]> = {
    // Pattern-based nudges
    'pattern.strength': [
        { text: 'Your {patternName} gives you a natural edge today. Lean into it.', context: 'morning', action: 'Find one opportunity to use this strength' },
        { text: 'When facing challenges, remember your {patternName} — it\'s your superpower.', context: 'work' },
    ],
    'pattern.friction': [
        { text: 'Today, be gentle with your {patternName}. Small progress counts.', context: 'morning', action: 'Set a micro-goal for this area' },
        { text: 'Notice when {patternName} feels harder — that\'s awareness, not failure.', context: 'general' },
    ],

    // Claim-based nudges
    'claim.strength': [
        { text: 'Your strength in {layerName}: "{claimText}" — use it intentionally today.', context: 'work' },
        { text: 'Someone could benefit from your {layerName} strength today. Look for the moment.', context: 'relationship' },
    ],
    'claim.friction': [
        { text: 'Remember: {layerName} is a growth area. One small step forward is enough.', context: 'morning' },
        { text: 'When you feel friction in {layerName}, pause. Breathe. Choose consciously.', context: 'stress' },
    ],

    // General growth nudges
    'growth': [
        { text: 'Check in with yourself: What pattern is showing up strongest right now?', context: 'general', action: 'Journal for 2 minutes' },
        { text: 'Your patterns aren\'t fixed — they\'re tendencies. Today, experiment.', context: 'growth' },
        { text: 'One insight acted upon beats ten insights ignored. Pick one thing.', context: 'morning', action: 'Choose one focus for today' },
    ],
};

const LAYER_NAMES: Record<number, string> = {
    1: 'Core Disposition',
    2: 'Energy Management',
    3: 'Cognitive Processing',
    4: 'Emotional Foundation',
    5: 'Creative Expression',
    6: 'Operational Style',
    7: 'Relational Dynamics'
};

// ============================================================================
// NUDGES SERVICE
// ============================================================================

class NudgesService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
        }
    }

    /**
     * Generate daily nudges for a user (no AI, free)
     */
    async generateDailyNudges(userId: string): Promise<DailyNudges> {
        console.log(`[Nudges] Generating daily nudges for user ${userId}`);

        const today = new Date().toISOString().split('T')[0];

        // Check if we already have today's nudges
        const existing = await this.getTodaysNudges(userId);
        if (existing && existing.nudges.length > 0) {
            return existing;
        }

        const snapshot = await osiaSnapshotStore.getLatestSnapshot(userId);
        if (!snapshot) {
            // Return generic growth nudges if no OSIA data
            return this.createGenericNudges(userId, today);
        }

        const nudges: Nudge[] = [];
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Generate pattern-based nudges (2-3)
        const shuffledPatterns = [...snapshot.patterns].sort(() => Math.random() - 0.5);
        for (const pattern of shuffledPatterns.slice(0, 2)) {
            const templates = pattern.stabilityIndex > 0.7
                ? NUDGE_TEMPLATES['pattern.strength']
                : NUDGE_TEMPLATES['pattern.friction'];

            const template = templates[Math.floor(Math.random() * templates.length)];
            nudges.push({
                id: `nudge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                userId,
                text: template.text.replace('{patternName}', pattern.name),
                context: template.context,
                priority: pattern.stabilityIndex > 0.8 ? 'high' : 'medium',
                sourcePatternId: pattern.patternId,
                actionSuggestion: template.action,
                createdAt: now,
                expiresAt
            });
        }

        // Generate claim-based nudges (2-3)
        const strengthClaims = snapshot.claims.filter(c => c.polarity === 'strength');
        const frictionClaims = snapshot.claims.filter(c => c.polarity === 'friction');

        if (strengthClaims.length > 0) {
            const claim = strengthClaims[Math.floor(Math.random() * strengthClaims.length)];
            const template = NUDGE_TEMPLATES['claim.strength'][Math.floor(Math.random() * NUDGE_TEMPLATES['claim.strength'].length)];
            nudges.push({
                id: `nudge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                userId,
                text: template.text
                    .replace('{layerName}', LAYER_NAMES[claim.layerId] || 'this area')
                    .replace('{claimText}', claim.text.slice(0, 50)),
                context: template.context,
                priority: 'medium',
                sourceClaimId: claim.claimId,
                createdAt: now,
                expiresAt
            });
        }

        if (frictionClaims.length > 0) {
            const claim = frictionClaims[Math.floor(Math.random() * frictionClaims.length)];
            const template = NUDGE_TEMPLATES['claim.friction'][Math.floor(Math.random() * NUDGE_TEMPLATES['claim.friction'].length)];
            nudges.push({
                id: `nudge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                userId,
                text: template.text.replace('{layerName}', LAYER_NAMES[claim.layerId] || 'this area'),
                context: template.context,
                priority: 'low',
                sourceClaimId: claim.claimId,
                actionSuggestion: template.action,
                createdAt: now,
                expiresAt
            });
        }

        // Add one growth nudge
        const growthTemplate = NUDGE_TEMPLATES['growth'][Math.floor(Math.random() * NUDGE_TEMPLATES['growth'].length)];
        nudges.push({
            id: `nudge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            userId,
            text: growthTemplate.text,
            context: growthTemplate.context,
            priority: 'low',
            actionSuggestion: growthTemplate.action,
            createdAt: now,
            expiresAt
        });

        const dailyNudges: DailyNudges = {
            userId,
            date: today,
            nudges,
            refreshCount: 0
        };

        await this.storeDailyNudges(dailyNudges);
        console.log(`[Nudges] Generated ${nudges.length} nudges for user ${userId}`);
        return dailyNudges;
    }

    /**
     * Get AI-enhanced personalized nudge (costs 1 credit)
     */
    async getAINudge(
        userId: string,
        context?: NudgeContext
    ): Promise<Nudge | null> {
        if (!this.anthropic) return null;

        // AI nudges cost 1 credit (minimal)
        const creditCheck = await aiCreditsService.canGenerate(userId, 'personal_thesis'); // Use minimal type
        if (!creditCheck.allowed) {
            console.log('[Nudges] No credits for AI nudge');
            return null;
        }

        const snapshot = await osiaSnapshotStore.getLatestSnapshot(userId);
        if (!snapshot) return null;

        const patternContext = snapshot.patterns
            .slice(0, 3)
            .map(p => `${p.name}: ${p.oneLiner}`)
            .join('\n');

        const claimContext = snapshot.claims
            .slice(0, 5)
            .map(c => `[${c.polarity}] ${c.text}`)
            .join('\n');

        const prompt = `Based on this person's psychological profile, generate ONE short, powerful nudge for their ${context || 'day'}.

Patterns:
${patternContext}

Insights:
${claimContext}

Generate a nudge in JSON format:
{
    "text": "...(max 100 chars, personal, actionable)...",
    "actionSuggestion": "...(optional, max 50 chars)..."
}`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }],
                system: 'You create concise, personal psychological nudges. Be warm, specific, actionable.'
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Minimal credit deduction for AI nudge
            // Could implement a separate "ai_nudge" type with cost 1

            const nudge: Nudge = {
                id: `nudge-ai-${Date.now()}`,
                userId,
                text: parsed.text,
                context: context || 'general',
                priority: 'high',
                actionSuggestion: parsed.actionSuggestion,
                createdAt: new Date().toISOString()
            };

            return nudge;

        } catch (error: any) {
            console.error('[Nudges] AI nudge error:', error.message);
            return null;
        }
    }

    /**
     * Dismiss a nudge
     */
    async dismissNudge(userId: string, nudgeId: string): Promise<boolean> {
        const daily = await this.getTodaysNudges(userId);
        if (!daily) return false;

        const nudge = daily.nudges.find(n => n.id === nudgeId);
        if (nudge) {
            nudge.dismissed = true;
            await this.storeDailyNudges(daily);
            return true;
        }
        return false;
    }

    /**
     * Mark nudge as completed
     */
    async completeNudge(userId: string, nudgeId: string): Promise<boolean> {
        const daily = await this.getTodaysNudges(userId);
        if (!daily) return false;

        const nudge = daily.nudges.find(n => n.id === nudgeId);
        if (nudge) {
            nudge.completed = true;
            await this.storeDailyNudges(daily);
            return true;
        }
        return false;
    }

    /**
     * Get active (non-dismissed, non-expired) nudges
     */
    async getActiveNudges(userId: string): Promise<Nudge[]> {
        const daily = await this.generateDailyNudges(userId);
        const now = new Date();

        return daily.nudges.filter(n =>
            !n.dismissed &&
            !n.completed &&
            (!n.expiresAt || new Date(n.expiresAt) > now)
        );
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private createGenericNudges(userId: string, date: string): DailyNudges {
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        return {
            userId,
            date,
            nudges: NUDGE_TEMPLATES['growth'].map((t, i) => ({
                id: `nudge-generic-${Date.now()}-${i}`,
                userId,
                text: t.text,
                context: t.context,
                priority: 'low' as NudgePriority,
                actionSuggestion: t.action,
                createdAt: now,
                expiresAt
            })),
            refreshCount: 0
        };
    }

    private async getTodaysNudges(userId: string): Promise<DailyNudges | null> {
        const today = new Date().toISOString().split('T')[0];
        try {
            const all = await db.getCollection<DailyNudges>('daily_nudges');
            return all.find(d => d.userId === userId && d.date === today) || null;
        } catch {
            return null;
        }
    }

    private async storeDailyNudges(daily: DailyNudges): Promise<void> {
        try {
            const all = await db.getCollection<DailyNudges>('daily_nudges');
            const filtered = all.filter(d => !(d.userId === daily.userId && d.date === daily.date));
            filtered.push(daily);
            // Keep only last 7 days
            const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const cleaned = filtered.filter(d => d.date >= cutoff);
            await db.saveCollection('daily_nudges', cleaned);
        } catch (e: any) {
            console.error('[Nudges] Store error:', e.message);
        }
    }
}

export const nudgesService = new NudgesService();
