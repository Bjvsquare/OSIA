import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';
import { protocolService } from './ProtocolService';

interface Milestone {
    id: string;
    name: string;
    description: string;
    category: 'onboarding' | 'protocols' | 'team' | 'blueprint' | 'connection';
    requirements: {
        type: 'protocol_completions' | 'days_active' | 'team_joined' | 'blueprint_depth' | 'connections_made' | 'check_ins' | 'messages_sent';
        count: number;
    };
    badgeLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
    order: number;
}

interface UserMilestone {
    id: string;
    userId: string;
    milestoneId: string;
    unlockedAt: string;
}

interface ActivityLog {
    id: string;
    userId: string;
    type: 'check_in' | 'protocol_completion' | 'team_message' | 'team_created' | 'team_joined' | 'connection_made' | 'blueprint_refined' | 'session_active' | 'recalibration_complete';
    metadata?: any;
    creditValue: number;
    createdAt: string;
    billingPeriod: string; // YYYY-MM format
}

interface SubscriptionCredits {
    userId: string;
    billingPeriod: string;
    totalCredits: number;
    discountPercentage: number;
    activities: { type: string; count: number; credits: number }[];
    updatedAt: string;
}

// Credit values for different activities (totaling 100+ possible per month)
const CREDIT_VALUES = {
    check_in: 2,              // Daily check-in
    protocol_completion: 3,    // Complete a protocol step
    team_message: 1,          // Send a team message
    team_created: 10,         // Create a team
    team_joined: 5,           // Join a team
    connection_made: 8,       // Make a 1-on-1 connection
    blueprint_refined: 5,     // Refine Blueprint metrics
    session_active: 1,         // Daily active session
    recalibration_complete: 10 // Complete a recalibration session
};

// Credits needed for each discount tier
const DISCOUNT_TIERS = [
    { credits: 25, discount: 25 },
    { credits: 50, discount: 50 },
    { credits: 75, discount: 75 },
    { credits: 100, discount: 100 }
];

// Level benefits
const LEVEL_BENEFITS = {
    1: { title: 'Explorer', perks: ['Basic Blueprint access'] },
    2: { title: 'Practitioner', perks: ['Unlock advanced protocols', '10% bonus credits'] },
    3: { title: 'Seeker', perks: ['Priority pattern insights', '15% bonus credits'] },
    4: { title: 'Integrator', perks: ['Team leadership features', '20% bonus credits'] },
    5: { title: 'Architect', perks: ['Blueprint sharing', '25% bonus credits'] },
    6: { title: 'Master', perks: ['Mentorship access', '30% bonus credits'] },
    7: { title: 'Luminary', perks: ['Founding Circle recognition', '50% bonus credits', 'Early feature access'] }
};

// Default milestone definitions
const DEFAULT_MILESTONES: Milestone[] = [
    // Foundation Phase
    {
        id: 'milestone_foundation_complete',
        name: 'Foundation Established',
        description: 'Created your account and completed initial setup',
        category: 'onboarding',
        requirements: { type: 'days_active', count: 1 },
        badgeLevel: 'bronze',
        order: 1
    },
    {
        id: 'milestone_first_protocol',
        name: 'First Protocol Activated',
        description: 'Started your first growth protocol',
        category: 'protocols',
        requirements: { type: 'protocol_completions', count: 1 },
        badgeLevel: 'bronze',
        order: 2
    },
    {
        id: 'milestone_first_checkin',
        name: 'Self-Awareness Begins',
        description: 'Completed your first daily check-in',
        category: 'blueprint',
        requirements: { type: 'check_ins', count: 1 },
        badgeLevel: 'bronze',
        order: 3
    },
    // Pattern Discovery Phase
    {
        id: 'milestone_week_streak',
        name: 'Week of Commitment',
        description: 'Maintained activity for 7 consecutive days',
        category: 'protocols',
        requirements: { type: 'days_active', count: 7 },
        badgeLevel: 'silver',
        order: 4
    },
    {
        id: 'milestone_ten_completions',
        name: 'Consistent Practitioner',
        description: 'Completed 10 protocol sessions',
        category: 'protocols',
        requirements: { type: 'protocol_completions', count: 10 },
        badgeLevel: 'silver',
        order: 5
    },
    // Relational Phase
    {
        id: 'milestone_team_joined',
        name: 'Team Collaborator',
        description: 'Joined your first team',
        category: 'team',
        requirements: { type: 'team_joined', count: 1 },
        badgeLevel: 'silver',
        order: 6
    },
    {
        id: 'milestone_connection_made',
        name: 'Connection Established',
        description: 'Created your first relational connection',
        category: 'connection',
        requirements: { type: 'connections_made', count: 1 },
        badgeLevel: 'gold',
        order: 7
    },
    {
        id: 'milestone_team_creator',
        name: 'Community Builder',
        description: 'Created a team for family, friends, or work',
        category: 'team',
        requirements: { type: 'team_joined', count: 2 },
        badgeLevel: 'gold',
        order: 8
    },
    // Mastery Phase
    {
        id: 'milestone_month_active',
        name: 'Month of Growth',
        description: 'Active on the platform for 30 days',
        category: 'onboarding',
        requirements: { type: 'days_active', count: 30 },
        badgeLevel: 'gold',
        order: 9
    },
    {
        id: 'milestone_fifty_completions',
        name: 'Pattern Master',
        description: 'Completed 50 protocol sessions',
        category: 'protocols',
        requirements: { type: 'protocol_completions', count: 50 },
        badgeLevel: 'platinum',
        order: 10
    },
    {
        id: 'milestone_full_discount',
        name: 'Engagement Champion',
        description: 'Earned 100% subscription discount in a month',
        category: 'onboarding',
        requirements: { type: 'check_ins', count: 30 },
        badgeLevel: 'platinum',
        order: 11
    }
];

