/**
 * PushNotificationService — Push Notification Scheduler
 * 
 * Manages push subscriptions, schedules nudge notifications
 * based on user-defined times, and sends via web-push.
 */

import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';

// web-push is optional — gracefully degrade if not installed
let webpush: any = null;
try {
    webpush = require('web-push');
} catch {
    console.log('[PushNotification] web-push not installed, push notifications disabled');
}

interface PushSubscriptionRecord {
    id: string;
    userId: string;
    subscription: any; // PushSubscription JSON
    createdAt: string;
}

interface NudgeNotificationLog {
    nudgeId: string;
    userId: string;
    sentAt: string;
    date: string; // YYYY-MM-DD — prevent duplicate sends per day
}

class PushNotificationService {
    private schedulerInterval: ReturnType<typeof setInterval> | null = null;
    private vapidPublicKey: string;
    private vapidPrivateKey: string;

    constructor() {
        // Generate or load VAPID keys
        this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
        this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

        if (webpush && this.vapidPublicKey && this.vapidPrivateKey) {
            webpush.setVapidDetails(
                'mailto:support@osia.app',
                this.vapidPublicKey,
                this.vapidPrivateKey
            );
            console.log('[PushNotification] VAPID configured');
        } else if (webpush && !this.vapidPublicKey) {
            // Auto-generate keys if none provided
            const keys = webpush.generateVAPIDKeys();
            this.vapidPublicKey = keys.publicKey;
            this.vapidPrivateKey = keys.privateKey;
            webpush.setVapidDetails(
                'mailto:support@osia.app',
                this.vapidPublicKey,
                this.vapidPrivateKey
            );
            console.log('[PushNotification] Auto-generated VAPID keys');
            console.log('[PushNotification] Public Key:', this.vapidPublicKey);
        }
    }

    getVapidPublicKey(): string {
        return this.vapidPublicKey;
    }

    /**
     * Save a push subscription for a user
     */
    async saveSubscription(userId: string, subscription: any): Promise<void> {
        const subs = await db.getCollection<PushSubscriptionRecord>('push_subscriptions');

        // Remove existing subscription for this user
        const filtered = Array.isArray(subs)
            ? subs.filter(s => s.userId !== userId)
            : [];

        filtered.push({
            id: `ps_${randomUUID().slice(0, 12)}`,
            userId,
            subscription,
            createdAt: new Date().toISOString(),
        });

        await db.saveCollection('push_subscriptions', filtered);
        console.log(`[PushNotification] Subscription saved for user ${userId}`);
    }

    /**
     * Remove a push subscription for a user
     */
    async removeSubscription(userId: string): Promise<void> {
        const subs = await db.getCollection<PushSubscriptionRecord>('push_subscriptions');
        const filtered = Array.isArray(subs)
            ? subs.filter(s => s.userId !== userId)
            : [];
        await db.saveCollection('push_subscriptions', filtered);
        console.log(`[PushNotification] Subscription removed for user ${userId}`);
    }

    /**
     * Check if a user has an active subscription
     */
    async hasSubscription(userId: string): Promise<boolean> {
        const subs = await db.getCollection<PushSubscriptionRecord>('push_subscriptions');
        if (!Array.isArray(subs)) return false;
        return subs.some(s => s.userId === userId);
    }

    /**
     * Send a push notification to a specific user
     */
    async sendToUser(userId: string, payload: { title: string; body: string; nudgeId?: string; url?: string }): Promise<boolean> {
        if (!webpush) return false;

        const subs = await db.getCollection<PushSubscriptionRecord>('push_subscriptions');
        if (!Array.isArray(subs)) return false;

        const userSub = subs.find(s => s.userId === userId);
        if (!userSub) return false;

        try {
            await webpush.sendNotification(
                userSub.subscription,
                JSON.stringify(payload)
            );
            console.log(`[PushNotification] Sent to user ${userId}: ${payload.title}`);
            return true;
        } catch (err: any) {
            console.error(`[PushNotification] Failed to send to ${userId}:`, err.message);
            // Remove expired/invalid subscriptions
            if (err.statusCode === 410 || err.statusCode === 404) {
                await this.removeSubscription(userId);
            }
            return false;
        }
    }

