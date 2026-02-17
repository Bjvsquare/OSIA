import { db } from '../db/JsonDb';

/* ═══════════════════════════════════════════════════════════
   BehavioralActivationService — Values-Based Practice System

   Manages Socratic values discovery and practice nudge lifecycle:
   - Values: discovered via Socratic dialogue, rated, refined
   - Practice Nudges: user-defined recurring activities linked to values
   - Practice Log: completions with optional reflections
   - Streaks: consecutive completion tracking

   Stored in practice_store.json via JsonDb
   ═══════════════════════════════════════════════════════════ */

export interface UserValue {
    id: string;
    userId: string;
    name: string;
    definition: string;
    category?: string;            // Value category (character, growth, etc.)
    source: 'admired' | 'anti_flip' | 'direct';
    selfRating: number;           // 1-10
    timeSpentRating: 'none' | 'little' | 'some' | 'lots';
    tomorrowAction?: string;      // What they'd do tomorrow
    discoveredAt: string;
    refinedAt?: string;
}

export interface PracticeNudge {
    id: string;
    userId: string;
    valueId: string;
    title: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'situational';
    context: 'morning' | 'afternoon' | 'evening' | 'anytime';
    isActive: boolean;
    streak: number;
    totalCompletions: number;
    completionLog: PracticeCompletion[];
    createdAt: string;
    updatedAt: string;
}

export interface PracticeCompletion {
    id: string;
    nudgeId: string;
    date: string;
    reflection?: string;
    timestamp: string;
}

interface PracticeStore {
    [userId: string]: {
        values: UserValue[];
        nudges: PracticeNudge[];
        discoveryCompleted: boolean;
        discoveryCompletedAt?: string;
    };
}

class BehavioralActivationService {

    private async getStore(): Promise<PracticeStore> {
        return db.getCollection<any>('practice_store') as any || {};
    }

    private async saveStore(store: PracticeStore): Promise<void> {
        await db.saveCollection('practice_store', store as any);
    }

    private ensureUser(store: PracticeStore, userId: string) {
        if (!store[userId]) {
            store[userId] = {
                values: [],
                nudges: [],
                discoveryCompleted: false,
            };
        }
    }

    // ─── Values ───────────────────────────────────────────

    async getValues(userId: string): Promise<{ values: UserValue[]; discoveryCompleted: boolean }> {
        const store = await this.getStore();
        this.ensureUser(store, userId);
        return {
            values: store[userId].values,
            discoveryCompleted: store[userId].discoveryCompleted,
        };
    }

    async saveValues(userId: string, values: Omit<UserValue, 'id' | 'userId' | 'discoveredAt'>[]): Promise<UserValue[]> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const now = new Date().toISOString();
        const savedValues: UserValue[] = values.map(v => ({
            ...v,
            id: this.generateId('val'),
            userId,
            discoveredAt: now,
        }));

        store[userId].values = savedValues;
        store[userId].discoveryCompleted = true;
        store[userId].discoveryCompletedAt = now;

