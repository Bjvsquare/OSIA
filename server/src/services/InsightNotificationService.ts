import { db } from '../db/JsonDb';
import { randomUUID } from 'crypto';

// --- Insight Notification Types ---

export interface InsightNotification {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUsername?: string;
    insightType: 'focus_area' | 'recommendation' | 'observation';
    title: string;
    content: string;
    affectedLayers: number[];
    category?: string;
    createdAt: string;
    readAt?: string;
}

export interface ShareInsightRequest {
    toUserId: string;
    insightType: 'focus_area' | 'recommendation' | 'observation';
    title: string;
    content: string;
    affectedLayers: number[];
    category?: string;
}

export class InsightNotificationService {

    /**
     * Share an insight with a connected user
     */
    async shareInsight(fromUserId: string, fromUsername: string, request: ShareInsightRequest): Promise<InsightNotification> {
        const notification: InsightNotification = {
            id: `insight_${randomUUID()}`,
            fromUserId,
            fromUsername,
            toUserId: request.toUserId,
            insightType: request.insightType,
            title: request.title,
            content: request.content,
            affectedLayers: request.affectedLayers,
            category: request.category,
            createdAt: new Date().toISOString()
        };

        // Store in JSON db
        const notifications = await db.getCollection<InsightNotification>('insight_notifications');
        notifications.push(notification);
        await db.saveCollection('insight_notifications', notifications);

        console.log(`[InsightNotificationService] Shared insight from ${fromUserId} to ${request.toUserId}: "${request.title}"`);

        return notification;
    }

    /**
     * Get unread insight notifications for a user
     */
    async getReceivedInsights(userId: string): Promise<InsightNotification[]> {
        const notifications = await db.getCollection<InsightNotification>('insight_notifications');
        return notifications
            .filter((n: InsightNotification) => n.toUserId === userId)
            .sort((a: InsightNotification, b: InsightNotification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    /**
     * Get unread count for notification badge
     */
    async getUnreadCount(userId: string): Promise<number> {
        const notifications = await db.getCollection<InsightNotification>('insight_notifications');
        return notifications.filter((n: InsightNotification) => n.toUserId === userId && !n.readAt).length;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notifications = await db.getCollection<InsightNotification>('insight_notifications');
        const notification = notifications.find((n: InsightNotification) => n.id === notificationId && n.toUserId === userId);

        if (notification) {
            notification.readAt = new Date().toISOString();
            await db.saveCollection('insight_notifications', notifications);
        }
    }

    /**
     * Get insights from a specific connection
     */
    async getInsightsFromConnection(userId: string, fromUserId: string): Promise<InsightNotification[]> {
        const notifications = await db.getCollection<InsightNotification>('insight_notifications');
        return notifications
            .filter((n: InsightNotification) => n.toUserId === userId && n.fromUserId === fromUserId)
            .sort((a: InsightNotification, b: InsightNotification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}

export const insightNotificationService = new InsightNotificationService();
