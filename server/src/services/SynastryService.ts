import { blueprintService } from './BlueprintService';
import { Blueprint, PlanetPosition } from './AstrologyService';

export interface InteractionDetail {
    potential: string;
    shadow: string;
    protocol: string;
}

// --- Deep Dive Types ---

export interface LayerComparison {
    layerId: number;
    layerName: string;
    user1Score: number;
    user2Score: number;
    alignment: number;      // 0-1 how aligned
    synergy: boolean;       // true if creates positive dynamic
    gap: number;            // absolute difference
    insight: string;
}

export interface SynergyZone {
    area: string;
    strength: number;
    description: string;
    layers: number[];
}

export interface FrictionZone {
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    layers: number[];
    improvementTip: string;
}

export interface Recommendation {
    id: string;
    title: string;
    description: string;
    category: 'communication' | 'understanding' | 'growth' | 'balance';
    priority: number;
    affectedLayers: number[];
    shareable: boolean;
}

export interface DeepDiveData {
    layerComparison: LayerComparison[];
    synergyZones: SynergyZone[];
    frictionZones: FrictionZone[];
    recommendations: Recommendation[];
    overallAlignment: number;
}

export interface SynastryResult {
    score: number;
    summary: string;
    highlights: any[];
    elements: {
        user1: { activation: number; structure: number; intellection: number; fluidity: number; };
        user2: { activation: number; structure: number; intellection: number; fluidity: number; };
        resonance: { activation: number; structure: number; intellection: number; fluidity: number; };
    };
    planets: {
        user1: any[];
        user2: any[];
    };
    aspects: {
        p1: string;
        p2: string;
        role1?: string;
        role2?: string;
        type: string;
        orb: number;
        substance: InteractionDetail;
        psychologicalFocus?: string;
    }[];
    deepDive?: DeepDiveData;
}


export class SynastryService {

    async calculateSynastry(userId1: string, userId2: string): Promise<SynastryResult> {
        console.log(`[SynastryService] Calculating dynamics between ${userId1} and ${userId2} `);

        const b1 = await blueprintService.getLatestSignal(userId1);
        const b2 = await blueprintService.getLatestSignal(userId2);

        console.log(`[SynastryService] Blueprints loaded: User1 = ${!!b1}, User2 = ${!!b2} `);

        if (!b1 || !b2) {
            console.log(`[SynastryService] Aborting: Missing blueprint data`);
            return {
                score: 0.5,
                summary: "Insufficient blueprint data to calculate deep resonance. Both users must complete their initial sync.",
                highlights: [],
                elements: {
                    user1: { activation: 0, structure: 0, intellection: 0, fluidity: 0 },
                    user2: { activation: 0, structure: 0, intellection: 0, fluidity: 0 },
                    resonance: { activation: 0, structure: 0, intellection: 0, fluidity: 0 }
                },
                aspects: [],
                planets: { user1: [], user2: [] }
            };
        }

        try {
            // 1. Calculate Inter-Aspects
            const interAspects = this.calculateInterAspects(b1, b2);
            console.log(`[SynastryService] Calculated ${interAspects.length} inter - aspects`);

            // 2. Calculate Elemental Resonance
            const elementComparison = this.calculateElementComparison(b1, b2);

            // 3. Generate Score & Highlights
            const score = this.calculateResonanceScore(interAspects);
            const highlights = this.generateHighlights(interAspects);
            const summary = this.generateNarrativeSummary(interAspects, b1, b2);

            // 4. Calculate Deep Dive Data
            const deepDive = this.calculateDeepDive(b1, b2);

            console.log(`[SynastryService] Calculation complete. Summary length: ${summary.length}, DeepDive layers: ${deepDive.layerComparison.length}`);

            return {
                score,
                summary,
                highlights,
                elements: elementComparison,
                planets: {
                    user1: b1.planets,
                    user2: b2.planets
                },
                aspects: interAspects.map((a, index) => ({
                    p1: a.p1, // Keep raw name for mapping
                    p2: a.p2,
                    role1: this.getRoleName(a.p1),
                    role2: this.getRoleName(a.p2),
                    type: this.getInteractionName(a.type),
                    orb: a.orb,
                    substance: this.getPsychologicalSubstance(a, index),
                    psychologicalFocus: this.getPsychologicalTag(a.type)
                })),
                deepDive
            };
        } catch (error) {
            console.error(`[SynastryService] Calculation error: `, error);
            throw error;
        }
    }

