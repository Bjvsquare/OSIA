import { astrologyService, BirthData, Blueprint, PlanetPosition } from './AstrologyService';
import { blueprintService, TraitProbability } from './BlueprintService';
import { narrativeSynthesizer } from './NarrativeSynthesizer';
import { userService } from './UserService';
import { osiaIntelligenceService } from './OSIAIntelligenceService';
import { Signal } from './ClaimEngine';

export class OriginSeedService {

    // The Core Orchestration Method
    async generateFoundationalBlueprint(userId: string, birthData: BirthData): Promise<void> {
        console.log(`[OriginSeed] Generating blueprint for user ${userId}`);

        // 1. Generate the Foundational Blueprint (The Signal Pattern)
        const blueprint = await astrologyService.calculateBlueprint(birthData);

        // 2. Persist the Raw Signal Snapshot (The Source of Truth)
        const signalId = await blueprintService.createSignalSnapshot(userId, blueprint, {
            calcVersion: 'v1.2',
            quality: 'high',
            latitude: birthData.latitude,
            longitude: birthData.longitude
        });

        // 3. Translate Pattern to 15-Layer Model (The Translation Layer)
        const traits = await this.translateBlueprintToTraits(blueprint, userId);

        // 4. Persist the Narrative Snapshot (The Derived Reflection)
        await blueprintService.createSnapshot(userId, traits, 'foundational_blueprint', signalId);

        console.log(`[OriginSeed] Blueprint graph generation complete for ${userId}`);
    }

    // Legacy methods for backward compatibility
    async saveProfile(userId: string, profile: any): Promise<void> {
        if (!profile.latitude || !profile.longitude) {
            throw new Error("Missing coordinates: Latitude and Longitude are required for OSIA v1.2");
        }
        if (!profile.timezone) {
            throw new Error("Missing timezone: IANA timezone string or offset is required");
        }

        return this.generateFoundationalBlueprint(userId, {
            date: profile.birthDate || profile.date,
            time: profile.birthTime || profile.time,
            location: profile.birthLocation || profile.location,
            latitude: profile.latitude,
            longitude: profile.longitude,
            timezone: profile.timezone
        });
    }

    async getProfile(userId: string): Promise<any> {
        const snapshot = await blueprintService.getLatestSnapshot(userId);
        if (!snapshot) return null;
        return {
            traits: snapshot.traits,
            timestamp: snapshot.timestamp,
            version: 'v1.2'
        };
    }

    async getHypotheses(userId: string): Promise<TraitProbability[]> {
        console.log(`[OriginSeed] Fetching hypotheses for user ${userId}`);

        // 1. Fetch the latest Signal Snapshot for this user
        const blueprint = await blueprintService.getLatestSignal(userId);
        if (!blueprint) {
            throw new Error("No foundational signals found. Please complete initial sync.");
        }

        // 2. Generate the 15 traits dynamically (Iteration 0)
        return await this.translateBlueprintToTraits(blueprint, userId);
    }

    async refineHypothesis(userId: string, layerId: number, iteration: number): Promise<TraitProbability> {
        console.log(`[OriginSeed] Refining hypothesis for user ${userId}, Layer ${layerId}, Iteration ${iteration}`);

        const blueprint = await blueprintService.getLatestSignal(userId);
        if (!blueprint) throw new Error("Signal lost.");

        // Prefer AI synthesis when available, fall back to rule-based
        const { narrative } = await narrativeSynthesizer.synthesizeWithAI(layerId, blueprint, userId, iteration);

        // Calculate score with same logic as initial
        const primaryPlanetName = this.getPlanetNameForLayer(layerId);
        const aspects = blueprint.aspects.filter(a => a.planet1 === primaryPlanetName || a.planet2 === primaryPlanetName);
        const planet = blueprint.planets.find(p => p.name === primaryPlanetName);
        const aspectWeight = Math.min(0.25, aspects.length * 0.05);
        const houseWeight = planet ? (blueprint.houses.distribution[`h${planet.house}`] || 0) * 0.35 : 0;
        const score = Math.min(0.95, 0.45 + aspectWeight + houseWeight);

        return {
            layerId,
            traitId: `L${layerId.toString().padStart(2, '0')}_${OriginSeedService.LAYER_KEYS[layerId]}`,
            score: parseFloat(score.toFixed(3)),
            confidence: 0.95,
            description: narrative
        };
    }

