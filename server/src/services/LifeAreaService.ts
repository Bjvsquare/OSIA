import { db } from '../db/JsonDb';

/* ═══════════════════════════════════════════════════════════
   LifeAreaService — Life Area Tracking & Dashboard Aggregation

   Manages 7 core life areas per user:
   Spiritual, Physical Health, Personal, Relationships,
   Career, Business, Finances

   Stored in life_areas.json via JsonDb (keyed by userId)
   ═══════════════════════════════════════════════════════════ */

export type LifeAreaDomain =
    | 'spiritual'
    | 'physical_health'
    | 'personal'
    | 'relationships'
    | 'career'
    | 'business'
    | 'finances';

export const LIFE_AREA_DOMAINS: LifeAreaDomain[] = [
    'spiritual', 'physical_health', 'personal', 'relationships',
    'career', 'business', 'finances'
];

export const LIFE_AREA_META: Record<LifeAreaDomain, { label: string; icon: string; description: string }> = {
    spiritual: { label: 'Spiritual Life', icon: '🕯️', description: 'Purpose, meaning, meditation' },
    physical_health: { label: 'Physical Health', icon: '💪', description: 'Exercise, nutrition, sleep' },
    personal: { label: 'Personal Life', icon: '🪞', description: 'Self-care, hobbies, mental health' },
    relationships: { label: 'Key Relationships', icon: '❤️', description: 'Partner, family, close friends' },
    career: { label: 'Career/Job', icon: '📈', description: 'Performance, skills, growth' },
    business: { label: 'Business', icon: '🏢', description: 'Ventures, leadership, strategy' },
    finances: { label: 'Finances', icon: '💰', description: 'Budgeting, investing, planning' },
};

export interface ScoreEntry {
    score: number;
    date: string;
}

export interface ActivityLogEntry {
    id: string;
    type: 'check_in' | 'goal_progress' | 'one_thing_done' | 'note' | 'score_update';
    details: string;
    timestamp: string;
}

export interface LifeAreaState {
    userId: string;
    domain: LifeAreaDomain;

    // Self-assessment
    healthScore: number;              // 1-10
    lastAssessedAt: string;
    scoreHistory: ScoreEntry[];

    // Current focus
    isActiveFocus: boolean;
    activeSince?: string;

    // Goals
    currentGoal?: string;
    goalDeadline?: string;

    // Activity tracking
    lastActivityAt: string;
    activityLog: ActivityLogEntry[];

    // Daily micro-commitment
    oneTodayText?: string;
    oneTodayCompletedAt?: string;
}

interface LifeAreaStore {
    [userId: string]: LifeAreaState[];
}

class LifeAreaService {

    private async getStore(): Promise<LifeAreaStore> {
        return db.getCollection<any>('life_area_store') as any || {};
    }

    private async saveStore(store: LifeAreaStore): Promise<void> {
        await db.saveCollection('life_area_store', store as any);
    }

    /**
     * Get or lazily initialize all 7 life areas for a user.
     */
    async getAll(userId: string): Promise<LifeAreaState[]> {
        const store = await this.getStore();
        if (!store[userId]) {
            store[userId] = this.createDefaults(userId);
            await this.saveStore(store);
        }
        return store[userId];
    }

    /**
     * Update the health score for a single domain (1-10).
     */
    async updateScore(userId: string, domain: LifeAreaDomain, score: number): Promise<LifeAreaState> {
        if (score < 1 || score > 10) throw new Error('Score must be between 1 and 10');
        if (!LIFE_AREA_DOMAINS.includes(domain)) throw new Error(`Invalid domain: ${domain}`);

        const store = await this.getStore();
        if (!store[userId]) store[userId] = this.createDefaults(userId);

        const area = store[userId].find(a => a.domain === domain);
        if (!area) throw new Error(`Domain not found: ${domain}`);

        const now = new Date().toISOString();
        area.healthScore = score;
        area.lastAssessedAt = now;
        area.scoreHistory.push({ score, date: now });
        // Keep last 50 scores
        if (area.scoreHistory.length > 50) {
            area.scoreHistory = area.scoreHistory.slice(-50);
        }
        area.lastActivityAt = now;
        area.activityLog.push({
            id: this.generateId(),
            type: 'score_update',
            details: `Health score updated to ${score}/10`,
            timestamp: now
        });
        // Keep last 100 activities
        if (area.activityLog.length > 100) {
            area.activityLog = area.activityLog.slice(-100);
        }

        await this.saveStore(store);
        return area;
    }

    /**
     * Toggle active focus and optionally set a goal.
     */
    async setFocus(userId: string, domain: LifeAreaDomain, isActive: boolean, goal?: string, goalDeadline?: string): Promise<LifeAreaState> {
        if (!LIFE_AREA_DOMAINS.includes(domain)) throw new Error(`Invalid domain: ${domain}`);

        const store = await this.getStore();
        if (!store[userId]) store[userId] = this.createDefaults(userId);

        const area = store[userId].find(a => a.domain === domain);
        if (!area) throw new Error(`Domain not found: ${domain}`);

        const now = new Date().toISOString();
        area.isActiveFocus = isActive;
        if (isActive) {
            area.activeSince = now;
            if (goal) area.currentGoal = goal;
            if (goalDeadline) area.goalDeadline = goalDeadline;
        }
        area.lastActivityAt = now;

        await this.saveStore(store);
        return area;
    }