class JourneyService {
    private milestones: Milestone[] = DEFAULT_MILESTONES;

    /**
     * Log an activity and award credits
     */
    async logActivity(userId: string, type: keyof typeof CREDIT_VALUES, metadata?: any): Promise<ActivityLog> {
        const activities = await db.getCollection<ActivityLog>('journey_activities');
        const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

        const activity: ActivityLog = {
            id: `act_${randomUUID()}`,
            userId,
            type,
            metadata,
            creditValue: CREDIT_VALUES[type],
            createdAt: new Date().toISOString(),
            billingPeriod
        };

        activities.push(activity);
        await db.saveCollection('journey_activities', activities);

        // Update subscription credits
        await this.updateSubscriptionCredits(userId, billingPeriod);

        // Check for new milestones
        await this.checkAndUnlockMilestones(userId);

        return activity;
    }

    /**
     * Calculate and update subscription credits for current billing period
     */
    async updateSubscriptionCredits(userId: string, billingPeriod: string): Promise<SubscriptionCredits> {
        const activities = await db.getCollection<ActivityLog>('journey_activities');
        const periodActivities = activities.filter(a => a.userId === userId && a.billingPeriod === billingPeriod);

        // Get user's level for bonus calculation
        const level = await this.calculateJourneyLevel(userId);
        const bonusPerk = LEVEL_BENEFITS[level.level as keyof typeof LEVEL_BENEFITS]?.perks
            .find(p => p.includes('bonus credits'));
        const bonusMatch = bonusPerk?.match(/(\d+)%/);
        const bonusPercent = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
        const bonusMultiplier = 1 + bonusPercent / 100;

        // Calculate credits by type
        const activitySummary: { type: string; count: number; credits: number }[] = [];
        const typeCounts: Record<string, number> = {};

        for (const activity of periodActivities) {
            typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
        }

        let totalCredits = 0;
        for (const [type, count] of Object.entries(typeCounts)) {
            const baseCredits = count * CREDIT_VALUES[type as keyof typeof CREDIT_VALUES];
            const credits = Math.round(baseCredits * bonusMultiplier);
            totalCredits += credits;
            activitySummary.push({ type, count, credits });
        }

        // Calculate discount percentage (capped at 100%)
        const discountPercentage = Math.min(100,
            DISCOUNT_TIERS.reduce((discount, tier) =>
                totalCredits >= tier.credits ? tier.discount : discount, 0
            )
        );

        const creditsData: SubscriptionCredits = {
            userId,
            billingPeriod,
            totalCredits,
            discountPercentage,
            activities: activitySummary,
            updatedAt: new Date().toISOString()
        };

        // Save to user profile
        const credits = await db.getCollection<SubscriptionCredits>('subscription_credits');
        const existingIndex = credits.findIndex(c => c.userId === userId && c.billingPeriod === billingPeriod);

        if (existingIndex >= 0) {
            credits[existingIndex] = creditsData;
        } else {
            credits.push(creditsData);
        }
        await db.saveCollection('subscription_credits', credits);

        return creditsData;
    }

