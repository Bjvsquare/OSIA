/**
 * AI Credits Service — v1.0
 * 
 * Manages AI generation credits for users.
 * Controls API costs by limiting AI usage based on subscription tier.
 * 
 * Credit Costs:
 * - Initial Blueprint Generation: FREE (1 per user)
 * - Regenerate Personal Thesis: 5 credits
 * - Generate Relational Analysis: 3 credits per comparison
 * - Generate Team Dynamics Report: 10 credits
 * - Generate Org Culture Map: 25 credits
 */

import { db } from '../db/JsonDb';

// ============================================================================
// TYPES
// ============================================================================

export type AIGenerationType =
    | 'personal_thesis'
    | 'core_insights'
    | 'relational_analysis'
    | 'team_dynamics'
    | 'org_culture';

export interface UserCredits {
    userId: string;
    totalCredits: number;
    usedCredits: number;
    freeGenerationUsed: boolean;
    lastGenerationAt: string | null;
    generationHistory: GenerationRecord[];
    tier: 'free' | 'premium' | 'enterprise';
}

export interface GenerationRecord {
    type: AIGenerationType;
    creditsUsed: number;
    timestamp: string;
    snapshotId?: string;
    targetUserId?: string; // For relational analysis
    teamId?: string; // For team dynamics
    orgId?: string; // For org culture
}

// Credit costs per generation type
const CREDIT_COSTS: Record<AIGenerationType, number> = {
    personal_thesis: 5,
    core_insights: 5,
    relational_analysis: 3,
    team_dynamics: 10,
    org_culture: 25
};

// Default credits per tier
const TIER_CREDITS: Record<string, number> = {
    free: 0,         // Only free generation
    premium: 100,    // Monthly credits
    enterprise: 500  // Monthly credits
};

// ============================================================================
// AI CREDITS SERVICE
// ============================================================================

class AICreditsService {

    /**
     * Get or create user credits record
     */
    async getUserCredits(userId: string): Promise<UserCredits> {
        const allCredits = await db.getCollection<UserCredits>('ai_credits');
        let userCredits = allCredits.find(c => c.userId === userId);

        if (!userCredits) {
            // Create new credits record
            userCredits = {
                userId,
                totalCredits: TIER_CREDITS['free'],
                usedCredits: 0,
                freeGenerationUsed: false,
                lastGenerationAt: null,
                generationHistory: [],
                tier: 'free'
            };
            allCredits.push(userCredits);
            await db.saveCollection('ai_credits', allCredits);
        }

        return userCredits;
    }

    /**
     * Check if user can perform AI generation
     * Returns { allowed: boolean, reason?: string }
     */
    async canGenerate(
        userId: string,
        type: AIGenerationType
    ): Promise<{ allowed: boolean; reason?: string; creditsRequired?: number }> {
        const credits = await this.getUserCredits(userId);
        const cost = CREDIT_COSTS[type];

        // Check if this is the free initial generation
        if (!credits.freeGenerationUsed && (type === 'personal_thesis' || type === 'core_insights')) {
            return {
                allowed: true,
                reason: 'free_initial_generation',
                creditsRequired: 0
            };
        }

        // Check available credits
        const available = credits.totalCredits - credits.usedCredits;

        if (available >= cost) {
            return {
                allowed: true,
                creditsRequired: cost
            };
        }

        return {
            allowed: false,
            reason: 'insufficient_credits',
            creditsRequired: cost
        };
    }

    /**
     * Deduct credits for AI generation
     */
    async deductCredits(
        userId: string,
        type: AIGenerationType,
        metadata?: {
            snapshotId?: string;
            targetUserId?: string;
            teamId?: string;
            orgId?: string;
        }
    ): Promise<{ success: boolean; creditsUsed: number; remaining: number }> {
        const allCredits = await db.getCollection<UserCredits>('ai_credits');
        const idx = allCredits.findIndex(c => c.userId === userId);

        if (idx === -1) {
            throw new Error('User credits not found');
        }

        const credits = allCredits[idx];
        const cost = CREDIT_COSTS[type];

        // Handle free generation
        if (!credits.freeGenerationUsed && (type === 'personal_thesis' || type === 'core_insights')) {
            credits.freeGenerationUsed = true;
            credits.lastGenerationAt = new Date().toISOString();
            credits.generationHistory.push({
                type,
                creditsUsed: 0,
                timestamp: new Date().toISOString(),
                ...metadata
            });

            allCredits[idx] = credits;
            await db.saveCollection('ai_credits', allCredits);

            console.log(`[AICredits] User ${userId} used free generation for ${type}`);
            return {
                success: true,
                creditsUsed: 0,
                remaining: credits.totalCredits - credits.usedCredits
            };
        }

        // Check if enough credits
        const available = credits.totalCredits - credits.usedCredits;
        if (available < cost) {
            console.log(`[AICredits] User ${userId} has insufficient credits (${available}/${cost} needed)`);
            return {
                success: false,
                creditsUsed: 0,
                remaining: available
            };
        }

        // Deduct credits
        credits.usedCredits += cost;
        credits.lastGenerationAt = new Date().toISOString();
        credits.generationHistory.push({
            type,
            creditsUsed: cost,
            timestamp: new Date().toISOString(),
            ...metadata
        });

        allCredits[idx] = credits;
        await db.saveCollection('ai_credits', allCredits);

        const remaining = credits.totalCredits - credits.usedCredits;
        console.log(`[AICredits] User ${userId} used ${cost} credits for ${type}. Remaining: ${remaining}`);

        return {
            success: true,
            creditsUsed: cost,
            remaining
        };
    }

    /**
     * Add credits to user (for purchases or tier upgrades)
     */
    async addCredits(userId: string, amount: number, reason: string): Promise<UserCredits> {
        const allCredits = await db.getCollection<UserCredits>('ai_credits');
        const idx = allCredits.findIndex(c => c.userId === userId);

        if (idx === -1) {
            throw new Error('User credits not found');
        }

        allCredits[idx].totalCredits += amount;
        await db.saveCollection('ai_credits', allCredits);

        console.log(`[AICredits] Added ${amount} credits to user ${userId}. Reason: ${reason}`);
        return allCredits[idx];
    }

    /**
     * Upgrade user tier
     */
    async upgradeTier(userId: string, newTier: 'free' | 'premium' | 'enterprise'): Promise<UserCredits> {
        const allCredits = await db.getCollection<UserCredits>('ai_credits');
        const idx = allCredits.findIndex(c => c.userId === userId);

        if (idx === -1) {
            throw new Error('User credits not found');
        }

        const credits = allCredits[idx];
        const oldTier = credits.tier;

        credits.tier = newTier;
        credits.totalCredits += TIER_CREDITS[newTier];

        allCredits[idx] = credits;
        await db.saveCollection('ai_credits', allCredits);

        console.log(`[AICredits] User ${userId} upgraded from ${oldTier} to ${newTier}. +${TIER_CREDITS[newTier]} credits`);
        return credits;
    }

    /**
     * Get generation cost without deducting
     */
    getCost(type: AIGenerationType): number {
        return CREDIT_COSTS[type];
    }

    /**
     * Check if user has used their free generation
     */
    async hasFreeGeneration(userId: string): Promise<boolean> {
        const credits = await this.getUserCredits(userId);
        return !credits.freeGenerationUsed;
    }
}

export const aiCreditsService = new AICreditsService();
