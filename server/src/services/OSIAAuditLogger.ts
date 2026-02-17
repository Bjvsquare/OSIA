/**
 * OSIA Audit Logger — v1.0
 * 
 * Immutable audit trail for all significant OSIA operations.
 * Every snapshot, claim, pattern, and theme operation is logged.
 */

import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';
import { AuditEvent, AuditEventType } from '../types/osia-types';

class OSIAAuditLogger {
    private readonly collectionName = 'osia_audit_log';

    /**
     * Log an audit event. This is append-only - events cannot be modified or deleted.
     */
    async log(
        eventType: AuditEventType,
        userId: string,
        targetId: string,
        metadata: Record<string, unknown> = {}
    ): Promise<string> {
        const event: AuditEvent = {
            eventId: `audit_${randomUUID()}`,
            eventType,
            userId,
            targetId,
            metadata,
            timestamp: new Date().toISOString()
        };

        try {
            let events = await db.getCollection<AuditEvent>(this.collectionName);
            if (!Array.isArray(events)) events = [];
            events.push(event);
            await db.saveCollection(this.collectionName, events);

            console.log(`[OSIAAuditLogger] ${eventType}: ${targetId} for user ${userId}`);
        } catch (e) {
            // Audit logging should never fail silently but also never block operations
            console.error('[OSIAAuditLogger] Failed to log event:', e);
        }

        return event.eventId;
    }

    /**
     * Get all audit events for a user (for debugging/compliance)
     */
    async getUserEvents(userId: string): Promise<AuditEvent[]> {
        const events = await db.getCollection<AuditEvent>(this.collectionName);
        return events
            .filter(e => e.userId === userId)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    /**
     * Get all events for a specific target object
     */
    async getTargetEvents(targetId: string): Promise<AuditEvent[]> {
        const events = await db.getCollection<AuditEvent>(this.collectionName);
        return events
            .filter(e => e.targetId === targetId)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /**
     * Get recent events by type
     */
    async getRecentByType(eventType: AuditEventType, limit: number = 50): Promise<AuditEvent[]> {
        const events = await db.getCollection<AuditEvent>(this.collectionName);
        return events
            .filter(e => e.eventType === eventType)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, limit);
    }
}

export const osiaAuditLogger = new OSIAAuditLogger();
