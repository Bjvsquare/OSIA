import { db } from '../db/JsonDb';

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: string;
    details?: any;
    status: 'success' | 'failure';
}

export class AuditLogger {
    async log(entry: Partial<AuditLog>): Promise<void> {
        try {
            const logs = await db.getCollection<AuditLog>('audit_logs');

            const newLog: AuditLog = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                userId: entry.userId || 'system',
                username: entry.username || 'system',
                action: entry.action || 'unknown',
                status: entry.status || 'success',
                details: entry.details,
            };

            logs.push(newLog);
            await db.saveCollection('audit_logs', logs);
        } catch (error) {
            console.error('[AuditLogger] Failed to log action:', error);
        }
    }

    async getLogs(limit: number = 100): Promise<AuditLog[]> {
        const logs = await db.getCollection<AuditLog>('audit_logs');
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    }
}

export const auditLogger = new AuditLogger();
