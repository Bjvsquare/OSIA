import { db } from '../db/JsonDb';

export interface SystemError {
    id: string;
    timestamp: string;
    userId?: string;
    endpoint?: string;
    message: string;
    stack?: string;
    status: 'new' | 'resolved';
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorLogger {
    async log(error: Partial<SystemError>): Promise<void> {
        const errors = await db.getCollection<SystemError>('errors');

        const newError: SystemError = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: 'new',
            severity: 'medium',
            message: 'Unknown error',
            ...error
        };

        errors.push(newError);
        await db.saveCollection('errors', errors);

        console.error(`[ErrorLogger] ${newError.severity.toUpperCase()}: ${newError.message}`);
    }

    async getErrors(): Promise<SystemError[]> {
        return await db.getCollection<SystemError>('errors');
    }

    async resolveError(id: string): Promise<void> {
        const errors = await db.getCollection<SystemError>('errors');
        const index = errors.findIndex(e => e.id === id);
        if (index !== -1) {
            errors[index].status = 'resolved';
            await db.saveCollection('errors', errors);
        }
    }
}

export const errorLogger = new ErrorLogger();
