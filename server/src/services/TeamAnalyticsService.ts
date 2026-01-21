// TeamAnalyticsService - Updated 2026-02-04
import { BlueprintSnapshot, TraitProbability } from './BlueprintService';

/**
 * TeamAnalyticsService
 * 
 * Dedicated service for computing advanced team-level analytics from member snapshots.
 * Provides meaningful insights for coaches, team leaders, and facilitators.
 */

// --- Type Definitions ---

export interface LayerStats {
    layerId: number;
    name: string;
    mean: number;
    min: number;
    max: number;
    diversity: number; // Standard deviation
    status: 'strength' | 'developing' | 'gap';
}

export interface MemberContribution {
    userId: string;
    name: string;
    topStrengths: { layerId: number; name: string; score: number }[];
    developmentAreas: { layerId: number; name: string; score: number }[];
    overallImpact: number; // How much they raise/lower team average
    roleArchetype: string;
    roleFit: number;
}

export interface FrictionPoint {
    layerId: number;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
}

export interface SynergyPoint {
    layerId: number;
    name: string;
    strength: 'strong' | 'moderate';
    description: string;
    leverage: string;
}

export interface RoleArchetype {
    id: string;
    name: string;
    icon: string;
    description: string;
    primaryLayers: number[];
    color: string;
}

export interface CoachAction {
    priority: 1 | 2 | 3;
    type: 'intervention' | 'leverage' | 'development';
    title: string;
    description: string;
    involvedMembers?: string[];
    targetLayer?: number;
}

export interface TeamAnalytics {
    healthScore: number;
    skillInventory: LayerStats[];
    memberContributions: MemberContribution[];
    frictionPoints: FrictionPoint[];
    synergyPoints: SynergyPoint[];
    coachActions: CoachAction[];
    lastComputed: string;
}

export interface RoleDistribution {
    archetype: string;
    count: number;
    color: string;
    icon: string;
    percentage: number;
}

export interface OverviewMetrics {
    healthIndex: number;              // 0-100 synthesized health score
    executionCapacity: number;        // 0-100: L2 (Energy) + L8 (Leadership)
    psychologicalSafety: number;      // 0-100: L7 (Emotional) + L11 (Trust)
    cognitiveAlignment: number;       // 0-100: L3 (Cognition) + L4 (Decision) + inverse diversity
    adaptiveResilience: number;       // 0-100: L1 (Foundation) + L14 (Adaptability) + L15 (Change)
    roleDistribution: RoleDistribution[];
    frictionCount: number;
    synergyCount: number;
    topAction: CoachAction | null;
}

// --- Constants ---

const LAYER_NAMES: Record<number, string> = {
    1: 'Foundation',
    2: 'Energy',
    3: 'Cognition',
    4: 'Decision-Making',
    5: 'Creative Expression',
    6: 'Pressure Response',
    7: 'Emotional Safety',
    8: 'Leadership',
    9: 'Communication',
    10: 'Values & Relationships',
    11: 'Trust & Commitment',
    12: 'Group Presence',
    13: 'Integration',
    14: 'Adaptability',
    15: 'Change Navigation'
};

const ROLE_ARCHETYPES: RoleArchetype[] = [
    {
        id: 'strategist',
        name: 'Strategist',
        icon: '🧠',
        description: 'Analytical thinker who excels at planning and decision-making',
        primaryLayers: [3, 4, 8],
        color: '#8B5CF6'
    },
    {
        id: 'executor',
        name: 'Executor',
        icon: '⚡',
        description: 'Action-oriented doer who gets things done reliably',
        primaryLayers: [1, 2, 6],
        color: '#F59E0B'
    },
    {
        id: 'connector',
        name: 'Connector',
        icon: '🤝',
        description: 'Relationship builder who creates psychological safety',
        primaryLayers: [7, 10, 11],
        color: '#10B981'
    },
    {
        id: 'innovator',
        name: 'Innovator',
        icon: '💡',
        description: 'Creative thinker who brings fresh perspectives',
        primaryLayers: [5, 9, 14],
        color: '#EC4899'
    },
    {
        id: 'anchor',
        name: 'Anchor',
        icon: '⚓',
        description: 'Stabilizing force that maintains team cohesion',
        primaryLayers: [1, 6, 11],
        color: '#6366F1'
    }
];

// --- Core Analytics Functions ---

export class TeamAnalyticsService {