        await this.saveStore(store);
        return savedValues;
    }

    async updateValue(userId: string, valueId: string, updates: Partial<Pick<UserValue, 'name' | 'definition' | 'selfRating' | 'timeSpentRating' | 'tomorrowAction'>>): Promise<UserValue | null> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const value = store[userId].values.find(v => v.id === valueId);
        if (!value) return null;

        Object.assign(value, updates);
        value.refinedAt = new Date().toISOString();

        await this.saveStore(store);
        return value;
    }

    // ─── Practice Nudges ──────────────────────────────────

    async getPracticeNudges(userId: string): Promise<PracticeNudge[]> {
        const store = await this.getStore();
        this.ensureUser(store, userId);
        return store[userId].nudges;
    }

    async createPracticeNudge(userId: string, data: {
        valueId: string;
        title: string;
        description: string;
        frequency: PracticeNudge['frequency'];
        context: PracticeNudge['context'];
    }): Promise<PracticeNudge> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        // Verify value exists
        const value = store[userId].values.find(v => v.id === data.valueId);
        if (!value) throw new Error(`Value not found: ${data.valueId}`);

        const now = new Date().toISOString();
        const nudge: PracticeNudge = {
            id: this.generateId('pn'),
            userId,
            valueId: data.valueId,
            title: data.title,
            description: data.description,
            frequency: data.frequency,
            context: data.context,
            isActive: true,
            streak: 0,
            totalCompletions: 0,
            completionLog: [],
            createdAt: now,
            updatedAt: now,
        };

        store[userId].nudges.push(nudge);
        await this.saveStore(store);
        return nudge;
    }

    async updatePracticeNudge(userId: string, nudgeId: string, updates: Partial<Pick<PracticeNudge, 'title' | 'description' | 'frequency' | 'context' | 'isActive'>>): Promise<PracticeNudge | null> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const nudge = store[userId].nudges.find(n => n.id === nudgeId);
        if (!nudge) return null;

        Object.assign(nudge, updates);
        nudge.updatedAt = new Date().toISOString();

        await this.saveStore(store);
        return nudge;
    }

    async deletePracticeNudge(userId: string, nudgeId: string): Promise<boolean> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const idx = store[userId].nudges.findIndex(n => n.id === nudgeId);
        if (idx === -1) return false;

        store[userId].nudges.splice(idx, 1);
        await this.saveStore(store);
        return true;
    }

    // ─── Completions ──────────────────────────────────────

    async logCompletion(userId: string, nudgeId: string, reflection?: string): Promise<PracticeCompletion | null> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const nudge = store[userId].nudges.find(n => n.id === nudgeId);
        if (!nudge) return null;

        const now = new Date().toISOString();
        const today = new Date().toDateString();

        // Check if already completed today
        const alreadyToday = nudge.completionLog.some(
            c => new Date(c.timestamp).toDateString() === today
        );
        if (alreadyToday) throw new Error('Already completed today');

        const completion: PracticeCompletion = {
            id: this.generateId('pc'),
            nudgeId,
            date: today,
            reflection,
            timestamp: now,
        };

        nudge.completionLog.push(completion);
        nudge.totalCompletions += 1;

        // Update streak
        nudge.streak = this.calculateStreak(nudge.completionLog);

        // Limit log to last 365 entries
        if (nudge.completionLog.length > 365) {
            nudge.completionLog = nudge.completionLog.slice(-365);
        }

        nudge.updatedAt = now;
        await this.saveStore(store);
        return completion;
    }

    // ─── Practice Log ─────────────────────────────────────

    async getPracticeLog(userId: string, limit: number = 30): Promise<{
        entries: (PracticeCompletion & { nudgeTitle: string; valueName: string })[];
        totalCompletions: number;
        activeDays: number;
    }> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const allCompletions: (PracticeCompletion & { nudgeTitle: string; valueName: string })[] = [];

        for (const nudge of store[userId].nudges) {
            const value = store[userId].values.find(v => v.id === nudge.valueId);
            for (const c of nudge.completionLog) {
                allCompletions.push({
                    ...c,
                    nudgeTitle: nudge.title,
                    valueName: value?.name || 'Unknown',
                });
            }
        }

        // Sort newest first
        allCompletions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const totalCompletions = allCompletions.length;
        const uniqueDays = new Set(allCompletions.map(c => c.date));

        return {
            entries: allCompletions.slice(0, limit),
            totalCompletions,
            activeDays: uniqueDays.size,
        };
    }

    // ─── Summary ──────────────────────────────────────────

    async getPracticeSummary(userId: string): Promise<{
        valuesCount: number;
        discoveryCompleted: boolean;
        activeNudgesCount: number;
        totalCompletions: number;
        currentStreaks: { nudgeId: string; title: string; streak: number }[];
        todayCompleted: string[];
    }> {
        const store = await this.getStore();
        this.ensureUser(store, userId);

        const data = store[userId];
        const today = new Date().toDateString();

        const activeNudges = data.nudges.filter(n => n.isActive);
        const totalCompletions = data.nudges.reduce((sum, n) => sum + n.totalCompletions, 0);

        const currentStreaks = activeNudges
            .filter(n => n.streak > 0)
            .map(n => ({ nudgeId: n.id, title: n.title, streak: n.streak }))
            .sort((a, b) => b.streak - a.streak);

        const todayCompleted = data.nudges
            .filter(n => n.completionLog.some(c => new Date(c.timestamp).toDateString() === today))
            .map(n => n.id);

        return {
            valuesCount: data.values.length,
            discoveryCompleted: data.discoveryCompleted,
            activeNudgesCount: activeNudges.length,
            totalCompletions,
            currentStreaks,
            todayCompleted,
        };
    }

    // ─── Shared / Team Access ─────────────────────────────

    /**
     * Get a specific user's values (for team/org/member access).
     * Returns only public-safe fields — no nudge internals.
     */
    async getValuesForUser(targetUserId: string): Promise<{
        values: Pick<UserValue, 'id' | 'name' | 'category' | 'source' | 'selfRating'>[];
        discoveryCompleted: boolean;
    }> {
        const store = await this.getStore();
        this.ensureUser(store, targetUserId);
        const data = store[targetUserId];
        return {
            values: data.values.map(v => ({
                id: v.id,
                name: v.name,
                category: v.category,
                source: v.source,
                selfRating: v.selfRating,
            })),
            discoveryCompleted: data.discoveryCompleted,
        };
    }

    /**
     * Get values for multiple users (for org-wide views).
     */
    async getValuesForUsers(userIds: string[]): Promise<Record<string, {
        values: Pick<UserValue, 'id' | 'name' | 'category' | 'source' | 'selfRating'>[];
    }>> {
        const store = await this.getStore();
        const result: Record<string, { values: Pick<UserValue, 'id' | 'name' | 'category' | 'source' | 'selfRating'>[] }> = {};
        for (const uid of userIds) {
            this.ensureUser(store, uid);
            result[uid] = {
                values: store[uid].values.map(v => ({
                    id: v.id,
                    name: v.name,
                    category: v.category,
                    source: v.source,
                    selfRating: v.selfRating,
                })),
            };
        }
        return result;
    }

    // ─── Helpers ──────────────────────────────────────────

    private calculateStreak(log: PracticeCompletion[]): number {
        if (log.length === 0) return 0;

        const sorted = [...log].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        let streak = 0;
        let expectedDate = new Date();
        expectedDate.setHours(0, 0, 0, 0);

        for (const entry of sorted) {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);

            const diff = Math.round((expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diff === 0 || diff === 1) {
                streak++;
                expectedDate = new Date(entryDate);
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const behavioralActivationService = new BehavioralActivationService();