    /**
     * Start the scheduler to check for due nudge notifications every 60 seconds
     */
    startScheduler(): void {
        if (this.schedulerInterval) return;
        if (!webpush) {
            console.log('[PushNotification] Scheduler not started (web-push unavailable)');
            return;
        }

        console.log('[PushNotification] Scheduler started (60s interval)');
        this.schedulerInterval = setInterval(() => this.checkDueNudges(), 60 * 1000);
        // Initial check after 10s
        setTimeout(() => this.checkDueNudges(), 10 * 1000);
    }

    /**
     * Stop the scheduler
     */
    stopScheduler(): void {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    /**
     * Check for nudges that are due for notification and send them
     */
    private async checkDueNudges(): Promise<void> {
        try {
            const nudges = await db.getCollection<any>('practice_nudges');
            if (!Array.isArray(nudges) || nudges.length === 0) return;

            const now = new Date();
            const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const today = now.toISOString().split('T')[0];

            // Get notification log to prevent duplicates
            let notifLog = await db.getCollection<NudgeNotificationLog>('nudge_notification_log');
            if (!Array.isArray(notifLog)) notifLog = [];

            const dueNudges = nudges.filter(n => {
                if (!n.isActive || !n.notifyAt) return false;
                // Check if current time matches (within 1 minute window)
                if (n.notifyAt !== currentHHMM) return false;
                // Check if already sent today
                const alreadySent = notifLog.some(
                    log => log.nudgeId === n.id && log.date === today
                );
                return !alreadySent;
            });

            for (const nudge of dueNudges) {
                const sent = await this.sendToUser(nudge.userId, {
                    title: '🎯 Practice Time',
                    body: nudge.title,
                    nudgeId: nudge.id,
                    url: '/practice',
                });

                if (sent) {
                    notifLog.push({
                        nudgeId: nudge.id,
                        userId: nudge.userId,
                        sentAt: now.toISOString(),
                        date: today,
                    });
                }
            }

            if (dueNudges.length > 0) {
                await db.saveCollection('nudge_notification_log', notifLog);
            }
        } catch (err) {
            console.error('[PushNotification] Scheduler check error:', err);
        }
    }

    // ━━━ Nudge Schedule Management ━━━

    /**
     * Get the nudge schedule for a user
     */
    async getNudgeSchedule(userId: string): Promise<any> {
        try {
            const nudges = await db.getCollection<any>('practice_nudges') || [];
            const userNudge = nudges.find((n: any) => n.userId === userId && n.isActive);
            return userNudge || null;
        } catch (err) {
            console.error('[PushNotification] getNudgeSchedule error:', err);
            return null;
        }
    }

    /**
     * Save or update a nudge schedule for a user
     */
    async saveNudgeSchedule(userId: string, notifyAt: string, label?: string): Promise<any> {
        try {
            let nudges = await db.getCollection<any>('practice_nudges') || [];
            if (!Array.isArray(nudges)) nudges = [];

            // Find existing nudge for this user
            const existingIndex = nudges.findIndex((n: any) => n.userId === userId);
            const nudgeEntry = {
                id: existingIndex >= 0 ? nudges[existingIndex].id : `nudge_${userId}_${Date.now()}`,
                userId,
                title: label || 'Daily Practice Nudge',
                notifyAt,
                isActive: true,
                createdAt: existingIndex >= 0 ? nudges[existingIndex].createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                nudges[existingIndex] = nudgeEntry;
            } else {
                nudges.push(nudgeEntry);
            }

            await db.saveCollection('practice_nudges', nudges);
            console.log(`[PushNotification] Nudge schedule saved: ${userId} at ${notifyAt}`);
            return nudgeEntry;
        } catch (err) {
            console.error('[PushNotification] saveNudgeSchedule error:', err);
            throw err;
        }
    }

    /**
     * Remove/deactivate a nudge schedule for a user
     */
    async removeNudgeSchedule(userId: string): Promise<void> {
        try {
            let nudges = await db.getCollection<any>('practice_nudges') || [];
            if (!Array.isArray(nudges)) nudges = [];

            nudges = nudges.map((n: any) =>
                n.userId === userId ? { ...n, isActive: false, updatedAt: new Date().toISOString() } : n
            );

            await db.saveCollection('practice_nudges', nudges);
            console.log(`[PushNotification] Nudge schedule removed for: ${userId}`);
        } catch (err) {
            console.error('[PushNotification] removeNudgeSchedule error:', err);
            throw err;
        }
    }
}

export const pushNotificationService = new PushNotificationService();