    /**
     * Compute the full Team Skill Inventory (15-layer stats)
     */
    computeTeamSkillInventory(snapshots: BlueprintSnapshot[]): LayerStats[] {
        const inventory: LayerStats[] = [];

        for (let layerId = 1; layerId <= 15; layerId++) {
            const scores = snapshots
                .map(s => s.traits.find(t => t.layerId === layerId)?.score)
                .filter((s): s is number => s !== undefined);

            if (scores.length === 0) {
                inventory.push({
                    layerId,
                    name: LAYER_NAMES[layerId] || `Layer ${layerId}`,
                    mean: 0,
                    min: 0,
                    max: 0,
                    diversity: 0,
                    status: 'gap'
                });
                continue;
            }

            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            const diversity = Math.sqrt(variance);

            let status: 'strength' | 'developing' | 'gap';
            if (mean >= 0.75) status = 'strength';
            else if (mean >= 0.5) status = 'developing';
            else status = 'gap';

            inventory.push({
                layerId,
                name: LAYER_NAMES[layerId] || `Layer ${layerId}`,
                mean: parseFloat(mean.toFixed(3)),
                min: parseFloat(min.toFixed(3)),
                max: parseFloat(max.toFixed(3)),
                diversity: parseFloat(diversity.toFixed(3)),
                status
            });
        }

        return inventory;
    }

    /**
     * Compute each member's contribution to the team
     */
    computeMemberContributions(
        snapshots: BlueprintSnapshot[],
        memberDetails: { userId: string; name: string }[]
    ): MemberContribution[] {
        const contributions: MemberContribution[] = [];
        const teamAverages = this.computeTeamSkillInventory(snapshots);

        for (const snapshot of snapshots) {
            const member = memberDetails.find(m => m.userId === snapshot.userId);
            if (!member) continue;

            const traits = snapshot.traits.sort((a, b) => b.score - a.score);

            // Top 3 strengths (highest scores)
            const topStrengths = traits.slice(0, 3).map(t => ({
                layerId: t.layerId,
                name: LAYER_NAMES[t.layerId] || `Layer ${t.layerId}`,
                score: t.score
            }));

            // Bottom 3 development areas (lowest scores)
            const developmentAreas = traits.slice(-3).reverse().map(t => ({
                layerId: t.layerId,
                name: LAYER_NAMES[t.layerId] || `Layer ${t.layerId}`,
                score: t.score
            }));

            // Calculate overall impact (how much they shift team average)
            let totalImpact = 0;
            for (const trait of snapshot.traits) {
                const teamAvg = teamAverages.find(ta => ta.layerId === trait.layerId)?.mean || 0.5;
                totalImpact += (trait.score - teamAvg);
            }
            const overallImpact = parseFloat((totalImpact / 15).toFixed(3));

            // Determine role archetype
            const { archetype, fit } = this.determineRoleArchetype(snapshot.traits);

            contributions.push({
                userId: snapshot.userId,
                name: member.name,
                topStrengths,
                developmentAreas,
                overallImpact,
                roleArchetype: archetype.name,
                roleFit: fit
            });
        }

        return contributions;
    }

    /**
     * Determine the best-fit role archetype for a member
     */
    private determineRoleArchetype(traits: TraitProbability[]): { archetype: RoleArchetype; fit: number } {
        let bestArchetype = ROLE_ARCHETYPES[0];
        let bestFit = 0;

        for (const archetype of ROLE_ARCHETYPES) {
            const relevantScores = archetype.primaryLayers
                .map(layerId => traits.find(t => t.layerId === layerId)?.score || 0.5);
            const avgScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
            const fit = parseFloat((avgScore * 100).toFixed(1));

            if (fit > bestFit) {
                bestFit = fit;
                bestArchetype = archetype;
            }
        }

        return { archetype: bestArchetype, fit: bestFit };
    }

    /**
     * Identify friction points (high diversity + low mean OR very high diversity)
     */
    computeFrictionPoints(inventory: LayerStats[]): FrictionPoint[] {
        const frictionPoints: FrictionPoint[] = [];

        for (const layer of inventory) {
            // High diversity with low mean = friction
            if (layer.diversity > 0.15 && layer.mean < 0.6) {
                frictionPoints.push({
                    layerId: layer.layerId,
                    name: layer.name,
                    severity: layer.diversity > 0.25 ? 'high' : 'medium',
                    description: `Team members have conflicting approaches to ${layer.name.toLowerCase()}, and the overall capability is underdeveloped.`,
                    recommendation: `Consider targeted development sessions focused on ${layer.name.toLowerCase()} to build alignment.`
                });
            }
            // Very high diversity alone = potential conflict
            else if (layer.diversity > 0.25) {
                frictionPoints.push({
                    layerId: layer.layerId,
                    name: layer.name,
                    severity: 'low',
                    description: `Significant cognitive diversity in ${layer.name.toLowerCase()} may cause misunderstandings.`,
                    recommendation: `Facilitate discussions to leverage diverse perspectives in ${layer.name.toLowerCase()}.`
                });
            }
        }

        // Sort by severity
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return frictionPoints.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }

