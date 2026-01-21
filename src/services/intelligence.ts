import type { Answer, Layer, LayerId, InsightCard } from '../core/models';

/**
 * OSIA Intelligence Service
 * Responsible for mapping answers to layers and generating hypotheses.
 * Implements "Foundational Layer Unlock Conditions" (v1.0).
 */

export const intelligence = {
    /**
     * Maps a set of answers to the 15-layer digital twin model.
     * Implements the "Unlock Logic Engine & Threshold Evaluator" (Spec v1.0).
     */
    calculateLayers(answers: Record<string, Answer>): Record<LayerId, Layer> {
        const layers: Partial<Record<LayerId, Layer>> = {};

        // Initialize all 15 layers
        for (let i = 1; i <= 15; i++) {
            const id = i as LayerId;
            layers[id] = {
                id,
                name: this.getLayerName(id),
                value: 0.5,
                confidence: 0.5,
                status: 'unformed',
                stability: 0.0,
                signal_density: 0,
                convergenceCount: 0,
                evidence_summary: [],
                description: `Initial hypothesis for Layer ${id}`
            };
        }

        // --- LAYER 1: CORE DISPOSITION ---
        this.processLayer1(layers[1]!, answers);

        // --- LAYER 2: ENERGY ORIENTATION ---
        this.processLayer2(layers[2]!, answers);

        // --- LAYER 3: PERCEPTION & INFO PROCESSING ---
        this.processLayer3(layers[3]!, answers);

        // --- LAYER 4: DECISION LOGIC ---
        this.processLayer4(layers[4]!, answers);

        // --- LAYER 5: MOTIVATIONAL DRIVERS ---
        this.processLayer5(layers[5]!, answers);

        // Finalize all layers (evaluate unlock states)
        for (let i = 1; i <= 15; i++) {
            const l = layers[i as LayerId]!;
            l.status = this.evaluateUnlock(i, l);
        }

        return layers as Record<LayerId, Layer>;
    },

    getLayerName(id: number): string {
        const names: Record<number, string> = {
            1: "Core Disposition",
            2: "Energy Orientation",
            3: "Perception & Information Processing",
            4: "Decision Logic",
            5: "Motivational Drivers",
            6: "Stress & Pressure Patterns",
            7: "Emotional Regulation & Expression",
            8: "Behavioural Rhythm & Execution",
            9: "Communication Mode",
            10: "Relational Energy & Boundaries",
            11: "Relational Patterning",
            12: "Social Role & Influence Expression",
            13: "Identity Coherence & Maturity",
            14: "Growth Arc & Learning Orientation",
            15: "Life Navigation & Current Edge"
        };
        return names[id] || `Layer ${id}`;
    },

    processLayer1(layer: Layer, answers: Record<string, Answer>) {
        const signals = ['BLUEPRINT.01', 'BLUEPRINT.02', 'BLUEPRINT.03'];
        signals.forEach(id => {
            if (answers[id]) {
                layer.signal_density++;
                layer.evidence_summary.push(`Signal from ${id} captured.`);
            }
        });

        const lexical = answers['BLUEPRINT.01'];
        if (lexical && lexical.derived?.clean_tokens) {
            layer.convergenceCount++;
            layer.value = Math.min(1, lexical.derived.clean_tokens.length / 5);
            layer.stability = 0.7;
        }

        const narrative = answers['BLUEPRINT.03'];
        if (narrative) {
            layer.convergenceCount++;
            layer.evidence_summary.push("Narrative typical day analysis integrated.");
        }
    },

    processLayer2(layer: Layer, answers: Record<string, Answer>) {
        const signals = ['BLUEPRINT.04', 'BLUEPRINT.05', 'BLUEPRINT.06'];
        signals.forEach(id => {
            if (answers[id]) {
                layer.signal_density++;
                layer.evidence_summary.push(`Signal from ${id} captured.`);
            }
        });

        if (answers['BLUEPRINT.04'] && answers['BLUEPRINT.05']) {
            layer.convergenceCount = 2;
            layer.stability = 0.65;
            layer.value = answers['BLUEPRINT.04'].value === 'High' ? 0.8 : 0.4;
        }
    },

    processLayer3(layer: Layer, answers: Record<string, Answer>) {
        const signals = ['BLUEPRINT.07', 'BLUEPRINT.08', 'BLUEPRINT.09'];
        signals.forEach(id => {
            if (answers[id]) {
                layer.signal_density++;
                layer.evidence_summary.push(`Signal from ${id} captured.`);
            }
        });

        if (answers['BLUEPRINT.07'] && answers['BLUEPRINT.09']) {
            layer.convergenceCount = 2;
            layer.stability = 0.6;
        }
    },

    processLayer4(layer: Layer, answers: Record<string, Answer>) {
        const signals = ['BLUEPRINT.10', 'BLUEPRINT.11'];
        signals.forEach(id => {
            if (answers[id]) {
                layer.signal_density++;
                layer.evidence_summary.push(`Signal from ${id} captured.`);
            }
        });

        if (answers['BLUEPRINT.10'] && answers['BLUEPRINT.11']) {
            layer.convergenceCount = 2;
            layer.stability = 0.7;
        }
    },

    processLayer5(layer: Layer, answers: Record<string, Answer>) {
        const signals = ['BLUEPRINT.12', 'BLUEPRINT.13'];
        signals.forEach(id => {
            if (answers[id]) {
                layer.signal_density++;
                layer.evidence_summary.push(`Signal from ${id} captured.`);
            }
        });

        if (answers['BLUEPRINT.12'] && answers['BLUEPRINT.13']) {
            layer.convergenceCount = 2;
            layer.stability = 0.8;
        }
    },

    /**
     * Evaluates the unlock state of a layer based on Spec v1.0 thresholds.
     */
    evaluateUnlock(layerId: number, layer: Layer): 'unformed' | 'emerging' | 'developed' | 'integrated' {
        const thresholds: Record<number, { convergence: number; stability: number; density: number }> = {
            1: { convergence: 2, stability: 0.6, density: 2 },
            2: { convergence: 2, stability: 0.6, density: 2 },
            3: { convergence: 2, stability: 0.6, density: 2 },
            4: { convergence: 2, stability: 0.6, density: 2 },
            5: { convergence: 2, stability: 0.6, density: 2 },
            6: { convergence: 2, stability: 0.5, density: 2 },
            7: { convergence: 2, stability: 0.5, density: 2 },
            8: { convergence: 2, stability: 0.5, density: 2 },
            9: { convergence: 2, stability: 0.5, density: 2 },
            10: { convergence: 2, stability: 0.4, density: 2 },
            11: { convergence: 2, stability: 0.4, density: 2 },
            12: { convergence: 2, stability: 0.4, density: 2 },
            13: { convergence: 2, stability: 0.7, density: 3 },
            14: { convergence: 2, stability: 0.7, density: 3 },
            15: { convergence: 2, stability: 0.8, density: 3 }
        };

        const t = thresholds[layerId];
        if (!t) return 'unformed';

        // Prerequisite: Signal Density and Convergence
        if (layer.signal_density >= t.density && layer.convergenceCount >= t.convergence) {
            if (layer.stability >= 0.8) return 'integrated';
            if (layer.stability >= 0.6) return 'developed';
            return 'emerging';
        }

        if (layer.signal_density >= 1) {
            return 'emerging';
        }

        return 'unformed';
    },

    /**
     * Generates initial hypotheses (Insight Cards) based on the calculated layers.
     */
    generateHypotheses(layers: Record<LayerId, Layer>): InsightCard[] {
        const hypotheses: InsightCard[] = [];

        // Hypothesis 1: Core Disposition
        if (layers[1].status !== 'unformed') {
            if (layers[1].value > 0.7) {
                hypotheses.push({
                    insight_id: `insight-${Date.now()}-1`,
                    user_id: 'system',
                    layer_refs: [1],
                    text: "You demonstrate high energy resilience, likely processing pressure as a catalyst for focus rather than a drain.",
                    confidence_band: layers[1].confidence > 0.8 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
                    created_at: new Date().toISOString(),
                    provenance: ['baseline_response']
                });
            } else if (layers[1].value < 0.5) {
                hypotheses.push({
                    insight_id: `insight-${Date.now()}-2`,
                    user_id: 'system',
                    layer_refs: [1],
                    text: "Your energy processing suggests a preference for stable, low-friction environments to maintain peak cognitive performance.",
                    confidence_band: layers[1].confidence > 0.8 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
                    created_at: new Date().toISOString(),
                    provenance: ['baseline_response']
                });
            }
        }

        if (layers[2].status !== 'unformed' && layers[2].value > 0.8) {
            hypotheses.push({
                insight_id: `insight-${Date.now()}-3`,
                user_id: 'system',
                layer_refs: [2],
                text: "You have a highly articulated sense of self-identity, using precise descriptors to navigate your internal state.",
                confidence_band: layers[2].confidence > 0.8 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
                created_at: new Date().toISOString(),
                provenance: ['lexical_descriptor']
            });
        }

        if (hypotheses.length === 0) {
            hypotheses.push({
                insight_id: `insight-${Date.now()}-default`,
                user_id: 'system',
                layer_refs: [1, 2],
                text: "Your digital twin foundation is emerging. We are seeing patterns of balanced energy and clear self-articulation.",
                confidence_band: 'low' as 'high' | 'medium' | 'low',
                created_at: new Date().toISOString(),
                provenance: ['initial_seed']
            });
        }

        return hypotheses;
    },

    /**
     * Aggregates individual signals into team-level climate indicators.
     * Implements Suppression Logic: returns null if member count < 5.
     */
    calculateTeamClimate(_memberAnswers: any[], memberCount: number) {
        if (memberCount < 5) {
            return {
                suppressed: true,
                reason: 'Insufficient data for anonymity (n < 5)'
            };
        }

        // Aggregate Pace, Safety, Clarity (Mocked aggregation)
        return {
            suppressed: false,
            pace: 0.75,
            safety: 0.82,
            clarity: 0.68,
            top_friction: ['Unclear priorities', 'Meeting fatigue'],
            core_strengths: ['High trust', 'Rapid execution'],
            pressure_tags: ['Deadlines', 'Market shift']
        };
    },

    /**
     * Recommends rituals based on the user's digital twin foundation.
     */
    getRecommendedRituals(layers: Record<number, Layer>) {
        const recommendations = [];

        // Energy-based recommendations
        if (layers[1]?.value < 0.5) {
            recommendations.push({
                id: 'ritual-reset',
                title: '5-Minute Reset',
                description: 'A quick grounding practice to stabilize energy in low-friction environments.',
                type: 'Energy',
                duration: '5m'
            });
        }

        // Identity-based recommendations
        if (layers[2]?.value > 0.7) {
            recommendations.push({
                id: 'ritual-reflection',
                title: 'Lexical Reflection',
                description: 'A daily prompt to articulate your internal state using your core descriptors.',
                type: 'Identity',
                duration: '10m'
            });
        }

        // Default recommendation
        if (recommendations.length === 0) {
            recommendations.push({
                id: 'ritual-checkin',
                title: 'Daily Pulse',
                description: 'A light-touch check-in to stay aligned with your emerging patterns.',
                type: 'Integration',
                duration: '2m'
            });
        }

        return recommendations;
    }
};
