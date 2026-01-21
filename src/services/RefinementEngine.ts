import questionBankData from '../../data/blueprint_question_bank_v0.json';

interface BlueprintQuestion {
    question_id: string;
    layer: number;
    type: 'likert_5' | 'either_or';
    prompt: string;
    maps_to: Array<{
        trait_id: string;
        weight: number;
    }>;
}

interface TraitScore {
    trait_id: string;
    score: number;
    confidence: number;
}

interface RefinementInput {
    user_id: string;
    question_id: string;
    response: number | 'A' | 'B'; // Likert index (0-4) or either-or choice
    answered_at: string;
}

interface RefinementOutput {
    user_id: string;
    version: string;
    trait_vector: TraitScore[];
}

/**
 * Refinement Engine
 * Updates trait scores based on Blueprint responses and behavioral events.
 * 
 * CONSTRAINTS:
 * - Confidence-weighted updates only
 * - Deterministic for a given event stream
 * - Never uses themed terminology
 */
export class RefinementEngine {
    private static readonly LEARNING_RATE = 0.15; // Conservative update rate
    private static readonly questionBank: BlueprintQuestion[] = questionBankData.questions as BlueprintQuestion[];

    /**
     * Process a Blueprint answer and refine trait vector
     */
    static async refineFromAnswer(
        input: RefinementInput,
        currentTraits: TraitScore[]
    ): Promise<RefinementOutput> {
        const question = this.questionBank.find(q => q.question_id === input.question_id);

        if (!question) {
            throw new Error(`Question not found: ${input.question_id}`);
        }

        // Convert response to normalized score (-1 to +1)
        const responseScore = this.normalizeResponse(input.response, question.type);

        // Update traits based on question mappings
        const updatedTraits = [...currentTraits];

        for (const mapping of question.maps_to) {
            const traitIndex = updatedTraits.findIndex(t => t.trait_id === mapping.trait_id);

            if (traitIndex === -1) {
                console.warn(`Trait not found in vector: ${mapping.trait_id}`);
                continue;
            }

            const trait = updatedTraits[traitIndex];

            // Calculate delta: weight * response * learning_rate
            const delta = mapping.weight * responseScore * this.LEARNING_RATE * 100; // Scale to 0-100

            // Apply update with confidence weighting
            const reliability = 0.7; // Blueprint responses are fairly reliable
            const newScore = trait.score + (delta * reliability);

            // Clamp to valid range
            trait.score = Math.max(0, Math.min(100, newScore));

            // Increase confidence slightly with each answer
            trait.confidence = Math.min(1.0, trait.confidence + 0.02);

            updatedTraits[traitIndex] = trait;
        }

        return {
            user_id: input.user_id,
            version: 'v0',
            trait_vector: updatedTraits
        };
    }

    /**
     * Normalize response to -1 to +1 scale
     */
    private static normalizeResponse(response: number | 'A' | 'B', type: string): number {
        if (type === 'likert_5') {
            // 0 (Strongly disagree) to 4 (Strongly agree) => -1 to +1
            const numResponse = response as number;
            return (numResponse - 2) / 2; // Maps 0=>-1, 1=>-0.5, 2=>0, 3=>0.5, 4=>1
        }

        if (type === 'either_or') {
            // A = -1 (first option), B = +1 (second option)
            return response === 'A' ? -1 : 1;
        }

        throw new Error(`Unsupported question type: ${type}`);
    }

    /**
     * Process behavioral evidence event
     * (Simplified for prototype)
     */
    static async refineFromEvent(
        userId: string,
        signals: Array<{ trait_id: string; delta: number; reliability: number }>,
        currentTraits: TraitScore[]
    ): Promise<RefinementOutput> {
        const updatedTraits = [...currentTraits];

        for (const signal of signals) {
            const traitIndex = updatedTraits.findIndex(t => t.trait_id === signal.trait_id);

            if (traitIndex === -1) continue;

            const trait = updatedTraits[traitIndex];

            // Apply delta with reliability weighting
            const newScore = trait.score + (signal.delta * signal.reliability);
            trait.score = Math.max(0, Math.min(100, newScore));

            // Behavioral signals increase confidence more modestly
            trait.confidence = Math.min(1.0, trait.confidence + 0.01);

            updatedTraits[traitIndex] = trait;
        }

        return {
            user_id: userId,
            version: 'v0',
            trait_vector: updatedTraits
        };
    }
}