    /**
     * Get subscription credits for current billing period
     */
    async getSubscriptionCredits(userId: string): Promise<SubscriptionCredits> {
        const billingPeriod = new Date().toISOString().slice(0, 7);
        const credits = await db.getCollection<SubscriptionCredits>('subscription_credits');
        const existing = credits.find(c => c.userId === userId && c.billingPeriod === billingPeriod);

        if (existing) return existing;

        // Return empty if no activities yet
        return {
            userId,
            billingPeriod,
            totalCredits: 0,
            discountPercentage: 0,
            activities: [],
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Get full journey progress for a user
     */
    async getJourneyProgress(userId: string): Promise<any> {
        const userMilestones = await this.getUserMilestones(userId);
        const completedIds = userMilestones.map(um => um.milestoneId);

        const completedMilestones = userMilestones.map(um => ({
            ...um,
            ...this.milestones.find(m => m.id === um.milestoneId)
        }));

        const availableMilestones = this.milestones.filter(m => !completedIds.includes(m.id));

        // Determine current phase
        const highestCompleted = Math.max(
            0,
            ...userMilestones.map(um => {
                const m = this.milestones.find(m => m.id === um.milestoneId);
                return m?.order || 0;
            })
        );

        const currentPhase = Math.floor(highestCompleted / 3) + 1;
        const phaseNames = ['Foundation', 'Pattern Discovery', 'Relational Connect', 'Mastery & Integration'];

        // Next milestones
        const nextMilestones = availableMilestones
            .sort((a, b) => a.order - b.order)
            .slice(0, 3);

        // Get subscription credits
        const subscriptionCredits = await this.getSubscriptionCredits(userId);

        // Get activity stats for this month
        const activities = await db.getCollection<ActivityLog>('journey_activities');
        const billingPeriod = new Date().toISOString().slice(0, 7);
        const monthlyActivities = activities.filter(a => a.userId === userId && a.billingPeriod === billingPeriod);

        const activeDays = new Set(monthlyActivities.map(a => a.createdAt.slice(0, 10))).size;

        return {
            currentPhase,
            totalPhases: 4,
            phaseName: phaseNames[Math.min(currentPhase - 1, 3)],
            completedMilestones,
            availableMilestones,
            nextMilestones,
            subscriptionCredits,
            activeDaysThisMonth: activeDays,
            // Removed overallProgress - growth is infinite
        };
    }

    /**
     * Get all milestones a user has unlocked
     */
    async getUserMilestones(userId: string): Promise<UserMilestone[]> {
        const milestones = await db.getCollection<UserMilestone>('user_milestones');
        return milestones.filter(m => m.userId === userId);
    }

    /**
     * Get user's earned badges
     */
    async getUserBadges(userId: string): Promise<Array<Milestone & { unlockedAt: string }>> {
        const userMilestones = await this.getUserMilestones(userId);

        return userMilestones.map(um => {
            const milestone = this.milestones.find(m => m.id === um.milestoneId);
            return {
                ...milestone!,
                unlockedAt: um.unlockedAt
            };
        });
    }

    /**
     * Unlock a milestone
     */
    async unlockMilestone(userId: string, milestoneId: string): Promise<UserMilestone> {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) throw new Error('Milestone not found');

        const existing = await db.getCollection<UserMilestone>('user_milestones');
        const alreadyUnlocked = existing.find(um => um.userId === userId && um.milestoneId === milestoneId);

        if (alreadyUnlocked) throw new Error('Milestone already unlocked');

        const userMilestone: UserMilestone = {
            id: `um_${randomUUID()}`,
            userId,
            milestoneId,
            unlockedAt: new Date().toISOString()
        };

        existing.push(userMilestone);
        await db.saveCollection('user_milestones', existing);

        return userMilestone;
    }

    /**
     * Check and unlock earned milestones
     */
    async checkAndUnlockMilestones(userId: string): Promise<UserMilestone[]> {
        const unlocked: UserMilestone[] = [];
        const userMilestones = await this.getUserMilestones(userId);
        const completedIds = userMilestones.map(um => um.milestoneId);

        const stats = await this.getActivityStats(userId);

        for (const milestone of this.milestones) {
            if (completedIds.includes(milestone.id)) continue;

            let qualified = false;
            const req = milestone.requirements;

            switch (req.type) {
                case 'protocol_completions':
                    qualified = stats.protocolCompletions >= req.count;
                    break;
                case 'days_active':
                    qualified = stats.daysActive >= req.count;
                    break;
                case 'team_joined':
                    qualified = stats.teamsJoined >= req.count;
                    break;
                case 'connections_made':
                    qualified = stats.connectionsMade >= req.count;
                    break;
                case 'check_ins':
                    qualified = stats.checkIns >= req.count;
                    break;
                case 'messages_sent':
                    qualified = stats.messagesSent >= req.count;
                    break;
            }

            if (qualified) {
                try {
                    const um = await this.unlockMilestone(userId, milestone.id);
                    unlocked.push(um);
                } catch (e) {
                    // Already unlocked
                }
            }
        }

        return unlocked;
    }

    /**
     * Get comprehensive activity stats
     */
    async getActivityStats(userId: string): Promise<{
        daysActive: number;
        teamsJoined: number;
        connectionsMade: number;
        protocolCompletions: number;
        checkIns: number;
        messagesSent: number;
    }> {
        const activities = await db.getCollection<ActivityLog>('journey_activities');
        const userActivities = activities.filter(a => a.userId === userId);

        // Count unique active days
        const activeDays = new Set(userActivities.map(a => a.createdAt.slice(0, 10)));

        // Count by type
        const typeCounts = userActivities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Get teams
        const teams = await db.getCollection<any>('teams');
        const teamsJoined = teams.filter(t => t.members?.some((m: any) => m.userId === userId)).length;

        // Get connections
        const connections = await db.getCollection<any>('connections');
        const connectionsMade = connections.filter(c => c.userId === userId || c.targetUserId === userId).length;

        // Get protocol completions
        const protocolStats = await protocolService.getProtocolStats(userId);

        return {
            daysActive: activeDays.size || 1,
            teamsJoined,
            connectionsMade,
            protocolCompletions: protocolStats.totalCompletions,
            checkIns: typeCounts['check_in'] || 0,
            messagesSent: typeCounts['team_message'] || 0
        };
    }

    /**
     * Calculate journey level with benefits
     */
    async calculateJourneyLevel(userId: string): Promise<{
        level: number;
        title: string;
        perks: string[];
        pointsToNextLevel: number;
        totalPoints: number;
        nextLevelTitle?: string;
    }> {
        const userMilestones = await this.getUserMilestones(userId);
        const stats = await this.getActivityStats(userId);

        // Calculate points
        let points = 0;

        // Points from milestones
        for (const um of userMilestones) {
            const milestone = this.milestones.find(m => m.id === um.milestoneId);
            if (milestone) {
                const levelPoints = { bronze: 10, silver: 25, gold: 50, platinum: 100 };
                points += levelPoints[milestone.badgeLevel] || 10;
            }
        }

        // Points from activity
        points += stats.protocolCompletions * 5;
        points += stats.checkIns * 2;
        points += stats.connectionsMade * 10;
        points += stats.teamsJoined * 15;

        // Calculate level
        const levelThresholds = [0, 50, 150, 300, 500, 750, 1000];

        let level = 1;
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (points >= levelThresholds[i]) {
                level = i + 1;
                break;
            }
        }

        const benefits = LEVEL_BENEFITS[level as keyof typeof LEVEL_BENEFITS];
        const nextThreshold = levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
        const nextBenefits = LEVEL_BENEFITS[(level + 1) as keyof typeof LEVEL_BENEFITS];

        return {
            level,
            title: benefits?.title || 'Luminary',
            perks: benefits?.perks || [],
            pointsToNextLevel: Math.max(0, nextThreshold - points),
            totalPoints: points,
            nextLevelTitle: nextBenefits?.title
        };
    }

    getAllMilestones(): Milestone[] {
        return this.milestones;
    }

    getCreditValues() {
        return CREDIT_VALUES;
    }

    getDiscountTiers() {
        return DISCOUNT_TIERS;
    }
}

export const journeyService = new JourneyService();