    private getRoleName(planet: string): string {
        const roles: Record<string, string> = {
            'Sun': 'Identity Pulse',
            'Moon': 'Internal Architecture',
            'Mercury': 'Cognitive Loop',
            'Venus': 'Value Field',
            'Mars': 'Drive Frequency',
            'Jupiter': 'Expansion Vector',
            'Saturn': 'Stability Base',
            'Uranus': 'Innovation Signal',
            'Neptune': 'Visionary Prism',
            'Pluto': 'Depth Resolution'
        };
        return roles[planet] || planet;
    }

    private getInteractionName(aspect: string): string {
        const interactions: Record<string, string> = {
            'Conjunction': 'Convergence',
            'Opposition': 'Polarity',
            'Trine': 'Resonance',
            'Square': 'Friction',
            'Sextile': 'Synthesis'
        };
        return interactions[aspect] || aspect;
    }

    private calculateElementComparison(b1: Blueprint, b2: Blueprint) {
        return {
            user1: {
                activation: b1.elements.fire,
                structure: b1.elements.earth,
                intellection: b1.elements.air,
                fluidity: b1.elements.water
            },
            user2: {
                activation: b2.elements.fire,
                structure: b2.elements.earth,
                intellection: b2.elements.air,
                fluidity: b2.elements.water
            },
            resonance: {
                activation: Math.min(b1.elements.fire, b2.elements.fire),
                structure: Math.min(b1.elements.earth, b2.elements.earth),
                intellection: Math.min(b1.elements.air, b2.elements.air),
                fluidity: Math.min(b1.elements.water, b2.elements.water)
            }
        };
    }

    private calculateInterAspects(b1: Blueprint, b2: Blueprint) {
        const aspects: any[] = [];
        const validAspects = [
            { name: 'Conjunction', angle: 0, orb: 8, weight: 1.0 },
            { name: 'Opposition', angle: 180, orb: 8, weight: 0.8 },
            { name: 'Trine', angle: 120, orb: 7, weight: 0.9 },
            { name: 'Square', angle: 90, orb: 7, weight: 0.7 },
            { name: 'Sextile', angle: 60, orb: 5, weight: 0.5 }
        ];

        for (const p1 of b1.planets) {
            for (const p2 of b2.planets) {
                let d = Math.abs(p1.longitude - p2.longitude);
                if (d > 180) d = 360 - d;

                for (const aspect of validAspects) {
                    if (Math.abs(d - aspect.angle) <= aspect.orb) {
                        aspects.push({
                            p1: p1.name,
                            p2: p2.name,
                            type: aspect.name,
                            weight: aspect.weight,
                            orb: Math.abs(d - aspect.angle)
                        });
                    }
                }
            }
        }
        return aspects;
    }

    private calculateResonanceScore(aspects: any[]): number {
        if (aspects.length === 0) return 0.5;
        const rawScore = aspects.reduce((sum, a) => sum + a.weight, 0);
        // Normalize to a 0.1 - 0.99 range
        return Math.min(0.99, 0.4 + (rawScore / 10));
    }

    private generateHighlights(aspects: any[]): string[] {
        const highlights: string[] = [];
        // Group by high weight aspects
        const topAspects = aspects.sort((a, b) => b.weight - a.weight).slice(0, 3);

        for (const a of topAspects) {
            if (a.p1 === 'Sun' && a.p2 === 'Moon' || a.p1 === 'Moon' && a.p2 === 'Sun') {
                highlights.push("Core Systemic Harmony");
            } else if (a.p1 === 'Venus' && a.p2 === 'Mars' || a.p1 === 'Mars' && a.p2 === 'Venus') {
                highlights.push("High Kinetic Attraction");
            } else if (a.p1 === 'Mercury' && a.p2 === 'Mercury') {
                highlights.push("Fluid Cognitive Loop");
            } else if (a.type === 'Trine' && (a.p1 === 'Jupiter' || a.p2 === 'Jupiter')) {
                highlights.push("Expansive Mutual Potential");
            }
        }

        if (highlights.length === 0 && aspects.length > 0) {
            highlights.push("Balanced Interaction Flow");
        }

        return highlights;
    }