    /**
     * Identify synergy points (high mean + low diversity)
     */
    computeSynergyPoints(inventory: LayerStats[]): SynergyPoint[] {
        const synergyPoints: SynergyPoint[] = [];

        for (const layer of inventory) {
            // High mean with low diversity = synergy
            if (layer.mean >= 0.75 && layer.diversity < 0.15) {
                synergyPoints.push({
                    layerId: layer.layerId,
                    name: layer.name,
                    strength: layer.mean >= 0.85 ? 'strong' : 'moderate',
                    description: `The team is highly aligned and capable in ${layer.name.toLowerCase()}.`,
                    leverage: `Assign critical tasks requiring ${layer.name.toLowerCase()} to this team for maximum impact.`
                });
            }
        }

        return synergyPoints;
    }

    /**
     * Generate prioritized coach actions
     */
    computeCoachActions(
        inventory: LayerStats[],
        frictionPoints: FrictionPoint[],
        synergyPoints: SynergyPoint[],
        contributions: MemberContribution[]
    ): CoachAction[] {
        const actions: CoachAction[] = [];

        // Priority 1: Address high-severity friction
        for (const friction of frictionPoints.filter(f => f.severity === 'high')) {
            actions.push({
                priority: 1,
                type: 'intervention',
                title: `Resolve ${friction.name} Friction`,
                description: friction.recommendation,
                targetLayer: friction.layerId
            });
        }

        // Priority 2: Leverage strong synergies
        for (const synergy of synergyPoints.filter(s => s.strength === 'strong')) {
            actions.push({
                priority: 2,
                type: 'leverage',
                title: `Leverage ${synergy.name} Strength`,
                description: synergy.leverage,
                targetLayer: synergy.layerId
            });
        }

        // Priority 3: Pair high performers with developers
        const gaps = inventory.filter(l => l.status === 'gap');
        for (const gap of gaps.slice(0, 2)) {
            const highPerformer = contributions.find(c =>
                c.topStrengths.some(s => s.layerId === gap.layerId)
            );
            const developer = contributions.find(c =>
                c.developmentAreas.some(d => d.layerId === gap.layerId)
            );

            if (highPerformer && developer && highPerformer.userId !== developer.userId) {
                actions.push({
                    priority: 3,
                    type: 'development',
                    title: `Mentor Pairing for ${gap.name}`,
                    description: `Pair ${highPerformer.name} (high ${gap.name}) with ${developer.name} to accelerate team growth.`,
                    involvedMembers: [highPerformer.userId, developer.userId],
                    targetLayer: gap.layerId
                });
            }
        }

        return actions.slice(0, 5); // Top 5 actions
    }

    /**
     * Compute overall Team Health Score (0-100)
     */
    computeHealthScore(inventory: LayerStats[], frictionPoints: FrictionPoint[], synergyPoints: SynergyPoint[]): number {
        // Base: Average of all layer means
        const avgMean = inventory.reduce((a, b) => a + b.mean, 0) / inventory.length;

        // Penalty for friction
        const frictionPenalty = frictionPoints.reduce((a, f) => {
            if (f.severity === 'high') return a + 0.08;
            if (f.severity === 'medium') return a + 0.04;
            return a + 0.02;
        }, 0);

        // Bonus for synergy
        const synergyBonus = synergyPoints.reduce((a, s) => {
            if (s.strength === 'strong') return a + 0.05;
            return a + 0.02;
        }, 0);

        const rawScore = avgMean - frictionPenalty + synergyBonus;
        const healthScore = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

        return healthScore;
    }

