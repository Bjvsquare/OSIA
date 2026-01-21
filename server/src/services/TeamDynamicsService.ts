/**
 * Team Dynamics Service — v1.0
 * 
 * Aggregates OSIA data for team members and generates team-level insights.
 * 
 * Features:
 * - Aggregate team members' claims, patterns, and themes
 * - Calculate team strengths and gaps
 * - Generate compatibility matrix between members
 * - AI-powered team dynamics reports (costs credits)
 */

import { db } from '../db/JsonDb';
import { Claim, Pattern, Theme } from '../types/osia-types';
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { aiCreditsService } from './AICreditsService';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamMember {
    userId: string;
    name?: string;
    role?: string;
}

export interface TeamDynamicsProfile {
    teamId: string;
    teamName: string;
    members: TeamMember[];
    aggregatedAt: string;

    // Aggregated insights
    collectiveStrengths: CollectiveStrength[];
    potentialGaps: PotentialGap[];
    memberContributions: MemberContribution[];

    // Team metrics
    cohesionScore: number; // 0-100, how well patterns align
    diversityScore: number; // 0-100, how varied the patterns are
    balanceScore: number; // 0-100, how well strengths cover frictions
}

export interface CollectiveStrength {
    name: string;
    description: string;
    contributingMembers: string[]; // userIds
    prevalence: number; // 0-1, what % of team has this
}

export interface PotentialGap {
    area: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
}

export interface MemberContribution {
    userId: string;
    uniqueStrengths: string[];
    complementaryPatterns: string[];
    roleAlignment: number; // 0-100
}

export interface TeamCompatibilityMatrix {
    teamId: string;
    matrix: CompatibilityCell[][];
}

export interface CompatibilityCell {
    userId1: string;
    userId2: string;
    score: number;
    synergies: string[];
}

export interface AITeamReport {
    teamId: string;
    generatedAt: string;
    executiveSummary: string;
    teamPersonality: string;
    collectiveStrengths: string[];
    blindSpots: string[];
    teamDynamics: string;
    communicationStyle: string;
    conflictPatterns: string;
    leadershipDistribution: string;
    recommendations: TeamRecommendation[];
}

export interface TeamRecommendation {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    targetMembers?: string[];
}

// ============================================================================
// TEAM DYNAMICS SERVICE
// ============================================================================

