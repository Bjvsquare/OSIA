import { db } from '../db/JsonDb';
import { randomUUID } from 'crypto';

/**
 * RecalibrationService
 * Handles personalized question generation based on user's Blueprint,
 * processes Likert responses, and recalibrates trait scores with historical tracking.
 */

export interface RecalibrationQuestion {
    id: string;
    text: string;
    trait: string;  // e.g., "L03_COGNITIVE_METHOD"
    traitLabel: string;  // Human-readable label
    direction: 'positive' | 'negative'; // Whether agreement increases or decreases score
    category: string;  // Protocol type: reflection, energy, connection, focus
}

export interface RecalibrationResponse {
    questionId: string;
    value: number; // 1-4 Likert scale
    timestamp: string;
}

export interface RecalibrationSession {
    id: string;
    userId: string;
    protocolType: string;
    questions: RecalibrationQuestion[];
    responses: RecalibrationResponse[];
    startedAt: string;
    completedAt?: string;
    traitAdjustments?: Record<string, number>;
}

// Question templates organized by protocol type
// These questions are personalized by the system based on user's current Blueprint
const QUESTION_BANK: Record<string, Omit<RecalibrationQuestion, 'id'>[]> = {
    reflection: [
        { text: "I find it easy to pause and observe my thoughts without judgment.", trait: "L03_COGNITIVE_METHOD", traitLabel: "Cognitive Clarity", direction: "positive", category: "reflection" },
        { text: "I often feel overwhelmed by the pace of my own thinking.", trait: "L03_COGNITIVE_METHOD", traitLabel: "Cognitive Clarity", direction: "negative", category: "reflection" },
        { text: "I can identify the root cause of my emotions when I take time to reflect.", trait: "L04_INTERNAL_FOUNDATION", traitLabel: "Internal Foundation", direction: "positive", category: "reflection" },
        { text: "My decisions lately have felt aligned with my deeper values.", trait: "L05_CREATIVE_EXPRESSION", traitLabel: "Creative Expression", direction: "positive", category: "reflection" },
        { text: "I have been questioning my sense of direction recently.", trait: "L05_CREATIVE_EXPRESSION", traitLabel: "Creative Expression", direction: "negative", category: "reflection" },
    ],
    energy: [
        { text: "I wake up feeling ready to engage with the day's demands.", trait: "L02_ENERGY_ORIENTATION", traitLabel: "Energy Orientation", direction: "positive", category: "energy" },
        { text: "I feel drained even when I haven't done much.", trait: "L02_ENERGY_ORIENTATION", traitLabel: "Energy Orientation", direction: "negative", category: "energy" },
        { text: "I know how to restore my energy when it's depleted.", trait: "L06_OPERATIONAL_RHYTHM", traitLabel: "Operational Rhythm", direction: "positive", category: "energy" },
        { text: "I struggle to maintain consistent energy throughout the day.", trait: "L06_OPERATIONAL_RHYTHM", traitLabel: "Operational Rhythm", direction: "negative", category: "energy" },
        { text: "My physical habits support my mental performance.", trait: "L01_CORE_DISPOSITION", traitLabel: "Core Disposition", direction: "positive", category: "energy" },
    ],
    connection: [
        { text: "I feel genuinely connected to the people in my life.", trait: "L07_RELATIONAL_STANCE", traitLabel: "Relational Stance", direction: "positive", category: "connection" },
        { text: "I often feel misunderstood in my relationships.", trait: "L07_RELATIONAL_STANCE", traitLabel: "Relational Stance", direction: "negative", category: "connection" },
        { text: "I find it easy to express my needs clearly to others.", trait: "L09_EXPANSIVE_ORIENTATION", traitLabel: "Communication Style", direction: "positive", category: "connection" },
        { text: "I hold back from sharing my true thoughts with others.", trait: "L09_EXPANSIVE_ORIENTATION", traitLabel: "Communication Style", direction: "negative", category: "connection" },
        { text: "My relationships feel reciprocal and balanced.", trait: "L11_SOCIAL_RESONANCE", traitLabel: "Social Resonance", direction: "positive", category: "connection" },
    ],
    focus: [
        { text: "I can concentrate deeply on a single task when needed.", trait: "L04_INTERNAL_FOUNDATION", traitLabel: "Focus Capacity", direction: "positive", category: "focus" },
        { text: "My mind frequently wanders to unrelated thoughts.", trait: "L04_INTERNAL_FOUNDATION", traitLabel: "Focus Capacity", direction: "negative", category: "focus" },
        { text: "I have clear priorities that guide my daily actions.", trait: "L10_ARCHITECTURAL_FOCUS", traitLabel: "Strategic Clarity", direction: "positive", category: "focus" },
        { text: "I feel scattered about what I should be working on.", trait: "L10_ARCHITECTURAL_FOCUS", traitLabel: "Strategic Clarity", direction: "negative", category: "focus" },
        { text: "I successfully complete important tasks by their deadlines.", trait: "L12_INTEGRATIVE_DEPTH", traitLabel: "Execution Effectiveness", direction: "positive", category: "focus" },
    ]
};

// Learning rate for recalibration (0.0 to 1.0)
// Lower values mean slower, more stable changes
const RECALIBRATION_RATE = 0.05;

export class RecalibrationService {