    /**
     * Compute Overview Metrics for the redesigned Overview Dashboard
     * Aggregates 15-layer data into 4 meaningful dimensions + health index
     */
    computeOverviewMetrics(
        inventory: LayerStats[],
        memberContributions: MemberContribution[],
        frictionPoints: FrictionPoint[],
        synergyPoints: SynergyPoint[],
        coachActions: CoachAction[]
    ): OverviewMetrics {
        // Helper to get layer by ID
        const getLayer = (id: number) => inventory.find(l => l.layerId === id);

        // 1. Execution Capacity: Energy (L2) + Leadership (L8)
        const l2 = getLayer(2);
        const l8 = getLayer(8);
        const executionCapacity = Math.round(((l2?.mean || 0) + (l8?.mean || 0)) / 2 * 100);

        // 2. Psychological Safety: Emotional Safety (L7) + Trust & Commitment (L11)
        const l7 = getLayer(7);
        const l11 = getLayer(11);
        const psychologicalSafety = Math.round(((l7?.mean || 0) + (l11?.mean || 0)) / 2 * 100);

        // 3. Cognitive Alignment: Cognition (L3) + Decision-Making (L4) - penalized by diversity
        const l3 = getLayer(3);
        const l4 = getLayer(4);
        const cogMean = ((l3?.mean || 0) + (l4?.mean || 0)) / 2;
        const cogDiversity = ((l3?.diversity || 0) + (l4?.diversity || 0)) / 2;
        // High diversity = low alignment, so we penalize
        const alignmentPenalty = cogDiversity * 0.3; // Up to 30% penalty for high diversity
        const cognitiveAlignment = Math.round(Math.max(0, cogMean - alignmentPenalty) * 100);

        // 4. Adaptive Resilience: Foundation (L1) + Adaptability (L14) + Change Navigation (L15)
        const l1 = getLayer(1);
        const l14 = getLayer(14);
        const l15 = getLayer(15);
        const adaptiveResilience = Math.round(((l1?.mean || 0) + (l14?.mean || 0) + (l15?.mean || 0)) / 3 * 100);

        // 5. Health Index: Weighted combination of all dimensions
        const healthIndex = Math.round(
            executionCapacity * 0.25 +
            psychologicalSafety * 0.30 +
            cognitiveAlignment * 0.20 +
            adaptiveResilience * 0.25
        );

        // 6. Role Distribution: Aggregate from member contributions
        const roleMap = new Map<string, { count: number; color: string; icon: string }>();

        for (const contrib of memberContributions) {
            const archetype = contrib.roleArchetype;
            const existing = roleMap.get(archetype);
            if (existing) {
                existing.count++;
            } else {
                // Find archetype details from ROLE_ARCHETYPES constant
                const archetypeData = ROLE_ARCHETYPES.find(r => r.name === archetype);
                roleMap.set(archetype, {
                    count: 1,
                    color: archetypeData?.color || '#6B7280',
                    icon: archetypeData?.icon || '👤'
                });
            }
        }

        const totalMembers = memberContributions.length || 1;
        const roleDistribution: RoleDistribution[] = Array.from(roleMap.entries())
            .map(([archetype, data]) => ({
                archetype,
                count: data.count,
                color: data.color,
                icon: data.icon,
                percentage: Math.round((data.count / totalMembers) * 100)
            }))
            .sort((a, b) => b.count - a.count);

        return {
            healthIndex,
            executionCapacity,
            psychologicalSafety,
            cognitiveAlignment,
            adaptiveResilience,
            roleDistribution,
            frictionCount: frictionPoints.length,
            synergyCount: synergyPoints.length,
            topAction: coachActions.length > 0 ? coachActions[0] : null
        };
    }

    /**
     * Main entry point: Compute all team analytics
     */
    computeFullAnalytics(
        snapshots: BlueprintSnapshot[],
        memberDetails: { userId: string; name: string }[]
    ): TeamAnalytics & { overview: OverviewMetrics } {
        const skillInventory = this.computeTeamSkillInventory(snapshots);
        const memberContributions = this.computeMemberContributions(snapshots, memberDetails);
        const frictionPoints = this.computeFrictionPoints(skillInventory);
        const synergyPoints = this.computeSynergyPoints(skillInventory);
        const coachActions = this.computeCoachActions(skillInventory, frictionPoints, synergyPoints, memberContributions);
        const healthScore = this.computeHealthScore(skillInventory, frictionPoints, synergyPoints);
        const overview = this.computeOverviewMetrics(skillInventory, memberContributions, frictionPoints, synergyPoints, coachActions);

        return {
            healthScore,
            skillInventory,
            memberContributions,
            frictionPoints,
            synergyPoints,
            coachActions,
            overview,
            lastComputed: new Date().toISOString()
        };
    }
}

export const teamAnalyticsService = new TeamAnalyticsService();