    async finalizeAssessment(userId: string, traits: TraitProbability[]): Promise<void> {
        console.log(`[OriginSeed] Finalizing assessment for user ${userId}`);
        const blueprint = await blueprintService.getLatestSignal(userId);
        if (!blueprint) throw new Error("Finalization failed: Signals missing.");

        const signalId = await blueprintService.getLatestSignalId(userId);
        await blueprintService.createSnapshot(userId, traits, 'refinement_assessment', signalId);

        // Mark onboarding as complete in the identity system
        await userService.markOnboardingComplete(userId);

        // Generate initial OSIA output from the assessment traits
        console.log(`[OriginSeed] Generating initial OSIA output for user ${userId}...`);
        try {
            // Convert traits to OSIA signals format
            const osiaSignals: Signal[] = traits.map((trait, index) => ({
                signalId: `SIG.ONBOARD.${userId}.${index}`,
                userId,
                questionId: `TRAIT.${trait.traitId}`,
                layerIds: [trait.layerId],
                rawValue: trait.description || `Trait ${trait.traitId}`,
                normalizedValue: trait.description || `Trait ${trait.traitId}`,
                timestamp: new Date().toISOString(),
                source: 'onboarding' as const
            }));

            // Process signals through OSIA intelligence service
            await osiaIntelligenceService.processSignals(
                userId,
                osiaSignals,
                'onboarding',
                { includeRelationalConnectors: true }
            );
            console.log(`[OriginSeed] OSIA output generated successfully for user ${userId}`);
        } catch (err) {
            console.error(`[OriginSeed] Failed to generate OSIA output for ${userId}:`, err);
            // Don't throw - OSIA generation failure shouldn't block onboarding
        }
    }

    private static readonly LAYER_KEYS: Record<number, string> = {
        1: 'CORE_DISPOSITION',
        2: 'ENERGY_ORIENTATION',
        3: 'COGNITIVE_METHOD',
        4: 'INTERNAL_FOUNDATION',
        5: 'CREATIVE_EXPRESSION',
        6: 'OPERational_RHYTHM',
        7: 'RELATIONAL_STANCE',
        8: 'TRANSFORMATIVE_POTENTIAL',
        9: 'EXPANSIVE_ORIENTATION',
        10: 'ARCHITECTURAL_FOCUS',
        11: 'SOCIAL_RESONANCE',
        12: 'INTEGRATIVE_DEPTH',
        13: 'NAVIGATIONAL_INTERFACE',
        14: 'EVOLUTIONARY_TRAJECTORY',
        15: 'SYSTEMIC_INTEGRATION'
    };

    // The Logic that maps origin signals to the 15-Layer Intelligence Model
    private async translateBlueprintToTraits(blueprint: Blueprint, userId: string): Promise<TraitProbability[]> {
        const traits: TraitProbability[] = [];

        // Generate the 15 traits using AI-powered Narrative Synthesizer
        for (let i = 1; i <= 15; i++) {
            try {
                const { narrative } = await narrativeSynthesizer.synthesizeWithAI(i, blueprint, userId, 0);

                // Evidence-Based Scoring: Driven by signal density
                const primaryPlanetName = this.getPlanetNameForLayer(i);
                const aspects = blueprint.aspects.filter(a => a.planet1 === primaryPlanetName || a.planet2 === primaryPlanetName);
                const planet = blueprint.planets.find(p => p.name === primaryPlanetName);

                const aspectWeight = Math.min(0.25, aspects.length * 0.05);
                const houseWeight = planet ? (blueprint.houses.distribution[`h${planet.house}`] || 0) * 0.35 : 0;

                const baseScore = 0.45;
                const score = Math.min(0.95, baseScore + aspectWeight + houseWeight);

                traits.push({
                    layerId: i,
                    traitId: `L${i.toString().padStart(2, '0')}_${OriginSeedService.LAYER_KEYS[i]}`,
                    score: parseFloat(score.toFixed(3)),
                    confidence: 0.95,
                    description: narrative
                });
            } catch (err) {
                console.error(`[OriginSeed] AI synthesis failed for layer ${i}, using rule-based:`, err);
                const usedHashes = new Set<string>();
                const { narrative } = narrativeSynthesizer.synthesizeNarrative(i, blueprint, userId, usedHashes);

                const primaryPlanetName = this.getPlanetNameForLayer(i);
                const aspects = blueprint.aspects.filter(a => a.planet1 === primaryPlanetName || a.planet2 === primaryPlanetName);
                const planet = blueprint.planets.find(p => p.name === primaryPlanetName);
                const aspectWeight = Math.min(0.25, aspects.length * 0.05);
                const houseWeight = planet ? (blueprint.houses.distribution[`h${planet.house}`] || 0) * 0.35 : 0;
                const score = Math.min(0.95, 0.45 + aspectWeight + houseWeight);

                traits.push({
                    layerId: i,
                    traitId: `L${i.toString().padStart(2, '0')}_${OriginSeedService.LAYER_KEYS[i]}`,
                    score: parseFloat(score.toFixed(3)),
                    confidence: 0.95,
                    description: narrative
                });
            }
        }

        return traits;
    }

    private getPlanetNameForLayer(layerId: number): string {
        switch (layerId) {
            case 1: return 'Sun';
            case 2: return 'Mars';
            case 3: return 'Mercury';
            case 4: return 'Saturn';
            case 5: return 'Jupiter';
            case 6: return 'Saturn';
            case 7: return 'Moon';
            case 8: return 'Mars';
            case 9: return 'Mercury';
            case 10: return 'Venus';
            case 11: return 'Saturn';
            case 12: return 'Sun';
            case 13: return 'Moon';
            case 14: return 'Jupiter';
            case 15: return 'Pluto';
            default: return 'Sun';
        }
    }
}

export const originSeedService: OriginSeedService = new OriginSeedService();