    /**
     * Generate personalized questions for a protocol session
     * Selects questions that target traits with lower scores or lower confidence
     */
    async generateQuestionsForProtocol(userId: string, protocolType: string): Promise<RecalibrationQuestion[]> {
        const questionsForType = QUESTION_BANK[protocolType] || QUESTION_BANK.reflection;

        // Get user's current Blueprint to potentially weight questions
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latestSnapshot = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        // Select 3-5 questions, prioritizing traits with lower confidence or scores
        let selectedQuestions = questionsForType;

        if (latestSnapshot?.traits) {
            // Weight towards traits with lower confidence
            selectedQuestions = questionsForType.sort((a, b) => {
                const traitA = latestSnapshot.traits.find((t: any) => t.traitId === a.trait);
                const traitB = latestSnapshot.traits.find((t: any) => t.traitId === b.trait);
                const confA = traitA?.confidence || 0.5;
                const confB = traitB?.confidence || 0.5;
                return confA - confB; // Lower confidence = higher priority
            });
        }

        // Take top 4 questions and add IDs
        return selectedQuestions.slice(0, 4).map(q => ({
            ...q,
            id: `q_${randomUUID().slice(0, 8)}`
        }));
    }

    /**
     * Create a new recalibration session
     */
    async createSession(userId: string, protocolType: string): Promise<RecalibrationSession> {
        const questions = await this.generateQuestionsForProtocol(userId, protocolType);

        const session: RecalibrationSession = {
            id: `recal_${randomUUID()}`,
            userId,
            protocolType,
            questions,
            responses: [],
            startedAt: new Date().toISOString()
        };

        const sessions = await db.getCollection<RecalibrationSession>('recalibration_sessions');
        sessions.push(session);
        await db.saveCollection('recalibration_sessions', sessions);

        return session;
    }

    /**
     * Submit a response and recalibrate the Blueprint
     */
    async submitResponse(sessionId: string, questionId: string, value: number): Promise<{
        success: boolean;
        traitAdjusted?: string;
        adjustmentDirection?: 'increased' | 'decreased' | 'stable';
    }> {
        const sessions = await db.getCollection<RecalibrationSession>('recalibration_sessions');
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);

        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }

        const session = sessions[sessionIndex];
        const question = session.questions.find(q => q.id === questionId);

        if (!question) {
            throw new Error('Question not found in session');
        }

        // Add response
        sessions[sessionIndex].responses.push({
            questionId,
            value,
            timestamp: new Date().toISOString()
        });

        // Calculate trait adjustment
        // Scale: 1=Strongly Disagree, 2=Disagree, 3=Agree, 4=Strongly Agree
        // Normalized to -1 to +1 range
        let normalizedValue = (value - 2.5) / 1.5; // Maps 1->-1, 2->-0.33, 3->+0.33, 4->+1

        // If negative direction, flip the effect
        if (question.direction === 'negative') {
            normalizedValue = -normalizedValue;
        }

        // Apply adjustment to Blueprint
        await this.applyTraitAdjustment(session.userId, question.trait, normalizedValue * RECALIBRATION_RATE);

        await db.saveCollection('recalibration_sessions', sessions);

        return {
            success: true,
            traitAdjusted: question.traitLabel,
            adjustmentDirection: normalizedValue > 0.1 ? 'increased' : normalizedValue < -0.1 ? 'decreased' : 'stable'
        };
    }

    /**
     * Apply a small adjustment to a specific trait in the user's Blueprint
     */
    private async applyTraitAdjustment(userId: string, traitId: string, adjustment: number): Promise<void> {
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);

        if (userSnapshots.length === 0) return;

        // Get latest snapshot
        const latestSnapshot = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        // Create new snapshot with adjusted traits
        const newTraits = latestSnapshot.traits.map((t: any) => {
            if (t.traitId === traitId) {
                const newScore = Math.max(0.01, Math.min(0.99, t.score + adjustment));
                const newConfidence = Math.min(0.99, t.confidence + 0.01); // Slightly increase confidence
                return { ...t, score: newScore, confidence: newConfidence };
            }
            return t;
        });

        const newSnapshot = {
            id: `sn_${randomUUID()}`,
            userId,
            timestamp: new Date().toISOString(),
            source: 'recalibration',
            traits: newTraits
        };

        snapshots.push(newSnapshot);
        await db.saveCollection('blueprint_snapshots', snapshots);
    }

    /**
     * Complete a recalibration session
     */
    async completeSession(sessionId: string): Promise<RecalibrationSession> {
        const sessions = await db.getCollection<RecalibrationSession>('recalibration_sessions');
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);

        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }

        sessions[sessionIndex].completedAt = new Date().toISOString();
        await db.saveCollection('recalibration_sessions', sessions);

        return sessions[sessionIndex];
    }

    /**
     * Get user's Blueprint history for trend analysis
     */
    async getBlueprintHistory(userId: string, limit: number = 10): Promise<any[]> {
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        return snapshots
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    /**
     * Calculate trait trends over time
     */
    async getTraitTrends(userId: string, traitId?: string): Promise<Record<string, { current: number; change7d: number; change30d: number }>> {
        const history = await this.getBlueprintHistory(userId, 30);

        if (history.length < 2) {
            return {};
        }

        const latest = history[0];
        const oneWeekAgo = history.find(h => {
            const diff = new Date().getTime() - new Date(h.timestamp).getTime();
            return diff >= 7 * 24 * 60 * 60 * 1000;
        }) || history[Math.min(history.length - 1, 7)];

        const oneMonthAgo = history[history.length - 1];

        const trends: Record<string, { current: number; change7d: number; change30d: number }> = {};

        for (const trait of latest.traits) {
            if (traitId && trait.traitId !== traitId) continue;

            const weekTrait = oneWeekAgo?.traits?.find((t: any) => t.traitId === trait.traitId);
            const monthTrait = oneMonthAgo?.traits?.find((t: any) => t.traitId === trait.traitId);

            trends[trait.traitId] = {
                current: trait.score,
                change7d: weekTrait ? trait.score - weekTrait.score : 0,
                change30d: monthTrait ? trait.score - monthTrait.score : 0
            };
        }

        return trends;
    }
}

export const recalibrationService = new RecalibrationService();
