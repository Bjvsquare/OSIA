/**
 * OSIA Evolution Service — v1.0
 * 
 * Tracks user's OSIA snapshot history and calculates pattern evolution
 * for Journey reflection and growth visualization.
 */

import { db } from '../db/JsonDb';
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { Pattern, Claim, Theme, OSIABlueprintSnapshot } from '../types/osia-types';

// ============================================================================
// TYPES
// ============================================================================

export interface EvolutionTimeline {
    userId: string;
    snapshots: SnapshotSummary[];
    patternChanges: PatternChange[];
    themeEvolution: ThemeEvolution[];
    overallGrowth: GrowthMetric;
}

export interface SnapshotSummary {
    snapshotId: string;
    createdAt: string;
    patternCount: number;
    claimCount: number;
    themeCount: number;
    averageStability: number;
}

export interface PatternChange {
    patternId: string;
    patternName: string;
    previousStability: number;
    currentStability: number;
    changePercent: number;
    direction: 'improving' | 'declining' | 'stable';
    firstSeen: string;
}

export interface ThemeEvolution {
    themeId: string;
    themeName: string;
    strengthHistory: { date: string; strength: number }[];
    trend: 'up' | 'down' | 'stable';
    currentStrength: number;
}

export interface GrowthMetric {
    overallProgress: number; // 0-100
    stabilityGrowth: number; // % change in avg stability
    newPatternsDiscovered: number;
    areasOfImprovement: string[];
    areasNeedingAttention: string[];
}

export interface ReflectionInsight {
    userId: string;
    generatedAt: string;
    pastSelf: string; // Description of patterns at start
    presentSelf: string; // Description of current patterns
    keyEvolutions: EvolutionPoint[];
    nextStepsGuidance: string[];
}

export interface EvolutionPoint {
    area: string;
    fromState: string;
    toState: string;
    significance: 'major' | 'minor';
}

// ============================================================================
// EVOLUTION SERVICE
// ============================================================================

class OSIAEvolutionService {

    /**
     * Get complete evolution timeline for a user
     */
    async getEvolutionTimeline(userId: string, limit: number = 10): Promise<EvolutionTimeline | null> {
        console.log(`[Evolution] Getting timeline for user: ${userId}`);

        // Load all snapshots for user
        const allSnapshots = await this.getAllSnapshots(userId);

        if (!allSnapshots || allSnapshots.length === 0) {
            console.log('[Evolution] No snapshots found');
            return null;
        }

        // Sort by date (oldest first for timeline)
        const sortedSnapshots = allSnapshots
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-limit);

        const snapshotSummaries = sortedSnapshots.map(s => this.createSnapshotSummary(s));
        const patternChanges = this.analyzePatternChanges(sortedSnapshots);
        const themeEvolution = this.analyzeThemeEvolution(sortedSnapshots);
        const overallGrowth = this.calculateOverallGrowth(sortedSnapshots);