    private generateNarrativeSummary(aspects: any[], b1: Blueprint, b2: Blueprint): string {
        if (aspects.length === 0) return "A quiet, complementary dynamic. You provide space for each other's individual architectures without direct friction.";

        const harmonyAspects = aspects.filter(a => a.type === 'Trine' || a.type === 'Sextile' || a.type === 'Conjunction');
        const frictionAspects = aspects.filter(a => a.type === 'Square' || a.type === 'Opposition');

        if (harmonyAspects.length > frictionAspects.length * 1.5) {
            return "A highly resonant Field. Your core patterns reinforce each other, creating a shared frequency that feels both stabilizing and natural.";
        } else if (frictionAspects.length > harmonyAspects.length) {
            return "A dynamic of high-frequency tension. This connection triggers significant growth through contrast and the negotiation of differing perspectives.";
        } else {
            return "A complex, multifaceted loop. You share significant touchpoints that alternate between support and challenge, driving a deep and evolving shared awareness.";
        }
    }

    private getPsychologicalSubstance(aspect: any, index: number = 0): InteractionDetail {
        const combinations: Record<string, InteractionDetail> = {
            'Sun-Moon': {
                potential: 'Deep systemic harmony where identity and emotional needs operate as a unified field.',
                shadow: 'Over-identification with the other\'s internal state, leading to a loss of personal boundaries.',
                protocol: 'Systemic Differentiation: Practice 5 minutes of solo grounding to re-establish individual pulse.'
            },
            'Venus-Mars': {
                potential: 'High-frequency kinetic synergy that transforms shared values into immediate, decisive action.',
                shadow: 'Impulsive competition or "burnout" cycles from over-engagement and lack of recovery.',
                protocol: 'Paced Engagement: Verify shared value alignment explicitly before initiating high-energy tasks.'
            },
            'Mercury-Mercury': {
                potential: 'Exceptional cognitive resonance and shared mental shorthand, facilitating rapid problem-solving.',
                shadow: '"Echo Chamber" effects where critical thinking is sacrificed for the comfort of consensus.',
                protocol: 'Devil\'s Advocate: One partner should intentionally challenge the consensus to sharpen mental clarity.'
            },
            'Jupiter-Sun': {
                potential: 'Expansive boost to the personal field, amplifying confidence and creating a sense of unlimited potential.',
                shadow: 'Grandiosity or over-extension, where ambition outpaces sustainable structural support.',
                protocol: 'Feasibility Check: Ground expansive visions with a concrete 3-step action plan for stability.'
            },
            'Saturn-Moon': {
                potential: 'Grounding, stabilizing influence that provides a base for internal exchanges and long-term psychic safety.',
                shadow: 'Emotional constriction or the feeling of being "weighed down" by perceived responsibilities.',
                protocol: 'Vulnerability Ritual: Allocate "structure-free" time for raw emotional expression without judgment.'
            },
            'Uranus-Mercury': {
                potential: 'Sudden bursts of unconventional insight and cognitive breakthroughs that bypass traditional logic.',
                shadow: 'Intellectual instability or "erratic loops" that make shared long-term planning difficult.',
                protocol: 'Insight Anchoring: Document sudden breakthroughs immediately to translate flashes of genius into usable data.'
            },
            'Neptune-Moon': {
                potential: 'A subtle, deep-level resonance facilitating an unspoken understanding of intuitive shifts.',
                shadow: 'Psychic fog or projection, where one partner misreads the other\'s internal state through their own filters.',
                protocol: 'Explicit Verification: Use "I" statements to clarify intuitive hits before acting on them.'
            },
            'Pluto-Sun': {
                potential: 'A transformative bond triggering deep personal evolution and the reconstruction of core identity.',
                shadow: 'Power struggles or "obsessive loops" that can become draining if the transition is resisted.',
                protocol: 'Surrender Strategy: Identify what "old version" of the self is being shed to allow the new field to emerge.'
            },
            'Jupiter-Venus': {
                potential: 'Mutual appreciation and abundance, creating a shared field that feels naturally generous and optimistic.',
                shadow: 'Self-indulgence or avoidance of necessary friction, leading to a lack of growth through challenge.',
                protocol: 'Friction Integration: Intentionally tackle one difficult conversation a week to prevent stagnant "niceness".'
            },
            'Saturn-Sun': {
                potential: 'A bond based on shared responsibility and structural alignment, suitable for long-term endurance.',
                shadow: 'Dryness or excessive seriousness, where the weight of the "base" stifles the "pulse" of joy.',
                protocol: 'Playfulness Injection: Schedule mandatory "unstructured play" to re-oxygenate the stability base.'
            }
        };

        const key = [aspect.p1, aspect.p2].sort().join('-');
        if (combinations[key]) return combinations[key];

        const role1 = this.getRoleName(aspect.p1);
        const role2 = this.getRoleName(aspect.p2);
        const interaction = this.getInteractionName(aspect.type);

        // Generic templates for substance
        const generic: InteractionDetail = {
            potential: `A robust ${interaction} between ${role1} and ${role2}, allowing for specialized cooperation in this domain.`,
            shadow: `Potential for miscommunication between the ${role1} pulse and the ${role2} loop if frequencies aren't aligned.`,
            protocol: `Frequency Tuning: Regular check-ins on how the ${role1} is impacting the ${role2} dynamic.`
        };

        return generic;
    }

