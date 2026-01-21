/**
 * Organization Culture Service — v1.0
 * 
 * Aggregates OSIA data across an entire organization to map culture patterns.
 * 
 * Features:
 * - Aggregate all org members' claims, patterns, and themes
 * - Identify cultural strengths and blind spots
 * - Department-level breakdowns
 * - AI-powered culture reports (costs credits)
 */

import { db } from '../db/JsonDb';
import { Claim, Pattern, Theme } from '../types/osia-types';
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { aiCreditsService } from './AICreditsService';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface OrgMember {
    userId: string;
    name?: string;
    role?: string;
    department?: string;
    teamId?: string;
}

export interface OrgCultureProfile {
    orgId: string;
    orgName: string;
    memberCount: number;
    aggregatedAt: string;

    // Culture metrics
    cultureTraits: CultureTrait[];
    departmentBreakdowns: DepartmentBreakdown[];
    culturalStrengths: string[];
    culturalBlindSpots: string[];

    // Scores
    alignmentScore: number; // 0-100, how unified the culture is
    diversityIndex: number; // 0-100, variety in patterns
    engagementPotential: number; // 0-100, based on pattern types
}

export interface CultureTrait {
    name: string;
    prevalence: number; // 0-1
    description: string;
    associatedPatterns: string[];
}

export interface DepartmentBreakdown {
    department: string;
    memberCount: number;
    dominantPatterns: string[];
    uniqueStrengths: string[];
    alignmentWithOrg: number; // 0-100
}

export interface AIOrgCultureReport {
    orgId: string;
    generatedAt: string;
    executiveSummary: string;
    cultureArchetype: string;
    coreValues: string[];
    hiddenValues: string[];
    culturalNarratives: CulturalNarrative[];
    strengthsAnalysis: string;
    risksAnalysis: string;
    departmentSynergies: string;
    recommendations: OrgRecommendation[];
}

export interface CulturalNarrative {
    title: string;
    description: string;
    evidence: string[];
}

export interface OrgRecommendation {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    targetAudience: string;
}

// ============================================================================
// ORG CULTURE SERVICE
// ============================================================================