    /**
     * Log an activity in a life area.
     */
    async logActivity(userId: string, domain: LifeAreaDomain, type: ActivityLogEntry['type'], details: string): Promise<LifeAreaState> {
        if (!LIFE_AREA_DOMAINS.includes(domain)) throw new Error(`Invalid domain: ${domain}`);

        const store = await this.getStore();
        if (!store[userId]) store[userId] = this.createDefaults(userId);

        const area = store[userId].find(a => a.domain === domain);
        if (!area) throw new Error(`Domain not found: ${domain}`);

        const now = new Date().toISOString();
        area.lastActivityAt = now;
        area.activityLog.push({
            id: this.generateId(),
            type,
            details,
            timestamp: now
        });
        if (area.activityLog.length > 100) {
            area.activityLog = area.activityLog.slice(-100);
        }

        await this.saveStore(store);
        return area;
    }

    /**
     * Set or complete the "One Thing Today" daily micro-commitment.
     */
    async setOneToday(userId: string, domain: LifeAreaDomain, text: string): Promise<LifeAreaState> {
        const store = await this.getStore();
        if (!store[userId]) store[userId] = this.createDefaults(userId);

        const area = store[userId].find(a => a.domain === domain);
        if (!area) throw new Error(`Domain not found: ${domain}`);

        area.oneTodayText = text;
        area.oneTodayCompletedAt = undefined;

        await this.saveStore(store);
        return area;
    }

    async completeOneToday(userId: string, domain: LifeAreaDomain): Promise<LifeAreaState> {
        const store = await this.getStore();
        if (!store[userId]) store[userId] = this.createDefaults(userId);

        const area = store[userId].find(a => a.domain === domain);
        if (!area) throw new Error(`Domain not found: ${domain}`);

        const now = new Date().toISOString();
        area.oneTodayCompletedAt = now;
        area.lastActivityAt = now;
        area.activityLog.push({
            id: this.generateId(),
            type: 'one_thing_done',
            details: `Completed: ${area.oneTodayText || 'Daily commitment'}`,
            timestamp: now
        });
        if (area.activityLog.length > 100) {
            area.activityLog = area.activityLog.slice(-100);
        }

        await this.saveStore(store);
        return area;
    }

    /**
     * Aggregated dashboard payload.
     */
    async getDashboardSummary(userId: string): Promise<{
        areas: LifeAreaState[];
        activeFocusAreas: LifeAreaState[];
        needsAttention: { domain: LifeAreaDomain; reason: string; daysSince: number }[];
        oneToday: { domain: LifeAreaDomain; text: string; completed: boolean } | null;
        overallScore: number;
    }> {
        const areas = await this.getAll(userId);
        const now = Date.now();

        // Active focus areas
        const activeFocusAreas = areas.filter(a => a.isActiveFocus);

        // Needs attention: no activity in >7 days or declining scores
        const needsAttention: { domain: LifeAreaDomain; reason: string; daysSince: number }[] = [];
        for (const area of areas) {
            const daysSinceActivity = Math.floor((now - new Date(area.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceActivity > 7) {
                needsAttention.push({
                    domain: area.domain,
                    reason: `No activity in ${daysSinceActivity} days`,
                    daysSince: daysSinceActivity
                });
            }
            // Check for declining scores (last 3 entries)
            if (area.scoreHistory.length >= 3) {
                const recent = area.scoreHistory.slice(-3);
                if (recent[2].score < recent[0].score && recent[2].score <= 4) {
                    needsAttention.push({
                        domain: area.domain,
                        reason: `Score declined from ${recent[0].score} to ${recent[2].score}`,
                        daysSince: daysSinceActivity
                    });
                }
            }
        }

        // One Thing Today: pick from the highest-priority active focus area
        let oneToday: { domain: LifeAreaDomain; text: string; completed: boolean } | null = null;
        for (const area of activeFocusAreas) {
            if (area.oneTodayText) {
                const isToday = area.oneTodayCompletedAt
                    ? new Date(area.oneTodayCompletedAt).toDateString() === new Date().toDateString()
                    : false;
                oneToday = {
                    domain: area.domain,
                    text: area.oneTodayText,
                    completed: isToday
                };
                break;
            }
        }

        // Overall average score
        const scored = areas.filter(a => a.healthScore > 0);
        const overallScore = scored.length > 0
            ? Math.round((scored.reduce((sum, a) => sum + a.healthScore, 0) / scored.length) * 10) / 10
            : 0;

        return { areas, activeFocusAreas, needsAttention, oneToday, overallScore };
    }

    // ─── Helpers ──────────────────────────────────────────

    private createDefaults(userId: string): LifeAreaState[] {
        const now = new Date().toISOString();
        return LIFE_AREA_DOMAINS.map(domain => ({
            userId,
            domain,
            healthScore: 5,
            lastAssessedAt: now,
            scoreHistory: [{ score: 5, date: now }],
            isActiveFocus: false,
            lastActivityAt: now,
            activityLog: [],
        }));
    }

    private generateId(): string {
        return `la_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const lifeAreaService = new LifeAreaService();