    private getPsychologicalTag(interaction: string): 'fusion' | 'friction' | 'flow' | 'growth' | 'polarity' {
        const tags: Record<string, 'fusion' | 'friction' | 'flow' | 'growth' | 'polarity'> = {
            'Conjunction': 'fusion',
            'Square': 'friction',
            'Trine': 'flow',
            'Sextile': 'growth',
            'Opposition': 'polarity'
        };
        return tags[interaction] || 'flow';
    }

    // --- Deep Dive Calculations ---

    private readonly LAYER_NAMES: Record<number, string> = {
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

    calculateDeepDive(b1: any, b2: any): DeepDiveData {
        // Extract layer scores from blueprints using planets, houses, and aspects
        const getLayerScores = (blueprint: any): Map<number, number> => {
            const scores = new Map<number, number>();

            // If no blueprint data, return empty (will use defaults)
            if (!blueprint || !blueprint.planets) {
                return scores;
            }

            const planets = blueprint.planets || [];
            const houses = blueprint.houses || {};

            // Helper to find planet by name
            const getPlanet = (name: string) => planets.find((p: any) => p.name === name);

            // Helper to normalize degree to 0-1 score (cyclical mapping)
            const degreeToScore = (degree: number): number => {
                // Convert 0-30 degree to 0-1 range with some variance
                const normalized = (degree % 30) / 30;
                return Math.max(0.1, Math.min(0.95, normalized * 0.8 + 0.1));
            };

            // Helper for house strength (angular houses = stronger)
            const houseStrength = (house: number): number => {
                const angularHouses = [1, 4, 7, 10]; // Angular = strongest
                const succedentHouses = [2, 5, 8, 11];
                if (angularHouses.includes(house)) return 0.85;
                if (succedentHouses.includes(house)) return 0.65;
                return 0.45; // Cadent houses
            };

            // Layer 1: Identity Core - Sun sign and house
            const sun = getPlanet('Sun');
            if (sun) {
                scores.set(1, (degreeToScore(sun.degree) + houseStrength(sun.house)) / 2);
            }

            // Layer 2: Foundational Archetypes - Moon + Saturn blend
            const moon = getPlanet('Moon');
            const saturn = getPlanet('Saturn');
            if (moon && saturn) {
                scores.set(2, (degreeToScore(moon.degree) * 0.6 + houseStrength(saturn.house) * 0.4));
            } else if (moon) {
                scores.set(2, degreeToScore(moon.degree));
            }

            // Layer 3: Motivational Drivers - Mars energy
            const mars = getPlanet('Mars');
            if (mars) {
                scores.set(3, (degreeToScore(mars.degree) + houseStrength(mars.house)) / 2);
            }

            // Layer 4: Processing Patterns - Mercury
            const mercury = getPlanet('Mercury');
            if (mercury) {
                const retroScore = mercury.retrograde ? 0.3 : 0.7;
                scores.set(4, (degreeToScore(mercury.degree) + retroScore) / 2);
            }

            // Layer 5: Creative Expression - Venus + 5th house
            const venus = getPlanet('Venus');
            if (venus) {
                const h5Bonus = venus.house === 5 ? 0.2 : 0;
                scores.set(5, Math.min(0.95, degreeToScore(venus.degree) + h5Bonus));
            }

            // Layer 6: Pressure Response - Mars + Saturn tension
            if (mars && saturn) {
                const tension = Math.abs(mars.longitude - saturn.longitude) % 180;
                const tensionScore = tension < 90 ? 0.7 : 0.4;
                scores.set(6, tensionScore);
            }

            // Layer 7: Emotional Safety - Moon + 4th house
            if (moon) {
                const h4Bonus = moon.house === 4 ? 0.15 : 0;
                scores.set(7, Math.min(0.95, degreeToScore(moon.degree) * 0.8 + h4Bonus + 0.1));
            }

            // Layer 8: Leadership - Sun + 10th house + Mars
            if (sun && mars) {
                const h10Bonus = sun.house === 10 ? 0.2 : 0;
                scores.set(8, (houseStrength(sun.house) * 0.5 + degreeToScore(mars.degree) * 0.3 + h10Bonus));
            }

            // Layer 9: Communication - Mercury + 3rd house
            if (mercury) {
                const h3Bonus = mercury.house === 3 ? 0.15 : 0;
                scores.set(9, Math.min(0.95, degreeToScore(mercury.degree) + h3Bonus));
            }

            // Layer 10: Values & Relationships - Venus + 7th house
            if (venus) {
                const h7Bonus = venus.house === 7 ? 0.2 : 0;
                scores.set(10, Math.min(0.95, (degreeToScore(venus.degree) + houseStrength(venus.house)) / 2 + h7Bonus));
            }

            // Layer 11: Trust & Commitment - Saturn + 8th house
            if (saturn) {
                const h8Bonus = saturn.house === 8 ? 0.15 : 0;
                scores.set(11, Math.min(0.95, degreeToScore(saturn.degree) * 0.7 + 0.2 + h8Bonus));
            }

            // Layer 12: Group Presence - Jupiter + 11th house
            const jupiter = getPlanet('Jupiter');
            if (jupiter) {
                const h11Bonus = jupiter.house === 11 ? 0.2 : 0;
                scores.set(12, Math.min(0.95, degreeToScore(jupiter.degree) + h11Bonus));
            }

            // Layer 13: Integration - Neptune (spiritual integration)
            const neptune = getPlanet('Neptune');
            if (neptune) {
                scores.set(13, degreeToScore(neptune.degree) * 0.8 + 0.15);
            }

            // Layer 14: Adaptability - Uranus (change, innovation)
            const uranus = getPlanet('Uranus');
            if (uranus) {
                scores.set(14, degreeToScore(uranus.degree));
            }

            // Layer 15: Change Navigation - Pluto (transformation)
            const pluto = getPlanet('Pluto');
            if (pluto) {
                scores.set(15, degreeToScore(pluto.degree) * 0.7 + 0.2);
            }

            return scores;
        };


        const user1Scores = getLayerScores(b1);
        const user2Scores = getLayerScores(b2);

        // Calculate layer-by-layer comparison
        const layerComparison: LayerComparison[] = [];
        for (let i = 1; i <= 15; i++) {
            const s1 = user1Scores.get(i) ?? 0.5;
            const s2 = user2Scores.get(i) ?? 0.5;
            const gap = Math.abs(s1 - s2);
            const alignment = 1 - gap;
            const avgScore = (s1 + s2) / 2;

            // Synergy = both high OR complementary (one high, one low in beneficial way)
            const bothHigh = s1 > 0.7 && s2 > 0.7;
            const aligned = gap < 0.15;
            const synergy = bothHigh || (aligned && avgScore > 0.6);

            layerComparison.push({
                layerId: i,
                layerName: this.LAYER_NAMES[i] || `Layer ${i}`,
                user1Score: Math.round(s1 * 100) / 100,
                user2Score: Math.round(s2 * 100) / 100,
                alignment: Math.round(alignment * 100) / 100,
                synergy,
                gap: Math.round(gap * 100) / 100,
                insight: this.generateLayerInsight(i, s1, s2, gap)
            });
        }

        // Identify synergy zones
        const synergyZones = this.identifySynergyZones(layerComparison);

        // Identify friction zones
        const frictionZones = this.identifyFrictionZones(layerComparison);

        // Generate recommendations
        const recommendations = this.generateRecommendations(layerComparison, frictionZones);

        // Overall alignment
        const overallAlignment = layerComparison.reduce((sum, l) => sum + l.alignment, 0) / 15;

        return {
            layerComparison,
            synergyZones,
            frictionZones,
            recommendations,
            overallAlignment: Math.round(overallAlignment * 100) / 100
        };
    }

    private generateLayerInsight(layerId: number, s1: number, s2: number, gap: number): string {
        const layerName = this.LAYER_NAMES[layerId];
        const avgScore = (s1 + s2) / 2;

        if (gap < 0.1) {
            return `Strong natural alignment in ${layerName}. You both approach this dimension similarly.`;
        } else if (gap < 0.25) {
            return `Compatible ${layerName} patterns with room for mutual growth.`;
        } else if (gap >= 0.4) {
            if (s1 > s2) {
                return `Your stronger ${layerName} can support their development in this area.`;
            } else {
                return `Their ${layerName} strength can complement your approach here.`;
            }
        } else {
            return `Moderate difference in ${layerName} creates opportunities for learning.`;
        }
    }

    private identifySynergyZones(layers: LayerComparison[]): SynergyZone[] {
        const zones: SynergyZone[] = [];

        // Communication Synergy (layers 5, 9)
        const commLayers = [5, 9].map(id => layers.find(l => l.layerId === id)!);
        const commAvgAlignment = commLayers.reduce((s, l) => s + l.alignment, 0) / 2;
        if (commAvgAlignment > 0.7) {
            zones.push({
                area: 'Communication Flow',
                strength: commAvgAlignment,
                description: 'Natural ease in expressing ideas and creative collaboration.',
                layers: [5, 9]
            });
        }

        // Emotional Connection (layers 7, 10, 11)
        const emoLayers = [7, 10, 11].map(id => layers.find(l => l.layerId === id)!);
        const emoAvgAlignment = emoLayers.reduce((s, l) => s + l.alignment, 0) / 3;
        if (emoAvgAlignment > 0.65) {
            zones.push({
                area: 'Emotional Resonance',
                strength: emoAvgAlignment,
                description: 'Deep emotional understanding and shared values create a safe space.',
                layers: [7, 10, 11]
            });
        }

        // Execution Partnership (layers 2, 8, 6)
        const execLayers = [2, 8, 6].map(id => layers.find(l => l.layerId === id)!);
        const execAvgAlignment = execLayers.reduce((s, l) => s + l.alignment, 0) / 3;
        if (execAvgAlignment > 0.6) {
            zones.push({
                area: 'Execution Partnership',
                strength: execAvgAlignment,
                description: 'Compatible energy levels and leadership styles enable productive collaboration.',
                layers: [2, 8, 6]
            });
        }

        // Cognitive Alignment (layers 3, 4, 13)
        const cogLayers = [3, 4, 13].map(id => layers.find(l => l.layerId === id)!);
        const cogAvgAlignment = cogLayers.reduce((s, l) => s + l.alignment, 0) / 3;
        if (cogAvgAlignment > 0.6) {
            zones.push({
                area: 'Thinking Harmony',
                strength: cogAvgAlignment,
                description: 'Similar cognitive patterns make problem-solving and decision-making smooth.',
                layers: [3, 4, 13]
            });
        }

        // Adaptability Bond (layers 14, 15, 1)
        const adaptLayers = [14, 15, 1].map(id => layers.find(l => l.layerId === id)!);
        const adaptAvgAlignment = adaptLayers.reduce((s, l) => s + l.alignment, 0) / 3;
        if (adaptAvgAlignment > 0.6) {
            zones.push({
                area: 'Growth Compatibility',
                strength: adaptAvgAlignment,
                description: 'Shared capacity for change and resilience strengthens the connection over time.',
                layers: [14, 15, 1]
            });
        }

        return zones.sort((a, b) => b.strength - a.strength);
    }

    private identifyFrictionZones(layers: LayerComparison[]): FrictionZone[] {
        const zones: FrictionZone[] = [];

        // Find layers with significant gaps
        const highGapLayers = layers.filter(l => l.gap >= 0.3);

        // Group by category
        const categories = [
            { name: 'Communication Style', layers: [5, 9], tip: 'Practice active listening and check for understanding before responding.' },
            { name: 'Emotional Processing', layers: [7, 10, 11], tip: 'Create space for both processing speeds. Validate before problem-solving.' },
            { name: 'Energy & Pace', layers: [2, 6, 8], tip: 'Discuss optimal working rhythms and respect each other\'s recharge needs.' },
            { name: 'Decision Approach', layers: [3, 4, 13], tip: 'Combine intuition with analysis. Allow time for both approaches.' },
            { name: 'Change Tolerance', layers: [1, 14, 15], tip: 'Introduce changes gradually. Provide stability anchors during transitions.' }
        ];

        categories.forEach(cat => {
            const catLayers = cat.layers.map(id => layers.find(l => l.layerId === id)!);
            const avgGap = catLayers.reduce((s, l) => s + l.gap, 0) / cat.layers.length;

            if (avgGap >= 0.25) {
                zones.push({
                    area: cat.name,
                    severity: avgGap >= 0.4 ? 'high' : avgGap >= 0.3 ? 'medium' : 'low',
                    description: `Different ${cat.name.toLowerCase()} may require conscious bridging.`,
                    layers: cat.layers,
                    improvementTip: cat.tip
                });
            }
        });

        return zones.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    private generateRecommendations(layers: LayerComparison[], frictions: FrictionZone[]): Recommendation[] {
        const recommendations: Recommendation[] = [];
        let id = 0;

        // Top friction-based recommendations
        frictions.slice(0, 3).forEach((f, priority) => {
            recommendations.push({
                id: `rec-${++id}`,
                title: `Bridge ${f.area} Differences`,
                description: f.improvementTip,
                category: this.getCategoryFromFriction(f.area),
                priority: priority + 1,
                affectedLayers: f.layers,
                shareable: true
            });
        });

        // Strength-leveraging recommendations
        const strongLayers = layers.filter(l => l.synergy && l.alignment > 0.75);
        if (strongLayers.length > 0) {
            recommendations.push({
                id: `rec-${++id}`,
                title: 'Lean Into Your Strengths',
                description: `Build on your natural ${strongLayers[0].layerName} alignment. Use this as an anchor during challenging moments.`,
                category: 'growth',
                priority: recommendations.length + 1,
                affectedLayers: strongLayers.map(l => l.layerId).slice(0, 3),
                shareable: true
            });
        }

        // Balance recommendation
        const avgAlignment = layers.reduce((s, l) => s + l.alignment, 0) / 15;
        if (avgAlignment < 0.6) {
            recommendations.push({
                id: `rec-${++id}`,
                title: 'Establish Regular Check-ins',
                description: 'With diverse profiles, scheduled alignment conversations prevent misunderstandings.',
                category: 'communication',
                priority: recommendations.length + 1,
                affectedLayers: [7, 9, 11],
                shareable: true
            });
        }

        return recommendations;
    }

    private getCategoryFromFriction(area: string): 'communication' | 'understanding' | 'growth' | 'balance' {
        if (area.includes('Communication')) return 'communication';
        if (area.includes('Emotional') || area.includes('Change')) return 'understanding';
        if (area.includes('Energy') || area.includes('Decision')) return 'balance';
        return 'growth';
    }
}


export const synastryService = new SynastryService();