class OrgCultureService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
        }
    }

    /**
     * Get organization culture profile (aggregated, no AI)
     */
    async getOrgCulture(orgId: string): Promise<OrgCultureProfile | null> {
        console.log(`[OrgCulture] Aggregating culture for org ${orgId}`);

        const members = await this.getOrgMembers(orgId);
        if (members.length === 0) {
            console.log('[OrgCulture] No members found');
            return null;
        }

        // Collect all snapshots
        const memberData: {
            member: OrgMember;
            claims: readonly Claim[];
            patterns: readonly Pattern[];
            themes: readonly Theme[]
        }[] = [];

        for (const member of members) {
            const snapshot = await osiaSnapshotStore.getLatestSnapshot(member.userId);
            if (snapshot) {
                memberData.push({
                    member,
                    claims: snapshot.claims,
                    patterns: snapshot.patterns,
                    themes: snapshot.themes
                });
            }
        }

        if (memberData.length === 0) {
            console.log('[OrgCulture] No member OSIA data found');
            return null;
        }

        // Calculate culture traits
        const cultureTraits = this.calculateCultureTraits(memberData);

        // Calculate department breakdowns
        const departmentBreakdowns = this.calculateDepartmentBreakdowns(memberData);

        // Identify strengths and blind spots
        const { strengths, blindSpots } = this.identifyStrengthsAndBlindSpots(memberData);

        // Calculate scores
        const alignmentScore = this.calculateAlignment(memberData);
        const diversityIndex = this.calculateDiversity(memberData);
        const engagementPotential = this.calculateEngagement(memberData);

        // Get org name
        const orgName = await this.getOrgName(orgId) || `Organization ${orgId}`;

        const profile: OrgCultureProfile = {
            orgId,
            orgName,
            memberCount: memberData.length,
            aggregatedAt: new Date().toISOString(),
            cultureTraits,
            departmentBreakdowns,
            culturalStrengths: strengths,
            culturalBlindSpots: blindSpots,
            alignmentScore,
            diversityIndex,
            engagementPotential
        };

        await this.storeProfile(profile);
        return profile;
    }

    /**
     * Generate AI-powered culture report (costs credits)
     */
    async generateAIReport(
        requestingUserId: string,
        orgId: string
    ): Promise<AIOrgCultureReport | null> {
        if (!this.anthropic) {
            console.log('[OrgCulture] AI not available');
            return null;
        }

        // Check credits
        const creditCheck = await aiCreditsService.canGenerate(requestingUserId, 'org_culture');
        if (!creditCheck.allowed) {
            console.log(`[OrgCulture] Insufficient credits for user ${requestingUserId}`);
            return null;
        }

        console.log(`[OrgCulture] Generating AI report for org ${orgId}`);

        const members = await this.getOrgMembers(orgId);
        const memberContexts: string[] = [];

        for (const member of members.slice(0, 50)) { // Limit to 50 for token efficiency
            const snapshot = await osiaSnapshotStore.getLatestSnapshot(member.userId);
            if (snapshot) {
                memberContexts.push(this.buildMemberContext(member, snapshot.patterns, snapshot.claims));
            }
        }

        if (memberContexts.length < 3) {
            console.log('[OrgCulture] Need at least 3 members with data');
            return null;
        }

        const systemPrompt = `You are an expert organizational psychologist and culture analyst. You identify the hidden cultural patterns, unspoken values, and collective dynamics that shape how organizations truly function.`;

        const userPrompt = `Analyze this organization's collective culture based on ${memberContexts.length} member profiles:

${memberContexts.join('\n\n---\n\n')}

Generate a comprehensive culture analysis in JSON format:
{
    "executiveSummary": "...(2-3 sentences capturing the org's cultural DNA)...",
    "cultureArchetype": "...(e.g., 'The Innovative Pioneer', 'The Steady Builder')...",
    "coreValues": ["value that's openly practiced", "..."],
    "hiddenValues": ["unspoken value that actually drives behavior", "..."],
    "culturalNarratives": [
        {
            "title": "...",
            "description": "...",
            "evidence": ["pattern from members", "..."]
        }
    ],
    "strengthsAnalysis": "...(what the culture excels at)...",
    "risksAnalysis": "...(cultural risks or blind spots)...",
    "departmentSynergies": "...(how different areas complement each other)...",
    "recommendations": [
        {
            "title": "...",
            "description": "...",
            "priority": "high|medium|low",
            "targetAudience": "leadership|managers|all"
        }
    ]
}`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 6000,
                messages: [{ role: 'user', content: userPrompt }],
                system: systemPrompt
            });

            const content = response.content[0];
            if (content.type !== 'text') return null;

            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            // Deduct credits
            await aiCreditsService.deductCredits(requestingUserId, 'org_culture', { orgId });

            const report: AIOrgCultureReport = {
                orgId,
                generatedAt: new Date().toISOString(),
                ...parsed
            };

            await this.storeReport(report);
            console.log(`[OrgCulture] AI report generated for org ${orgId}`);
            return report;

        } catch (error: any) {
            console.error('[OrgCulture] AI report error:', error.message);
            return null;
        }
    }

    // ========================================================================
    // AGGREGATION ALGORITHMS
    // ========================================================================

    private calculateCultureTraits(
        memberData: { member: OrgMember; patterns: readonly Pattern[]; claims: readonly Claim[] }[]
    ): CultureTrait[] {
        const patternCounts = new Map<string, { name: string; count: number; patterns: Set<string> }>();
        const total = memberData.length;

        for (const data of memberData) {
            for (const pattern of data.patterns) {
                if (!patternCounts.has(pattern.patternId)) {
                    patternCounts.set(pattern.patternId, {
                        name: pattern.name,
                        count: 0,
                        patterns: new Set()
                    });
                }
                const entry = patternCounts.get(pattern.patternId)!;
                entry.count++;
                entry.patterns.add(pattern.oneLiner || pattern.name);
            }
        }

        const traits: CultureTrait[] = [];
        patternCounts.forEach((value, key) => {
            const prevalence = value.count / total;
            if (prevalence >= 0.3) { // 30%+ of org has this
                traits.push({
                    name: value.name,
                    prevalence,
                    description: `${Math.round(prevalence * 100)}% of the organization exhibits this pattern`,
                    associatedPatterns: Array.from(value.patterns).slice(0, 3)
                });
            }
        });

        return traits.sort((a, b) => b.prevalence - a.prevalence);
    }

    private calculateDepartmentBreakdowns(
        memberData: { member: OrgMember; patterns: readonly Pattern[]; claims: readonly Claim[] }[]
    ): DepartmentBreakdown[] {
        const departments = new Map<string, {
            members: typeof memberData;
            patterns: Map<string, number>;
        }>();

        // Group by department
        for (const data of memberData) {
            const dept = data.member.department || 'General';
            if (!departments.has(dept)) {
                departments.set(dept, { members: [], patterns: new Map() });
            }
            const deptData = departments.get(dept)!;
            deptData.members.push(data);
            for (const pattern of data.patterns) {
                deptData.patterns.set(pattern.name, (deptData.patterns.get(pattern.name) || 0) + 1);
            }
        }

        // Calculate org-wide pattern distribution for comparison
        const orgPatterns = new Map<string, number>();
        memberData.forEach(d => d.patterns.forEach(p =>
            orgPatterns.set(p.name, (orgPatterns.get(p.name) || 0) + 1)
        ));

        const breakdowns: DepartmentBreakdown[] = [];
        departments.forEach((deptData, deptName) => {
            // Find dominant patterns
            const sortedPatterns = Array.from(deptData.patterns.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name]) => name);

            // Find unique strengths (patterns more prevalent in dept than org)
            const uniqueStrengths: string[] = [];
            deptData.patterns.forEach((count, name) => {
                const deptPrevalence = count / deptData.members.length;
                const orgPrevalence = (orgPatterns.get(name) || 0) / memberData.length;
                if (deptPrevalence > orgPrevalence * 1.5) {
                    uniqueStrengths.push(name);
                }
            });

            // Calculate alignment with org
            let alignmentSum = 0;
            let alignmentCount = 0;
            deptData.patterns.forEach((count, name) => {
                const deptPrevalence = count / deptData.members.length;
                const orgPrevalence = (orgPatterns.get(name) || 0) / memberData.length;
                alignmentSum += 1 - Math.abs(deptPrevalence - orgPrevalence);
                alignmentCount++;
            });
            const alignment = alignmentCount > 0 ? Math.round((alignmentSum / alignmentCount) * 100) : 50;

            breakdowns.push({
                department: deptName,
                memberCount: deptData.members.length,
                dominantPatterns: sortedPatterns,
                uniqueStrengths: uniqueStrengths.slice(0, 3),
                alignmentWithOrg: alignment
            });
        });

        return breakdowns.sort((a, b) => b.memberCount - a.memberCount);
    }

    private identifyStrengthsAndBlindSpots(
        memberData: { member: OrgMember; claims: readonly Claim[]; patterns: readonly Pattern[] }[]
    ): { strengths: string[]; blindSpots: string[] } {
        const strengthLayers = new Map<number, number>();
        const frictionLayers = new Map<number, number>();
        const total = memberData.length;

        for (const data of memberData) {
            for (const claim of data.claims) {
                if (claim.polarity === 'strength') {
                    strengthLayers.set(claim.layerId, (strengthLayers.get(claim.layerId) || 0) + 1);
                } else if (claim.polarity === 'friction') {
                    frictionLayers.set(claim.layerId, (frictionLayers.get(claim.layerId) || 0) + 1);
                }
            }
        }

        const layerNames: Record<number, string> = {
            1: 'Core Disposition',
            2: 'Energy Management',
            3: 'Cognitive Processing',
            4: 'Emotional Foundation',
            5: 'Creative Expression',
            6: 'Operational Style',
            7: 'Relational Dynamics'
        };

        const strengths: string[] = [];
        const blindSpots: string[] = [];

        strengthLayers.forEach((count, layer) => {
            if (count / total >= 0.4) {
                strengths.push(layerNames[layer] || `Layer ${layer}`);
            }
        });

        frictionLayers.forEach((count, layer) => {
            if (count / total >= 0.4) {
                blindSpots.push(layerNames[layer] || `Layer ${layer}`);
            }
        });

        return { strengths, blindSpots };
    }

    private calculateAlignment(
        memberData: { patterns: readonly Pattern[] }[]
    ): number {
        if (memberData.length < 2) return 100;

        const patternCounts = new Map<string, number>();
        memberData.forEach(d => d.patterns.forEach(p =>
            patternCounts.set(p.patternId, (patternCounts.get(p.patternId) || 0) + 1)
        ));

        // Count patterns that 50%+ of org has
        const commonPatterns = Array.from(patternCounts.values())
            .filter(c => c >= memberData.length * 0.5).length;

        return Math.min(100, Math.round((commonPatterns / Math.max(patternCounts.size, 1)) * 100 + 30));
    }

    private calculateDiversity(
        memberData: { patterns: readonly Pattern[] }[]
    ): number {
        const uniquePatterns = new Set<string>();
        memberData.forEach(d => d.patterns.forEach(p => uniquePatterns.add(p.patternId)));

        const avgPatternsPerPerson = memberData.reduce((sum, d) => sum + d.patterns.length, 0) / memberData.length;
        const expectedUnique = avgPatternsPerPerson * memberData.length * 0.3;

        return Math.min(100, Math.round((uniquePatterns.size / Math.max(expectedUnique, 1)) * 100));
    }

    private calculateEngagement(
        memberData: { patterns: readonly Pattern[]; claims: readonly Claim[] }[]
    ): number {
        // Based on pattern stability and claim balance
        let totalStability = 0;
        let stabilityCount = 0;

        memberData.forEach(d => {
            d.patterns.forEach(p => {
                totalStability += p.stabilityIndex;
                stabilityCount++;
            });
        });

        const avgStability = stabilityCount > 0 ? totalStability / stabilityCount : 0.5;
        return Math.round(avgStability * 100);
    }

    private buildMemberContext(
        member: OrgMember,
        patterns: readonly Pattern[],
        claims: readonly Claim[]
    ): string {
        const dept = member.department ? `[${member.department}]` : '';
        const role = member.role || 'Member';
        let context = `=== ${role} ${dept} ===\n`;

        if (patterns.length > 0) {
            context += 'Patterns: ' + patterns.map(p => p.name).slice(0, 5).join(', ') + '\n';
        }

        const strengths = claims.filter(c => c.polarity === 'strength').slice(0, 3);
        if (strengths.length > 0) {
            context += 'Strengths: ' + strengths.map(c => c.text).join('; ') + '\n';
        }

        return context;
    }

    private async getOrgMembers(orgId: string): Promise<OrgMember[]> {
        try {
            const members = await db.getCollection<OrgMember & { orgId: string }>('org_members');
            return members.filter(m => m.orgId === orgId);
        } catch {
            return [];
        }
    }

    private async getOrgName(orgId: string): Promise<string | null> {
        try {
            const orgs = await db.getCollection<{ id: string; name: string }>('organizations');
            return orgs.find(o => o.id === orgId)?.name || null;
        } catch {
            return null;
        }
    }

    private async storeProfile(profile: OrgCultureProfile): Promise<void> {
        try {
            const profiles = await db.getCollection<OrgCultureProfile>('org_cultures');
            const filtered = profiles.filter(p => p.orgId !== profile.orgId);
            filtered.push(profile);
            await db.saveCollection('org_cultures', filtered);
        } catch (e: any) {
            console.error('[OrgCulture] Failed to store profile:', e.message);
        }
    }

    private async storeReport(report: AIOrgCultureReport): Promise<void> {
        try {
            const reports = await db.getCollection<AIOrgCultureReport>('org_ai_reports');
            const filtered = reports.filter(r => r.orgId !== report.orgId);
            filtered.push(report);
            await db.saveCollection('org_ai_reports', filtered);
        } catch (e: any) {
            console.error('[OrgCulture] Failed to store report:', e.message);
        }
    }
}

export const orgCultureService = new OrgCultureService();