        return {
            userId,
            snapshots: snapshotSummaries,
            patternChanges,
            themeEvolution,
            overallGrowth
        };
    }

    /**
     * Get reflection insights comparing past and present self
     */
    async getReflectionInsights(userId: string): Promise<ReflectionInsight | null> {
        const allSnapshots = await this.getAllSnapshots(userId);

        if (!allSnapshots || allSnapshots.length < 2) {
            // Need at least 2 snapshots for comparison
            return null;
        }

        const sortedSnapshots = allSnapshots
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const oldest = sortedSnapshots[0];
        const latest = sortedSnapshots[sortedSnapshots.length - 1];

        const pastSelf = this.describeSnapshot(oldest);
        const presentSelf = this.describeSnapshot(latest);
        const keyEvolutions = this.identifyKeyEvolutions(oldest, latest);
        const nextStepsGuidance = this.generateNextSteps(latest, keyEvolutions);

        return {
            userId,
            generatedAt: new Date().toISOString(),
            pastSelf,
            presentSelf,
            keyEvolutions,
            nextStepsGuidance
        };
    }

    /**
     * Get recommended next focus areas based on evolution
     */
    async getNextStepRecommendations(userId: string): Promise<string[]> {
        const timeline = await this.getEvolutionTimeline(userId, 5);

        if (!timeline) {
            return [
                'Complete your Blueprint to begin your growth journey',
                'Engage with daily protocols to refine your patterns',
                'Connect with others to unlock relational insights'
            ];
        }

        const recommendations: string[] = [];

        // Focus on areas needing attention
        if (timeline.overallGrowth.areasNeedingAttention.length > 0) {
            recommendations.push(
                `Focus on ${timeline.overallGrowth.areasNeedingAttention[0]} — this area has shown potential for growth`
            );
        }

        // Build on strengths
        if (timeline.overallGrowth.areasOfImprovement.length > 0) {
            recommendations.push(
                `Continue developing ${timeline.overallGrowth.areasOfImprovement[0]} — you've made significant progress here`
            );
        }

        // Pattern stability recommendations
        const unstablePatterns = timeline.patternChanges.filter(p => p.currentStability < 60);
        if (unstablePatterns.length > 0) {
            recommendations.push(
                `Stabilize your ${unstablePatterns[0].patternName} pattern through consistent practice`
            );
        }

        // Default recommendations
        if (recommendations.length === 0) {
            recommendations.push(
                'Maintain your current growth trajectory',
                'Explore new protocols to expand your capabilities',
                'Connect with compatible people to accelerate growth'
            );
        }

        return recommendations.slice(0, 4);
    }

    // ========== PRIVATE HELPERS ==========

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

        return (avgPatternStability * 0.7) + (this.priorityToScore(theme.priority) * 0.3);
    }

    private async getAllSnapshots(userId: string): Promise<OSIABlueprintSnapshot[]> {
        try {
            // Get from the dedicated store for proper collection management
            return await osiaSnapshotStore.getSnapshotHistory(userId, 100);
        } catch (error) {
            console.error('[Evolution] Error loading snapshots:', error);
            return [];
        }
    }

    private createSnapshotSummary(snapshot: OSIABlueprintSnapshot): SnapshotSummary {
        const avgStability = snapshot.patterns.length > 0
            ? snapshot.patterns.reduce((sum, p) => sum + (p.stabilityIndex * 100), 0) / snapshot.patterns.length
            : 0;

        return {
            snapshotId: snapshot.snapshotId,
            createdAt: snapshot.timestamp,
            patternCount: snapshot.patterns.length,
            claimCount: snapshot.claims.length,
            themeCount: snapshot.themes.length,
            averageStability: Math.round(avgStability)
        };
    }

    private analyzePatternChanges(snapshots: OSIABlueprintSnapshot[]): PatternChange[] {
        if (snapshots.length < 2) return [];

        const oldest = snapshots[0];
        const latest = snapshots[snapshots.length - 1];
        const changes: PatternChange[] = [];

        // Compare patterns that exist in latest
        for (const currentPattern of latest.patterns) {
            const previousPattern = oldest.patterns.find(p => p.patternId === currentPattern.patternId);

            const previousStability = previousPattern ? (previousPattern.stabilityIndex * 100) : 0;
            const currentStability = (currentPattern.stabilityIndex * 100);

            const changePercent = previousStability > 0
                ? Math.round(((currentStability - previousStability) / previousStability) * 100)
                : 100;

            let direction: 'improving' | 'declining' | 'stable' = 'stable';
            if (changePercent > 5) direction = 'improving';
            else if (changePercent < -5) direction = 'declining';

            changes.push({
                patternId: currentPattern.patternId,
                patternName: currentPattern.patternId.replace(/PAT\..*?\./, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                previousStability,
                currentStability,
                changePercent,
                direction,
                firstSeen: previousPattern ? oldest.timestamp : latest.timestamp
            });
        }

        // Sort by most significant changes
        return changes.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    }

    private analyzeThemeEvolution(snapshots: OSIABlueprintSnapshot[]): ThemeEvolution[] {
        const themeMap = new Map<string, { date: string; strength: number; name: string }>();
        const themeHistories = new Map<string, { date: string; strength: number }[]>();

        for (const snapshot of snapshots) {
            for (const theme of snapshot.themes) {
                const strength = this.getThemeStrength(theme, snapshot.patterns);

                if (!themeHistories.has(theme.themeId)) {
                    themeHistories.set(theme.themeId, []);
                    themeMap.set(theme.themeId, { date: snapshot.timestamp, strength, name: theme.name });
                }

                themeHistories.get(theme.themeId)!.push({
                    date: snapshot.timestamp,
                    strength
                });
            }
        }

        const evolutions: ThemeEvolution[] = [];
        for (const [themeId, history] of themeHistories) {
            if (history.length < 2) continue;

            const first = history[0].strength;
            const last = history[history.length - 1].strength;
            const trend = last > first + 5 ? 'up' : last < first - 5 ? 'down' : 'stable';

            evolutions.push({
                themeId,
                themeName: themeMap.get(themeId)?.name || themeId,
                strengthHistory: history,
                trend,
                currentStrength: last
            });
        }

        return evolutions;
    }

    private calculateOverallGrowth(snapshots: OSIABlueprintSnapshot[]): GrowthMetric {
        if (snapshots.length < 2) {
            return {
                overallProgress: 0,
                stabilityGrowth: 0,
                newPatternsDiscovered: 0,
                areasOfImprovement: [],
                areasNeedingAttention: []
            };
        }

        const oldest = snapshots[0];
        const latest = snapshots[snapshots.length - 1];

        const oldAvgStability = oldest.patterns.reduce((sum, p) => sum + (p.stabilityIndex * 100), 0) /
            Math.max(oldest.patterns.length, 1);
        const newAvgStability = latest.patterns.reduce((sum, p) => sum + (p.stabilityIndex * 100), 0) /
            Math.max(latest.patterns.length, 1);

        const stabilityGrowth = oldAvgStability > 0
            ? Math.round(((newAvgStability - oldAvgStability) / oldAvgStability) * 100)
            : 0;

        const oldPatternIds = new Set(oldest.patterns.map(p => p.patternId));
        const newPatterns = latest.patterns.filter(p => !oldPatternIds.has(p.patternId));

        // Identify improvements and areas needing attention
        const areasOfImprovement: string[] = [];
        const areasNeedingAttention: string[] = [];

        for (const theme of latest.themes) {
            const oldTheme = oldest.themes.find(t => t.themeId === theme.themeId);
            const currentStrength = this.getThemeStrength(theme, latest.patterns);

            if (oldTheme) {
                const oldStrength = this.getThemeStrength(oldTheme, oldest.patterns);
                if (currentStrength > oldStrength + 10) {
                    areasOfImprovement.push(theme.name);
                } else if (currentStrength < oldStrength - 10) {
                    areasNeedingAttention.push(theme.name);
                }
            }
            if (currentStrength < 50) {
                areasNeedingAttention.push(theme.name);
            }
        }

        return {
            overallProgress: Math.min(100, Math.max(0, 50 + stabilityGrowth)),
            stabilityGrowth,
            newPatternsDiscovered: newPatterns.length,
            areasOfImprovement: [...new Set(areasOfImprovement)].slice(0, 3),
            areasNeedingAttention: [...new Set(areasNeedingAttention)].slice(0, 3)
        };
    }

    private describeSnapshot(snapshot: OSIABlueprintSnapshot): string {
        const topPatterns = [...snapshot.patterns]
            .sort((a, b) => b.stabilityIndex - a.stabilityIndex)
            .slice(0, 3)
            .map(p => p.name || p.patternId.replace(/PAT\..*?\./, '').replace(/_/g, ' '));

        const themeStrengths = snapshot.themes.map(t => ({
            name: t.name,
            strength: this.getThemeStrength(t, snapshot.patterns)
        })).sort((a, b) => b.strength - a.strength);

        const topThemes = themeStrengths.slice(0, 2).map(t => t.name);

        return `Defined by ${topPatterns.join(', ')} patterns, with strength in ${topThemes.join(' and ')} dimensions.`;
    }

    private identifyKeyEvolutions(oldest: OSIABlueprintSnapshot, latest: OSIABlueprintSnapshot): EvolutionPoint[] {
        const evolutions: EvolutionPoint[] = [];

        // Compare themes
        for (const newTheme of latest.themes) {
            const oldTheme = oldest.themes.find(t => t.themeId === newTheme.themeId);
            const currentStrength = this.getThemeStrength(newTheme, latest.patterns);

            if (oldTheme) {
                const oldStrength = this.getThemeStrength(oldTheme, oldest.patterns);
                if (Math.abs(currentStrength - oldStrength) > 15) {
                    evolutions.push({
                        area: newTheme.name,
                        fromState: oldStrength < 50 ? 'developing' : oldStrength < 70 ? 'stable' : 'strong',
                        toState: currentStrength < 50 ? 'developing' : currentStrength < 70 ? 'stable' : 'strong',
                        significance: Math.abs(currentStrength - oldStrength) > 25 ? 'major' : 'minor'
                    });
                }
            }
        }

        return evolutions.slice(0, 5);
    }

    private generateNextSteps(latest: OSIABlueprintSnapshot, evolutions: EvolutionPoint[]): string[] {
        const steps: string[] = [];

        // Based on weak themes
        const weakThemes = latest.themes.filter(t => this.getThemeStrength(t, latest.patterns) < 50);
        if (weakThemes.length > 0) {
            steps.push(`Develop your ${weakThemes[0].name} dimension through targeted protocols`);
        }

        // Based on unstable patterns
        const unstablePatterns = latest.patterns.filter(p => (p.stabilityIndex * 100) < 60);
        if (unstablePatterns.length > 0) {
            steps.push(`Stabilize your ${unstablePatterns[0].name || unstablePatterns[0].patternId} pattern with consistent practice`);
        }

        // Based on evolutions
        const improvements = evolutions.filter(e => e.significance === 'major');
        if (improvements.length > 0) {
            steps.push(`Continue your momentum in ${improvements[0].area}`);
        }

        // Default
        if (steps.length === 0) {
            steps.push('Maintain your current growth trajectory');
            steps.push('Explore new protocols to expand your capabilities');
        }

        return steps.slice(0, 4);
    }
}

export const osiaEvolutionService = new OSIAEvolutionService();
