/**
 * Protocol Recommendation Service — v1.0
 * 
 * Analyzes user's OSIA snapshot to recommend personalized protocols
 * based on their patterns, claims, and growth areas.
 */

import { osiaSnapshotStore } from './OSIASnapshotStore';
import { Pattern, Claim, Theme, OSIABlueprintSnapshot } from '../types/osia-types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProtocolRecommendation {
    protocolId: string;
    title: string;
    type: 'reflection' | 'energy' | 'connection' | 'focus';
    description: string;
    duration: string;
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'master';
    relevanceScore: number; // 0-100
    reasons: string[]; // Why this is recommended
    targetPatterns: string[]; // Pattern IDs this addresses
    blueprintImpact: string[];
}

export interface UserGrowthProfile {
    primaryFrictions: string[];
    strengthAreas: string[];
    growthOpportunities: string[];
    recommendedFocus: string;
}

// ============================================================================
// PROTOCOL TEMPLATES WITH OSIA MAPPING
// ============================================================================

const PROTOCOL_TEMPLATES = [
    {
        id: 'strategic_briefing',
        type: 'reflection' as const,
        title: 'Strategic Briefing',
        description: '5-minute decision clarity session. Align mental resources with today\'s highest priorities.',
        duration: '5 mins',
        complexity: 'beginner' as const,
        blueprintImpact: ['Decision Quality', 'Strategic Clarity'],
        // OSIA mappings
        targetPatterns: ['analytical_mind', 'strategic_thinking', 'decision_clarity'],
        addressesFrictions: ['overthinking', 'indecision', 'scattered_focus'],
        enhancesThemes: ['Intellectual', 'Professional']
    },
    {
        id: 'performance_calibration',
        type: 'energy' as const,
        title: 'Performance Calibration',
        description: 'Optimize operational capacity. Assess current state, reset, and deploy peak performance.',
        duration: '7 mins',
        complexity: 'intermediate' as const,
        blueprintImpact: ['Peak Performance', 'Resilience'],
        targetPatterns: ['high_energy', 'physical_vitality', 'peak_performance'],
        addressesFrictions: ['burnout', 'low_energy', 'stress_accumulation'],
        enhancesThemes: ['Physical', 'Professional']
    },
    {
        id: 'stakeholder_intelligence',
        type: 'connection' as const,
        title: 'Stakeholder Intelligence',
        description: 'Strengthen network capital. Strategic relationship maintenance and outreach planning.',
        duration: '5 mins',
        complexity: 'beginner' as const,
        blueprintImpact: ['Relational Capital', 'Influence'],
        targetPatterns: ['social_connector', 'relationship_builder', 'empathy'],
        addressesFrictions: ['isolation', 'social_anxiety', 'network_neglect'],
        enhancesThemes: ['Social', 'Professional']
    },
    {
        id: 'priority_execution',
        type: 'focus' as const,
        title: 'Priority Execution',
        description: 'Eliminate noise. Lock onto your highest-leverage task and prepare for execution.',
        duration: '10 mins',
        complexity: 'advanced' as const,
        blueprintImpact: ['Execution Focus', 'Productivity'],
        targetPatterns: ['deep_focus', 'productivity', 'task_completion'],
        addressesFrictions: ['distraction', 'procrastination', 'overwhelm'],
        enhancesThemes: ['Intellectual', 'Professional']
    },
    {
        id: 'daily_debrief',
        type: 'reflection' as const,
        title: 'Daily Debrief',
        description: 'Post-action review. Extract learnings, capture wins, and set tomorrow\'s trajectory.',
        duration: '8 mins',
        complexity: 'intermediate' as const,
        blueprintImpact: ['Pattern Recognition', 'Continuous Improvement'],
        targetPatterns: ['self_awareness', 'growth_mindset', 'learning_orientation'],
        addressesFrictions: ['lack_of_reflection', 'repeating_mistakes', 'no_closure'],
        enhancesThemes: ['Intellectual', 'Emotional']
    },
    {
        id: 'recovery_protocol',
        type: 'energy' as const,
        title: 'Recovery Protocol',
        description: 'High-performance recovery. Restore capacity for sustained output under pressure.',
        duration: '12 mins',
        complexity: 'master' as const,
        blueprintImpact: ['Stress Management', 'Sustained Performance'],
        targetPatterns: ['stress_resilience', 'emotional_regulation', 'recovery'],
        addressesFrictions: ['chronic_stress', 'burnout', 'emotional_exhaustion'],
        enhancesThemes: ['Physical', 'Emotional']
    },
    {
        id: 'creative_activation',
        type: 'focus' as const,
        title: 'Creative Activation',
        description: 'Unlock creative flow state. Prime your mind for innovative thinking and problem-solving.',
        duration: '8 mins',
        complexity: 'intermediate' as const,
        blueprintImpact: ['Creative Output', 'Innovation'],
        targetPatterns: ['creativity', 'innovation', 'divergent_thinking'],
        addressesFrictions: ['creative_blocks', 'rigid_thinking', 'mental_fatigue'],
        enhancesThemes: ['Intellectual', 'Creative']
    },
    {
        id: 'emotional_grounding',
        type: 'energy' as const,
        title: 'Emotional Grounding',
        description: 'Stabilize emotional baseline. Process and regulate emotions for clearer decision-making.',
        duration: '6 mins',
        complexity: 'beginner' as const,
        blueprintImpact: ['Emotional Intelligence', 'Stability'],
        targetPatterns: ['emotional_awareness', 'self_regulation', 'inner_peace'],
        addressesFrictions: ['emotional_volatility', 'anxiety', 'rumination'],
        enhancesThemes: ['Emotional', 'Mental Health']
    }
];

// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================

class ProtocolRecommendationService {

    /**
     * Get personalized protocol recommendations based on OSIA data
     */
    async getRecommendations(userId: string): Promise<ProtocolRecommendation[]> {
        console.log(`[ProtocolRec] Getting recommendations for user: ${userId}`);

        const snapshot = await osiaSnapshotStore.getLatestSnapshot(userId);

        if (!snapshot) {
            console.log('[ProtocolRec] No OSIA snapshot, returning default recommendations');
            return this.getDefaultRecommendations();
        }

        const { patterns, claims, themes } = snapshot;
        const growthProfile = this.analyzeGrowthProfile(patterns, claims, themes);
        const recommendations = this.scoreProtocols(growthProfile, patterns, themes);

        // Sort by relevance score
        return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Map confidence string to numerical score 0-100
     */
    private confidenceToScore(confidence: string): number {
        switch (confidence) {
            case 'integrated': return 95;
            case 'developed': return 75;
            case 'moderate': return 50;
            case 'emerging': return 25;
            default: return 50;
        }
    }

    /**
     * Map priority string to numerical score 0-100
     */
    private priorityToScore(priority: string): number {
        switch (priority) {
            case 'high': return 90;
            case 'medium': return 60;
            case 'low': return 30;
            default: return 50;
        }
    }

    /**
     * Calculate theme strength based on supporting patterns
     */
    private getThemeStrength(theme: Theme, patterns: readonly Pattern[]): number {
        const supportingPatterns = patterns.filter(p =>
            theme.supportingPatternIds.includes(p.patternId)
        );

        if (supportingPatterns.length === 0) {
            return this.priorityToScore(theme.priority);
        }

        const avgPatternStability = supportingPatterns.reduce((sum, p) =>
            sum + (p.stabilityIndex * 100), 0
        ) / supportingPatterns.length;

        // Combine avg stability (70%) and theme priority (30%)
        return (avgPatternStability * 0.7) + (this.priorityToScore(theme.priority) * 0.3);
    }

    /**
     * Analyze user's growth profile from OSIA data
     */
    private analyzeGrowthProfile(
        patterns: readonly Pattern[],
        claims: readonly Claim[],
        themes: readonly Theme[]
    ): UserGrowthProfile {
        // Find friction patterns (low stabilityIndex or negative patterns)
        const frictionPatterns = patterns.filter(p =>
            (p.stabilityIndex * 100) < 50 ||
            p.patternId.toLowerCase().includes('friction') ||
            p.patternId.toLowerCase().includes('challenge')
        );

        // Find strength patterns (high stabilityIndex, positive)
        const strengthPatterns = patterns.filter(p =>
            (p.stabilityIndex * 100) > 70 &&
            !p.patternId.toLowerCase().includes('friction') &&
            !p.patternId.toLowerCase().includes('challenge')
        );

        // Growth opportunities from claims
        const growthClaims = claims.filter(c =>
            this.confidenceToScore(c.confidence) < 70 ||
            c.claimId.toLowerCase().includes('developing') ||
            c.claimId.toLowerCase().includes('emerging')
        );

        // Determine primary focus based on weakest theme
        const themeStrengths = themes.map(t => ({
            theme: t,
            strength: this.getThemeStrength(t, patterns)
        }));

        const weakestTheme = themeStrengths.reduce((min, t) =>
            t.strength < min.strength ? t : min,
            themeStrengths[0] || { theme: null, strength: 50 }
        );

        return {
            primaryFrictions: frictionPatterns.map(p => p.patternId),
            strengthAreas: strengthPatterns.map(p => p.patternId),
            growthOpportunities: growthClaims.map(c => c.claimId),
            recommendedFocus: weakestTheme.theme?.themeId || 'general'
        };
    }

    /**
     * Score protocols based on user's growth profile
     */
    private scoreProtocols(
        profile: UserGrowthProfile,
        patterns: readonly Pattern[],
        themes: readonly Theme[]
    ): ProtocolRecommendation[] {
        return PROTOCOL_TEMPLATES.map(template => {
            let score = 50; // Base score
            const reasons: string[] = [];

            // Boost score if protocol addresses user's frictions
            const frictionMatch = template.addressesFrictions.some(f =>
                profile.primaryFrictions.some(pf =>
                    pf.toLowerCase().includes(f.toLowerCase()) ||
                    f.toLowerCase().includes(pf.toLowerCase())
                )
            );
            if (frictionMatch) {
                score += 25;
                reasons.push('Addresses your current growth areas');
            }

            // Boost if protocol enhances weak themes
            const themeMatch = template.enhancesThemes.some(t =>
                themes.some(ut =>
                    (ut.themeId.toLowerCase().includes(t.toLowerCase()) ||
                        ut.name.toLowerCase().includes(t.toLowerCase())) &&
                    this.getThemeStrength(ut, patterns) < 60
                )
            );
            if (themeMatch) {
                score += 15;
                reasons.push(`Strengthens your ${template.enhancesThemes[0]} dimension`);
            }

            // Boost if protocol targets user's developing patterns
            const patternMatch = template.targetPatterns.some(tp =>
                patterns.some(p =>
                    p.patternId.toLowerCase().includes(tp.toLowerCase()) &&
                    (p.stabilityIndex * 100) < 70
                )
            );
            if (patternMatch) {
                score += 10;
                reasons.push('Develops emerging patterns');
            }

            // Cap at 100
            score = Math.min(100, score);

            // Add default reason if no specific matches
            if (reasons.length === 0) {
                reasons.push('General wellness protocol');
            }

            return {
                protocolId: template.id,
                title: template.title,
                type: template.type,
                description: template.description,
                duration: template.duration,
                complexity: template.complexity,
                relevanceScore: score,
                reasons,
                targetPatterns: template.targetPatterns,
                blueprintImpact: template.blueprintImpact
            };
        });
    }

    /**
     * Default recommendations when no OSIA data available
     */
    private getDefaultRecommendations(): ProtocolRecommendation[] {
        return PROTOCOL_TEMPLATES.map(template => ({
            protocolId: template.id,
            title: template.title,
            type: template.type,
            description: template.description,
            duration: template.duration,
            complexity: template.complexity,
            relevanceScore: 50,
            reasons: ['Complete your blueprint for personalized recommendations'],
            targetPatterns: template.targetPatterns,
            blueprintImpact: template.blueprintImpact
        }));
    }

    /**
     * Get top recommended protocol for quick access
     */
    async getTopRecommendation(userId: string): Promise<ProtocolRecommendation | null> {
        const recommendations = await this.getRecommendations(userId);
        return recommendations.length > 0 ? recommendations[0] : null;
    }
}

export const protocolRecommendationService = new ProtocolRecommendationService();
