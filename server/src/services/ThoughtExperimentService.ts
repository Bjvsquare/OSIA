import { db } from '../db/JsonDb';
import { randomUUID } from 'crypto';

/**
 * ThoughtExperimentService
 * 
 * Generates personalised, thought-provoking questions drawn directly from
 * the user's current Blueprint data for each of the 15 layers.
 * Processes reflective answers and recalibrates trait scores.
 */

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ThoughtExperiment {
    id: string;
    layerId: number;
    traitId: string;
    traitLabel: string;
    type: 'mirror' | 'edge' | 'depth';
    question: string;
    context: string;        // Summary of the user's current data for this layer
    currentScore: number;
    currentConfidence: number;
    timestamp: string;
}

export interface RefinementResponse {
    experimentId: string;
    layerId: number;
    answer: string;
    timestamp: string;
}

export interface RefinementResult {
    success: boolean;
    layerId: number;
    traitId: string;
    previousScore: number;
    newScore: number;
    adjustment: number;
    direction: 'strengthened' | 'softened' | 'stable';
    snapshotId: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Layer metadata — human-readable names & categories
// ────────────────────────────────────────────────────────────────────────────

const LAYER_META: Record<number, { name: string; key: string; category: string }> = {
    1: { name: 'Core Disposition', key: 'L01_CORE_DISPOSITION', category: 'Foundation' },
    2: { name: 'Energy Orientation', key: 'L02_ENERGY_ORIENTATION', category: 'Foundation' },
    3: { name: 'Cognitive Method', key: 'L03_COGNITIVE_METHOD', category: 'Cognitive' },
    4: { name: 'Internal Foundation', key: 'L04_INTERNAL_FOUNDATION', category: 'Cognitive' },
    5: { name: 'Creative Expression', key: 'L05_CREATIVE_EXPRESSION', category: 'Expression' },
    6: { name: 'Operational Rhythm', key: 'L06_OPERATIONAL_RHYTHM', category: 'Expression' },
    7: { name: 'Relational Stance', key: 'L07_RELATIONAL_STANCE', category: 'Relational' },
    8: { name: 'Transformative Potential', key: 'L08_TRANSFORMATIVE_POTENTIAL', category: 'Relational' },
    9: { name: 'Expansive Orientation', key: 'L09_EXPANSIVE_ORIENTATION', category: 'Structural' },
    10: { name: 'Architectural Focus', key: 'L10_ARCHITECTURAL_FOCUS', category: 'Structural' },
    11: { name: 'Social Resonance', key: 'L11_SOCIAL_RESONANCE', category: 'Social' },
    12: { name: 'Integrative Depth', key: 'L12_INTEGRATIVE_DEPTH', category: 'Integration' },
    13: { name: 'Navigational Interface', key: 'L13_NAVIGATIONAL_INTERFACE', category: 'Integration' },
    14: { name: 'Evolutionary Trajectory', key: 'L14_EVOLUTIONARY_TRAJECTORY', category: 'Evolution' },
    15: { name: 'Systemic Integration', key: 'L15_SYSTEMIC_INTEGRATION', category: 'Evolution' },
};

// ────────────────────────────────────────────────────────────────────────────
// Question templates — parameterised by user data
// Each template type serves a different introspective purpose:
//   mirror → "What are you seeing about yourself right now?"
//   edge   → "Where are you growing or resisting growth?"
//   depth  → "What's the driver underneath the surface?"
// ────────────────────────────────────────────────────────────────────────────

const QUESTION_TEMPLATES: Record<string, { type: 'mirror' | 'edge' | 'depth'; template: string }[]> = {
    Foundation: [
        { type: 'mirror', template: 'Your digital twin suggests your core disposition leans toward: "{description}". When you look in the mirror right now — does this still feel accurate? What has shifted?' },
        { type: 'edge', template: 'Your energy orientation score is {score}. Think about the last week — when did you feel most alive, and when did you feel most drained? What does that tell you about where you really draw energy from?' },
        { type: 'depth', template: 'If a close friend described your default operating state in one sentence, and it matched "{description}" — would you agree or push back? What would you change?' },
    ],
    Cognitive: [
        { type: 'mirror', template: 'Your cognitive method profile reads: "{description}". Before an important decision this week, what was the first thing you did — analyse data, trust your gut, or consult someone? Does the pattern match?' },
        { type: 'edge', template: 'Rate how often you change your mind after sleeping on a decision: rarely, sometimes, or often. How does this compare to what your current profile says about your internal foundation?' },
        { type: 'depth', template: 'Think of the last time your thinking surprised you — you reached a conclusion you didn\'t expect. What drove that? Does it reveal something your current profile of "{description}" is missing?' },
    ],
    Expression: [
        { type: 'mirror', template: 'Your creative expression profile suggests: "{description}". What is the last creative risk you took? How did it feel?' },
        { type: 'edge', template: 'Your operational rhythm score is {score}. Do you feel more productive with structure or freedom? Has this changed recently?' },
        { type: 'depth', template: 'When you\'re at your best, what does that actually look like on a daily basis? Does "{description}" capture that, or is something missing?' },
    ],
    Relational: [
        { type: 'mirror', template: 'Your relational stance reads: "{description}". Think of your three closest relationships — does the same pattern show up in all of them, or does it shift depending on the person?' },
        { type: 'edge', template: 'When conflict arises, what\'s your instinct? Fight, freeze, appease, or solve? Has this changed from what your profile predicts?' },
        { type: 'depth', template: 'What relationship dynamic challenges you most right now? How does that connect to what your transformative potential score of {score} suggests?' },
    ],
    Structural: [
        { type: 'mirror', template: 'Your expansive orientation profile says: "{description}". Are you currently in a phase of expanding or consolidating? What does that reveal?' },
        { type: 'edge', template: 'If you could redesign your daily structure from scratch with no constraints, what would change? Does your architectural focus score of {score} explain why you haven\'t made that change yet?' },
        { type: 'depth', template: 'What system or habit in your life is working despite you never intentionally building it? What does that tell you about your real architectural focus?' },
    ],
    Social: [
        { type: 'mirror', template: 'Your social resonance profile reads: "{description}". In a room of strangers, what\'s your default mode — observe, connect, lead, or withdraw? Is it still the same as six months ago?' },
        { type: 'edge', template: 'Think of a recent group situation where you felt completely in your element vs. one where you didn\'t. What was the difference? Does your profile capture that difference?' },
        { type: 'depth', template: 'Who do you become in a group that differs from who you are alone? Is that shift intentional or automatic?' },
    ],
    Integration: [
        { type: 'mirror', template: 'Your integrative depth profile suggests: "{description}". When multiple priorities compete, how do you decide what gets your full attention? Has your method changed recently?' },
        { type: 'edge', template: 'If your life is a system, which part currently has the most friction? Does your navigational interface score of {score} explain how you\'re dealing with it?' },
        { type: 'depth', template: 'Think about a recent moment where everything just "clicked" — multiple aspects of your life aligned. What made that possible? Is your integration pattern catching that?' },
    ],
    Evolution: [
        { type: 'mirror', template: 'Your evolutionary trajectory reads: "{description}". Where are you heading? And does where you\'re heading match where you want to be heading?' },
        { type: 'edge', template: 'What is one belief about yourself that you held a year ago and no longer hold? What replaced it? Does your profile reflect this evolution?' },
        { type: 'depth', template: 'If your digital twin could see what you\'re becoming — not what you are — what would it say? Does your systemic integration score of {score} capture that trajectory?' },
    ],
};

// ────────────────────────────────────────────────────────────────────────────
// Recalibration constants
// ────────────────────────────────────────────────────────────────────────────

const REFINEMENT_RATE = 0.04;   // Slightly gentler than protocol recalibration (0.05)
const CONFIDENCE_BOOST = 0.015; // Each refinement increases confidence

// ────────────────────────────────────────────────────────────────────────────
// Calibration templates — structured, click-based interactions
// ────────────────────────────────────────────────────────────────────────────

const CALIBRATION_TEMPLATES: Record<string, { type: string; statement: string; options: { label: string; emoji?: string }[] }[]> = {
    Foundation: [
        {
            type: 'agreement', statement: 'Your digital twin sees your {layer} as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'When solving a new problem, you tend to...', options: [
                { label: 'Plan methodically before acting', emoji: '📋' }, { label: 'Jump in and figure it out', emoji: '⚡' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you feel grounded and centred in your daily life?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Cognitive: [
        {
            type: 'agreement', statement: 'Your cognitive method is described as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'Before making an important decision, you first...', options: [
                { label: 'Analyse the data thoroughly', emoji: '📊' }, { label: 'Trust your intuition', emoji: '💡' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you change your mind after sleeping on a decision?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Expression: [
        {
            type: 'agreement', statement: 'Your creative expression profile is: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'You do your best work when you have...', options: [
                { label: 'Clear structure and deadlines', emoji: '📋' }, { label: 'Total creative freedom', emoji: '🎨' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you take creative risks in your work or life?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Relational: [
        {
            type: 'agreement', statement: 'Your relational stance reads: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'When conflict arises, your instinct is to...', options: [
                { label: 'Address it directly', emoji: '🗣️' }, { label: 'Give it space first', emoji: '🤝' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you initiate deep conversations with people close to you?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Structural: [
        {
            type: 'agreement', statement: 'Your structural focus is described as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'You are currently in a phase of...', options: [
                { label: 'Expanding and exploring', emoji: '🌱' }, { label: 'Consolidating and refining', emoji: '🔧' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you redesign your systems, routines, or workflows?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Social: [
        {
            type: 'agreement', statement: 'Your social resonance is described as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'In a room of strangers, your default mode is to...', options: [
                { label: 'Engage and connect', emoji: '🤗' }, { label: 'Observe and assess', emoji: '👁' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you naturally lead conversations in group settings?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Integration: [
        {
            type: 'agreement', statement: 'Your integrative depth is described as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'When multiple priorities compete, you tend to...', options: [
                { label: 'Focus deeply on one', emoji: '🎯' }, { label: 'Balance across several', emoji: '⚖️' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do different parts of your life feel aligned and coherent?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
    Evolution: [
        {
            type: 'agreement', statement: 'Your evolutionary trajectory is described as: "{description}"', options: [
                { label: 'Exactly right', emoji: '🎯' }, { label: 'Mostly right', emoji: '✓' }, { label: 'Somewhat', emoji: '~' }, { label: 'Not really', emoji: '✗' }, { label: 'Not at all', emoji: '⊘' },
            ]
        },
        {
            type: 'scenario', statement: 'Right now, you are focused more on...', options: [
                { label: 'Becoming someone new', emoji: '🚀' }, { label: 'Deepening who you are', emoji: '🌳' },
            ]
        },
        {
            type: 'frequency', statement: 'How often do you feel you are evolving as a person?', options: [
                { label: 'Always', emoji: '◆' }, { label: 'Often', emoji: '◇' }, { label: 'Sometimes', emoji: '○' }, { label: 'Rarely', emoji: '◌' }, { label: 'Never', emoji: '·' },
            ]
        },
    ],
};

export class ThoughtExperimentService {

    /**
     * Generate a thought experiment question for a specific layer,
     * drawn from the user's current blueprint data.
     */
    async generateQuestion(userId: string, layerId: number): Promise<ThoughtExperiment> {
        const meta = LAYER_META[layerId];
        if (!meta) throw new Error(`Invalid layer ID: ${layerId}`);

        // Fetch user's latest snapshot
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latest = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        if (!latest?.traits) {
            throw new Error('No blueprint data found. Please complete onboarding first.');
        }

        const trait = latest.traits.find((t: any) => t.layerId === layerId);
        if (!trait) {
            throw new Error(`No trait data found for layer ${layerId}.`);
        }

        // Select question template based on category
        const templates = QUESTION_TEMPLATES[meta.category] || QUESTION_TEMPLATES['Foundation'];

        // Pick a question type based on the user's data:
        //   - Low confidence → depth questions (need more data)
        //   - High score → mirror questions (verify current state)
        //   - Moderate score → edge questions (probe growth areas)
        let preferredType: 'mirror' | 'edge' | 'depth';
        if (trait.confidence < 0.6) {
            preferredType = 'depth';
        } else if (trait.score > 0.7) {
            preferredType = 'mirror';
        } else {
            preferredType = 'edge';
        }

        // Find matching template, fallback to random
        let template = templates.find(t => t.type === preferredType) || templates[0];

        // Check recent experiments to avoid repeating the same type
        const recentExperiments = await db.getCollection<any>('thought_experiments');
        const recentForLayer = recentExperiments
            .filter(e => e.userId === userId && e.layerId === layerId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3);

        const recentTypes = recentForLayer.map(e => e.type);
        if (recentTypes.includes(preferredType)) {
            // Try a different type
            const altTemplate = templates.find(t => !recentTypes.includes(t.type));
            if (altTemplate) template = altTemplate;
        }

        // Hydrate template with user's data
        const description = trait.description
            ? trait.description.split('\n\n')[0].substring(0, 200)
            : meta.name;
        const question = template.template
            .replace(/{description}/g, description)
            .replace(/{score}/g, (trait.score * 100).toFixed(0) + '%');

        const experiment: ThoughtExperiment & { userId: string } = {
            id: `te_${randomUUID().slice(0, 12)}`,
            userId,
            layerId,
            traitId: meta.key,
            traitLabel: meta.name,
            type: template.type,
            question,
            context: description,
            currentScore: trait.score,
            currentConfidence: trait.confidence,
            timestamp: new Date().toISOString(),
        };

        // Persist the experiment
        const experiments = await db.getCollection<any>('thought_experiments');
        experiments.push(experiment);
        await db.saveCollection('thought_experiments', experiments);

        return experiment;
    }

    /**
     * Process a user's reflective answer and recalibrate the trait.
     * 
     * The adjustment logic:
     * - Short/dismissive answers → slight decrease (user may be disengaged)
     * - Reflective answers that affirm current data → strengthen score
     * - Reflective answers that challenge current data → soften score
     * 
     * For now, we use answer length + sentiment cues as a heuristic.
     * In production, this would feed through an LLM for deeper analysis.
     */
    async processResponse(userId: string, experimentId: string, answer: string): Promise<RefinementResult> {
        // Fetch the experiment
        const experiments = await db.getCollection<any>('thought_experiments');
        const experiment = experiments.find(e => e.id === experimentId && e.userId === userId);

        if (!experiment) {
            throw new Error('Thought experiment not found.');
        }

        // Analyse the answer (heuristic for now)
        const adjustment = this.calculateAdjustment(answer, experiment);

        // Apply trait adjustment
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latest = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        if (!latest) throw new Error('No blueprint snapshot found.');

        const previousTrait = latest.traits.find((t: any) => t.layerId === experiment.layerId);
        const previousScore = previousTrait?.score || 0.5;

        // Create new snapshot with adjusted traits
        const newTraits = latest.traits.map((t: any) => {
            if (t.layerId === experiment.layerId) {
                const newScore = Math.max(0.01, Math.min(0.99, t.score + adjustment));
                const newConfidence = Math.min(0.99, t.confidence + CONFIDENCE_BOOST);
                return { ...t, score: newScore, confidence: newConfidence };
            }
            return t;
        });

        const newSnapshot = {
            id: `sn_${randomUUID()}`,
            userId,
            timestamp: new Date().toISOString(),
            source: 'thought_experiment',
            traits: newTraits,
        };

        snapshots.push(newSnapshot);
        await db.saveCollection('blueprint_snapshots', snapshots);

        // Record the response
        const responses = await db.getCollection<any>('refinement_responses');
        responses.push({
            id: `rr_${randomUUID().slice(0, 12)}`,
            userId,
            experimentId,
            layerId: experiment.layerId,
            answer,
            adjustment,
            snapshotId: newSnapshot.id,
            timestamp: new Date().toISOString(),
        });
        await db.saveCollection('refinement_responses', responses);

        const newScore = Math.max(0.01, Math.min(0.99, previousScore + adjustment));

        return {
            success: true,
            layerId: experiment.layerId,
            traitId: experiment.traitId,
            previousScore,
            newScore,
            adjustment,
            direction: adjustment > 0.005 ? 'strengthened' : adjustment < -0.005 ? 'softened' : 'stable',
            snapshotId: newSnapshot.id,
        };
    }

    /**
     * Get the user's current blueprint with freshness data per layer.
     */
    async getCurrentBlueprint(userId: string): Promise<{
        traits: any[];
        lastUpdated: string;
        layerFreshness: Record<number, { lastRefined: string | null; refinementCount: number }>;
    }> {
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latest = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        if (!latest) {
            throw new Error('No blueprint data found.');
        }

        // Calculate per-layer freshness
        const responses = await db.getCollection<any>('refinement_responses');
        const userResponses = responses.filter(r => r.userId === userId);

        const layerFreshness: Record<number, { lastRefined: string | null; refinementCount: number }> = {};
        for (let i = 1; i <= 15; i++) {
            const layerResponses = userResponses
                .filter(r => r.layerId === i)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            layerFreshness[i] = {
                lastRefined: layerResponses[0]?.timestamp || null,
                refinementCount: layerResponses.length,
            };
        }

        // Enrich traits with metadata
        const enrichedTraits = (latest.traits || []).map((t: any) => ({
            ...t,
            layerName: LAYER_META[t.layerId]?.name || `Layer ${t.layerId}`,
            category: LAYER_META[t.layerId]?.category || 'Unknown',
        }));

        return {
            traits: enrichedTraits,
            lastUpdated: latest.timestamp,
            layerFreshness,
        };
    }

    /**
     * Get refinement session history.
     */
    async getRefinementHistory(userId: string, limit: number = 20): Promise<any[]> {
        const responses = await db.getCollection<any>('refinement_responses');
        return responses
            .filter(r => r.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Calculate trait adjustment from user's free-text answer.
     * 
     * Heuristic approach (will be replaced by LLM analysis later):
     * - Length indicates engagement depth
     * - Affirming language → strengthen
     * - Challenging language → soften
     * - Neutral/short → minimal change but confidence increase
     */
    private calculateAdjustment(answer: string, experiment: any): number {
        const words = answer.trim().split(/\s+/).length;
        const lower = answer.toLowerCase();

        // Dismissive / too short → minimal adjustment
        if (words < 5) {
            return 0;
        }

        // Look for affirmation signals
        const affirmSignals = ['yes', 'accurate', 'correct', 'matches', 'agree', 'exactly', 'spot on', 'true', 'resonates', 'fits'];
        const challengeSignals = ['no', 'wrong', 'changed', 'shifted', 'different', 'disagree', 'not anymore', 'used to', 'outdated', 'doesn\'t fit'];

        let affirmCount = 0;
        let challengeCount = 0;

        for (const signal of affirmSignals) {
            if (lower.includes(signal)) affirmCount++;
        }
        for (const signal of challengeSignals) {
            if (lower.includes(signal)) challengeCount++;
        }

        // Calculate direction
        let direction = 0;
        if (affirmCount > challengeCount) {
            direction = 1; // Strengthen
        } else if (challengeCount > affirmCount) {
            direction = -1; // Soften
        }

        // Scale by engagement depth (longer answers = more conviction)
        const engagementMultiplier = Math.min(2.0, words / 25);

        return direction * REFINEMENT_RATE * engagementMultiplier;
    }

    // ────────────────────────────────────────────────────────────────────────
    // CLICK-BASED CALIBRATION SYSTEM
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Generate a structured calibration card for a layer.
     * Returns one of 3 types: agreement, scenario, or frequency.
     * Each has pre-defined tappable options with deterministic adjustments.
     */
    async generateCalibration(userId: string, layerId: number): Promise<any> {
        const meta = LAYER_META[layerId];
        if (!meta) throw new Error(`Invalid layer ID: ${layerId}`);

        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latest = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        if (!latest?.traits) throw new Error('No blueprint data found.');

        const trait = latest.traits.find((t: any) => t.layerId === layerId);
        if (!trait) throw new Error(`No trait data for layer ${layerId}.`);

        const description = trait.description
            ? trait.description.split('\n\n')[0].substring(0, 150)
            : meta.name;

        // Pick calibration type based on confidence + recent history
        const recent = await db.getCollection<any>('calibration_responses');
        const recentForLayer = recent
            .filter((r: any) => r.userId === userId && r.layerId === layerId)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3);
        const recentTypes = recentForLayer.map((r: any) => r.calibrationType);

        // Rotate through types, prefer agreement for low confidence
        let calType: 'agreement' | 'scenario' | 'frequency';
        if (trait.confidence < 0.5 && !recentTypes.includes('agreement')) {
            calType = 'agreement';
        } else if (!recentTypes.includes('scenario')) {
            calType = 'scenario';
        } else if (!recentTypes.includes('frequency')) {
            calType = 'frequency';
        } else {
            calType = (['agreement', 'scenario', 'frequency'] as const)[Math.floor(Math.random() * 3)];
        }

        const card = this.buildCalibrationCard(calType, meta, trait, description);

        const calibration = {
            id: `cal_${randomUUID().slice(0, 12)}`,
            userId,
            layerId,
            traitId: meta.key,
            traitLabel: meta.name,
            category: meta.category,
            currentScore: trait.score,
            currentConfidence: trait.confidence,
            ...card,
            timestamp: new Date().toISOString(),
        };

        const calibrations = await db.getCollection<any>('calibrations');
        calibrations.push(calibration);
        await db.saveCollection('calibrations', calibrations);

        return calibration;
    }

    /**
     * Process a structured calibration response.
     * selectedOption is the index (0-4 for agreement/frequency, 0-1 for scenario).
     */
    async processCalibration(userId: string, calibrationId: string, selectedOption: number): Promise<RefinementResult> {
        const calibrations = await db.getCollection<any>('calibrations');
        const cal = calibrations.find((c: any) => c.id === calibrationId && c.userId === userId);
        if (!cal) throw new Error('Calibration not found.');

        const adjustment = this.calculateStructuredAdjustment(cal.type, selectedOption);

        // Apply to blueprint
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter((s: any) => s.userId === userId);
        const latest = userSnapshots.sort((a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        if (!latest) throw new Error('No blueprint snapshot found.');

        const previousTrait = latest.traits.find((t: any) => t.layerId === cal.layerId);
        const previousScore = previousTrait?.score || 0.5;

        const newTraits = latest.traits.map((t: any) => {
            if (t.layerId === cal.layerId) {
                return {
                    ...t,
                    score: Math.max(0.01, Math.min(0.99, t.score + adjustment)),
                    confidence: Math.min(0.99, t.confidence + CONFIDENCE_BOOST * 1.5),
                };
            }
            return t;
        });

        const newSnapshot = {
            id: `sn_${randomUUID()}`,
            userId,
            timestamp: new Date().toISOString(),
            source: 'calibration',
            traits: newTraits,
        };
        snapshots.push(newSnapshot);
        await db.saveCollection('blueprint_snapshots', snapshots);

        // Record response
        const responses = await db.getCollection<any>('calibration_responses');
        responses.push({
            id: `cr_${randomUUID().slice(0, 12)}`,
            userId,
            calibrationId,
            layerId: cal.layerId,
            calibrationType: cal.type,
            selectedOption,
            adjustment,
            snapshotId: newSnapshot.id,
            timestamp: new Date().toISOString(),
        });
        await db.saveCollection('calibration_responses', responses);

        // Also record in refinement_responses for freshness tracking
        const refResponses = await db.getCollection<any>('refinement_responses');
        refResponses.push({
            id: `rr_${randomUUID().slice(0, 12)}`,
            userId,
            experimentId: calibrationId,
            layerId: cal.layerId,
            answer: `[calibration:${cal.type}:option_${selectedOption}]`,
            adjustment,
            snapshotId: newSnapshot.id,
            timestamp: new Date().toISOString(),
        });
        await db.saveCollection('refinement_responses', refResponses);

        const newScore = Math.max(0.01, Math.min(0.99, previousScore + adjustment));

        return {
            success: true,
            layerId: cal.layerId,
            traitId: cal.traitId,
            previousScore,
            newScore,
            adjustment,
            direction: adjustment > 0.005 ? 'strengthened' : adjustment < -0.005 ? 'softened' : 'stable',
            snapshotId: newSnapshot.id,
        };
    }

    /**
     * Deterministic adjustment mapping — no heuristics, no keyword matching.
     */
    private calculateStructuredAdjustment(type: string, selectedOption: number): number {
        const ADJUSTMENTS: Record<string, number[]> = {
            agreement: [+0.06, +0.03, 0, -0.03, -0.06],
            scenario: [+0.04, -0.04],
            frequency: [+0.05, +0.03, 0, -0.03, -0.05],
        };
        const map = ADJUSTMENTS[type];
        if (!map || selectedOption < 0 || selectedOption >= map.length) return 0;
        return map[selectedOption];
    }

    /**
     * Build a calibration card with statement, options, and context.
     */
    private buildCalibrationCard(
        type: 'agreement' | 'scenario' | 'frequency',
        meta: { name: string; key: string; category: string },
        trait: any,
        description: string
    ): any {
        const templates = CALIBRATION_TEMPLATES[meta.category] || CALIBRATION_TEMPLATES['Foundation'];
        const pool = templates.filter(t => t.type === type);
        const template = pool[Math.floor(Math.random() * pool.length)] || pool[0] || templates[0];

        const hydrated = {
            ...template,
            statement: template.statement
                .replace(/{description}/g, description)
                .replace(/{score}/g, (trait.score * 100).toFixed(0) + '%')
                .replace(/{layer}/g, meta.name),
        };

        if (type === 'scenario' && hydrated.options) {
            hydrated.options = hydrated.options.map((o: any) => ({
                ...o,
                label: o.label
                    .replace(/{description}/g, description)
                    .replace(/{layer}/g, meta.name),
            }));
        }

        return hydrated;
    }
}

export const thoughtExperimentService = new ThoughtExperimentService();