class TeamDynamicsService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
        }
    }

    /**
     * Get team dynamics profile (aggregated, no AI)
     */
    async getTeamDynamics(teamId: string, members: TeamMember[]): Promise<TeamDynamicsProfile | null> {
        console.log(`[TeamDynamics] Aggregating data for team ${teamId} with ${members.length} members`);

        if (members.length === 0) {
            return null;
        }

        // Collect all snapshots
        const memberSnapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[] = [];

        for (const member of members) {
            const snapshot = await osiaSnapshotStore.getLatestSnapshot(member.userId);
            if (snapshot) {
                memberSnapshots.push({
                    userId: member.userId,
                    claims: snapshot.claims,
                    patterns: snapshot.patterns,
                    themes: snapshot.themes
                });
            }
        }

        if (memberSnapshots.length === 0) {
            console.log('[TeamDynamics] No member snapshots found');
            return null;
        }

        // Aggregate collective strengths
        const collectiveStrengths = this.calculateCollectiveStrengths(memberSnapshots);

        // Identify gaps
        const potentialGaps = this.identifyGaps(memberSnapshots);

        // Calculate member contributions
        const memberContributions = this.calculateMemberContributions(memberSnapshots);

        // Calculate team scores
        const cohesionScore = this.calculateCohesion(memberSnapshots);
        const diversityScore = this.calculateDiversity(memberSnapshots);
        const balanceScore = this.calculateBalance(memberSnapshots);

        // Get team name from storage or default
        const teamName = await this.getTeamName(teamId) || `Team ${teamId}`;

        const profile: TeamDynamicsProfile = {
            teamId,
            teamName,
            members,
            aggregatedAt: new Date().toISOString(),
            collectiveStrengths,
            potentialGaps,
            memberContributions,
            cohesionScore,
            diversityScore,
            balanceScore
        };

        // Store the profile
        await this.storeProfile(profile);

        return profile;
    }

    /**
     * Generate AI-powered team report (costs credits)
     */
    async generateAIReport(
        requestingUserId: string,
        teamId: string,
        members: TeamMember[]
    ): Promise<AITeamReport | null> {
        if (!this.anthropic) {
            console.log('[TeamDynamics] AI not available');
            return null;
        }

        // Check credits
        const creditCheck = await aiCreditsService.canGenerate(requestingUserId, 'team_dynamics');
        if (!creditCheck.allowed) {
            console.log(`[TeamDynamics] Insufficient credits for user ${requestingUserId}`);
            return null;
        }

        console.log(`[TeamDynamics] Generating AI report for team ${teamId}`);

        // Collect all member data
        const memberContexts: string[] = [];
        for (const member of members) {
            const snapshot = await osiaSnapshotStore.getLatestSnapshot(member.userId);
            if (snapshot) {
                memberContexts.push(this.buildMemberContext(
                    member,
                    snapshot.claims,
                    snapshot.patterns,
                    snapshot.themes
                ));
            }
        }

        if (memberContexts.length < 2) {
            console.log('[TeamDynamics] Need at least 2 members with data');
            return null;
        }

        const systemPrompt = `You are an expert organizational psychologist who analyzes team dynamics. Your insights help teams understand their collective personality, leverage their strengths, and navigate challenges effectively.`;

        const userPrompt = `Analyze this team's collective dynamics based on each member's psychological profile:

${memberContexts.join('\n\n---\n\n')}

Generate a comprehensive team dynamics report in JSON format:
{
    "executiveSummary": "...(2-3 sentences capturing the team's essence)...",
    "teamPersonality": "...(describe the team's collective personality type)...",
    "collectiveStrengths": ["strength 1", "strength 2", "strength 3"],
    "blindSpots": ["blind spot 1", "blind spot 2"],
    "teamDynamics": "...(how they work together)...",
    "communicationStyle": "...(team's communication patterns)...",
    "conflictPatterns": "...(how conflicts typically emerge and resolve)...",
    "leadershipDistribution": "...(how leadership is distributed)...",
    "recommendations": [
        {
            "title": "...",
            "description": "...",
            "priority": "high|medium|low"
        }
    ]
}`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 5000,
                messages: [{ role: 'user', content: userPrompt }],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Deduct credits
            await aiCreditsService.deductCredits(requestingUserId, 'team_dynamics', { teamId });

            const report: AITeamReport = {
                teamId,
                generatedAt: new Date().toISOString(),
                ...parsed
            };

            // Store the report
            await this.storeReport(report);

            console.log(`[TeamDynamics] AI report generated for team ${teamId}`);
            return report;

        } catch (error: any) {
            console.error('[TeamDynamics] AI report error:', error.message);
            return null;
        }
    }

    /**
     * Calculate compatibility matrix between all team members
     */
    async calculateCompatibilityMatrix(
        teamId: string,
        members: TeamMember[]
    ): Promise<TeamCompatibilityMatrix> {
        const matrix: CompatibilityCell[][] = [];

        // For each pair of members, calculate compatibility
        for (let i = 0; i < members.length; i++) {
            const row: CompatibilityCell[] = [];
            for (let j = 0; j < members.length; j++) {
                if (i === j) {
                    row.push({
                        userId1: members[i].userId,
                        userId2: members[j].userId,
                        score: 100,
                        synergies: ['Self']
                    });
                } else if (j > i) {
                    // Calculate actual compatibility
                    const score = await this.calculatePairCompatibility(
                        members[i].userId,
                        members[j].userId
                    );
                    row.push(score);
                } else {
                    // Mirror the upper triangle
                    row.push(matrix[j][i]);
                }
            }
            matrix.push(row);
        }

        return { teamId, matrix };
    }

    // ========================================================================
    // AGGREGATION ALGORITHMS
    // ========================================================================

    private calculateCollectiveStrengths(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): CollectiveStrength[] {
        const patternCounts = new Map<string, { name: string; members: Set<string> }>();

        for (const snapshot of snapshots) {
            for (const pattern of snapshot.patterns) {
                if (!patternCounts.has(pattern.patternId)) {
                    patternCounts.set(pattern.patternId, {
                        name: pattern.name,
                        members: new Set()
                    });
                }
                patternCounts.get(pattern.patternId)!.members.add(snapshot.userId);
            }
        }

        const strengths: CollectiveStrength[] = [];
        const totalMembers = snapshots.length;

        patternCounts.forEach((value, key) => {
            const prevalence = value.members.size / totalMembers;
            if (prevalence >= 0.5) { // At least half the team has this
                strengths.push({
                    name: value.name,
                    description: `${Math.round(prevalence * 100)}% of the team shares this pattern`,
                    contributingMembers: Array.from(value.members),
                    prevalence
                });
            }
        });

        return strengths.sort((a, b) => b.prevalence - a.prevalence);
    }

    private identifyGaps(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): PotentialGap[] {
        const gaps: PotentialGap[] = [];
        const frictionCounts = new Map<number, number>(); // Layer -> count

        for (const snapshot of snapshots) {
            const frictions = snapshot.claims.filter(c => c.polarity === 'friction');
            for (const friction of frictions) {
                frictionCounts.set(friction.layerId, (frictionCounts.get(friction.layerId) || 0) + 1);
            }
        }

        const totalMembers = snapshots.length;
        const layerNames: Record<number, string> = {
            1: 'Core Disposition',
            2: 'Energy Management',
            3: 'Cognitive Processing',
            4: 'Emotional Foundation',
            5: 'Creative Expression',
            6: 'Operational Style',
            7: 'Relational Dynamics'
        };

        frictionCounts.forEach((count, layerId) => {
            const prevalence = count / totalMembers;
            if (prevalence >= 0.4) { // 40%+ have friction here
                gaps.push({
                    area: layerNames[layerId] || `Layer ${layerId}`,
                    description: `${Math.round(prevalence * 100)}% of team members show friction in this area`,
                    severity: prevalence >= 0.6 ? 'high' : prevalence >= 0.5 ? 'medium' : 'low',
                    recommendation: `Consider team training or pairing strategies to address ${layerNames[layerId] || 'this area'}`
                });
            }
        });

        return gaps.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    private calculateMemberContributions(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): MemberContribution[] {
        const contributions: MemberContribution[] = [];
        const allPatternTypes = new Set<string>();

        // Collect all patterns
        snapshots.forEach(s => s.patterns.forEach(p => allPatternTypes.add(p.patternId)));

        for (const snapshot of snapshots) {
            const memberPatterns = new Set(snapshot.patterns.map(p => p.patternId));

            // Find patterns unique to this member
            const uniqueStrengths: string[] = [];
            snapshot.patterns.forEach(p => {
                const othersWithPattern = snapshots.filter(
                    s => s.userId !== snapshot.userId &&
                        s.patterns.some(op => op.patternId === p.patternId)
                );
                if (othersWithPattern.length === 0) {
                    uniqueStrengths.push(p.name);
                }
            });

            // Find complementary patterns (covers others' frictions)
            const complementaryPatterns: string[] = [];
            const memberStrengthLayers = new Set(
                snapshot.claims.filter(c => c.polarity === 'strength').map(c => c.layerId)
            );

            snapshots.forEach(other => {
                if (other.userId === snapshot.userId) return;
                const otherFrictionLayers = other.claims
                    .filter(c => c.polarity === 'friction')
                    .map(c => c.layerId);

                otherFrictionLayers.forEach(layer => {
                    if (memberStrengthLayers.has(layer)) {
                        complementaryPatterns.push(`Supports Layer ${layer}`);
                    }
                });
            });

            contributions.push({
                userId: snapshot.userId,
                uniqueStrengths,
                complementaryPatterns: [...new Set(complementaryPatterns)],
                roleAlignment: Math.round(70 + Math.random() * 30) // Placeholder
            });
        }

        return contributions;
    }

    private calculateCohesion(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): number {
        if (snapshots.length < 2) return 100;

        // Count shared patterns
        const patternCounts = new Map<string, number>();
        snapshots.forEach(s => {
            s.patterns.forEach(p => {
                patternCounts.set(p.patternId, (patternCounts.get(p.patternId) || 0) + 1);
            });
        });

        const sharedPatterns = Array.from(patternCounts.values()).filter(c => c >= snapshots.length / 2).length;
        const totalPatterns = patternCounts.size;

        return Math.round((sharedPatterns / Math.max(totalPatterns, 1)) * 100);
    }

    private calculateDiversity(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): number {
        const allPatterns = new Set<string>();
        snapshots.forEach(s => s.patterns.forEach(p => allPatterns.add(p.patternId)));

        const avgPatternsPerMember = snapshots.reduce((sum, s) => sum + s.patterns.length, 0) / snapshots.length;
        const uniqueRatio = allPatterns.size / (avgPatternsPerMember * snapshots.length);

        return Math.min(100, Math.round(uniqueRatio * 100));
    }

    private calculateBalance(
        snapshots: { userId: string; claims: readonly Claim[]; patterns: readonly Pattern[]; themes: readonly Theme[] }[]
    ): number {
        const allStrengthLayers = new Set<number>();
        const allFrictionLayers = new Set<number>();

        snapshots.forEach(s => {
            s.claims.forEach(c => {
                if (c.polarity === 'strength') allStrengthLayers.add(c.layerId);
                if (c.polarity === 'friction') allFrictionLayers.add(c.layerId);
            });
        });

        // Calculate how many friction layers are covered by someone's strength
        let coveredFrictions = 0;
        allFrictionLayers.forEach(layer => {
            if (allStrengthLayers.has(layer)) coveredFrictions++;
        });

        const coverage = allFrictionLayers.size > 0
            ? coveredFrictions / allFrictionLayers.size
            : 1;

        return Math.round(coverage * 100);
    }

    private async calculatePairCompatibility(
        userId1: string,
        userId2: string
    ): Promise<CompatibilityCell> {
        const snapshot1 = await osiaSnapshotStore.getLatestSnapshot(userId1);
        const snapshot2 = await osiaSnapshotStore.getLatestSnapshot(userId2);

        if (!snapshot1 || !snapshot2) {
            return { userId1, userId2, score: 50, synergies: [] };
        }

        // Simple pattern overlap
        const patterns1 = new Set(snapshot1.patterns.map(p => p.patternId));
        const patterns2 = new Set(snapshot2.patterns.map(p => p.patternId));
        const overlap = [...patterns1].filter(p => patterns2.has(p));

        const score = Math.round(50 + (overlap.length / Math.max(patterns1.size, patterns2.size)) * 50);

        return {
            userId1,
            userId2,
            score,
            synergies: overlap.slice(0, 3)
        };
    }

    private buildMemberContext(
        member: TeamMember,
        claims: readonly Claim[],
        patterns: readonly Pattern[],
        themes: readonly Theme[]
    ): string {
        let context = `=== ${member.name || 'Team Member'} (${member.role || 'Member'}) ===\n\n`;

        if (patterns.length > 0) {
            context += 'PATTERNS:\n';
            patterns.forEach(p => context += `- ${p.name}: ${p.oneLiner}\n`);
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

    private async getTeamName(teamId: string): Promise<string | null> {
        try {
            const teams = await db.getCollection<{ id: string; name: string }>('teams');
            const team = teams.find(t => t.id === teamId);
            return team?.name || null;
        } catch {
            return null;
        }
    }

    private async storeProfile(profile: TeamDynamicsProfile): Promise<void> {
        try {
            const profiles = await db.getCollection<TeamDynamicsProfile>('team_dynamics');
            const filtered = profiles.filter(p => p.teamId !== profile.teamId);
            filtered.push(profile);
            await db.saveCollection('team_dynamics', filtered);
        } catch (e: any) {
            console.error('[TeamDynamics] Failed to store profile:', e.message);
        }
    }

    private async storeReport(report: AITeamReport): Promise<void> {
        try {
            const reports = await db.getCollection<AITeamReport>('team_ai_reports');
            const filtered = reports.filter(r => r.teamId !== report.teamId);
            filtered.push(report);
            await db.saveCollection('team_ai_reports', filtered);
        } catch (e: any) {
            console.error('[TeamDynamics] Failed to store report:', e.message);
        }
    }
}

export const teamDynamicsService = new TeamDynamicsService();
