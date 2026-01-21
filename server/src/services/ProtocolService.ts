import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';

interface Protocol {
    id: string;
    userId: string;
    type: string;
    title: string;
    description: string;
    duration: string;
    frequency: string;
    time: string;
    nudgeStyle: string;
    status: 'active' | 'paused' | 'completed';
    createdAt: string;
    completedAt?: string;
    completions: ProtocolCompletion[];
}

interface ProtocolCompletion {
    id: string;
    completedAt: string;
    notes?: string;
    blueprintImpact?: {
        layerId: string;
        delta: number;
    };
}

class ProtocolService {
    /**
     * Create a new protocol for a user
     */
    async createProtocol(userId: string, protocolData: Partial<Protocol>): Promise<Protocol> {
        const protocols = await db.getCollection<Protocol>('user_protocols');

        const newProtocol: Protocol = {
            id: `protocol_${randomUUID()}`,
            userId,
            type: protocolData.type || 'reflection',
            title: protocolData.title || 'Untitled Protocol',
            description: protocolData.description || '',
            duration: protocolData.duration || '5 mins',
            frequency: protocolData.frequency || 'Daily',
            time: protocolData.time || 'Morning',
            nudgeStyle: protocolData.nudgeStyle || 'Gentle reminder',
            status: 'active',
            createdAt: new Date().toISOString(),
            completions: []
        };

        protocols.push(newProtocol);
        await db.saveCollection('user_protocols', protocols);

        return newProtocol;
    }

    /**
     * Get all active protocols for a user
     */
    async getActiveProtocols(userId: string): Promise<Protocol[]> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        return protocols.filter(p => p.userId === userId && p.status === 'active');
    }

    /**
     * Get protocol history (completed) for a user
     */
    async getProtocolHistory(userId: string): Promise<Protocol[]> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        return protocols.filter(p => p.userId === userId && p.status === 'completed');
    }

    /**
     * Get a specific protocol by ID
     */
    async getProtocol(protocolId: string): Promise<Protocol | null> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        return protocols.find(p => p.id === protocolId) || null;
    }

    /**
     * Complete a protocol step and optionally trigger Blueprint adjustment
     */
    async completeProtocolStep(
        userId: string,
        protocolId: string,
        notes?: string,
        blueprintImpact?: { layerId: string; delta: number }
    ): Promise<ProtocolCompletion> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const protocolIndex = protocols.findIndex(p => p.id === protocolId && p.userId === userId);

        if (protocolIndex === -1) {
            throw new Error('Protocol not found');
        }

        const completion: ProtocolCompletion = {
            id: `completion_${randomUUID()}`,
            completedAt: new Date().toISOString(),
            notes,
            blueprintImpact
        };

        protocols[protocolIndex].completions.push(completion);
        await db.saveCollection('user_protocols', protocols);

        // If Blueprint impact is specified, trigger the adjustment
        if (blueprintImpact) {
            await this.applyBlueprintAdjustment(userId, blueprintImpact.layerId, blueprintImpact.delta);
        }

        return completion;
    }

    /**
     * Apply Blueprint adjustment based on protocol completion
     */
    private async applyBlueprintAdjustment(userId: string, layerId: string, delta: number): Promise<void> {
        // This integrates with the existing Blueprint/Origin Seed system
        // For now, we'll store adjustments in a separate collection
        const adjustments = await db.getCollection<any>('blueprint_adjustments');

        adjustments.push({
            id: `adj_${randomUUID()}`,
            userId,
            layerId,
            delta,
            source: 'protocol_completion',
            appliedAt: new Date().toISOString()
        });

        await db.saveCollection('blueprint_adjustments', adjustments);
    }

    /**
     * Pause a protocol
     */
    async pauseProtocol(userId: string, protocolId: string): Promise<void> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const protocol = protocols.find(p => p.id === protocolId && p.userId === userId);

        if (!protocol) throw new Error('Protocol not found');

        protocol.status = 'paused';
        await db.saveCollection('user_protocols', protocols);
    }

    /**
     * Resume a paused protocol
     */
    async resumeProtocol(userId: string, protocolId: string): Promise<void> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const protocol = protocols.find(p => p.id === protocolId && p.userId === userId);

        if (!protocol) throw new Error('Protocol not found');

        protocol.status = 'active';
        await db.saveCollection('user_protocols', protocols);
    }

    /**
     * Mark a protocol as completed (archived)
     */
    async archiveProtocol(userId: string, protocolId: string): Promise<void> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const protocol = protocols.find(p => p.id === protocolId && p.userId === userId);

        if (!protocol) throw new Error('Protocol not found');

        protocol.status = 'completed';
        protocol.completedAt = new Date().toISOString();
        await db.saveCollection('user_protocols', protocols);
    }

    /**
     * Delete a protocol
     */
    async deleteProtocol(userId: string, protocolId: string): Promise<void> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const index = protocols.findIndex(p => p.id === protocolId && p.userId === userId);

        if (index === -1) throw new Error('Protocol not found');

        protocols.splice(index, 1);
        await db.saveCollection('user_protocols', protocols);
    }

    /**
     * Get protocol statistics for a user
     */
    async getProtocolStats(userId: string): Promise<{
        totalActive: number;
        totalCompleted: number;
        totalCompletions: number;
        streakDays: number;
    }> {
        const protocols = await db.getCollection<Protocol>('user_protocols');
        const userProtocols = protocols.filter(p => p.userId === userId);

        const active = userProtocols.filter(p => p.status === 'active');
        const completed = userProtocols.filter(p => p.status === 'completed');
        const allCompletions = userProtocols.flatMap(p => p.completions);

        // Calculate streak (consecutive days with completions)
        const streak = this.calculateStreak(allCompletions);

        return {
            totalActive: active.length,
            totalCompleted: completed.length,
            totalCompletions: allCompletions.length,
            streakDays: streak
        };
    }

    private calculateStreak(completions: ProtocolCompletion[]): number {
        if (completions.length === 0) return 0;

        const dates = completions
            .map(c => new Date(c.completedAt).toDateString())
            .filter((v, i, a) => a.indexOf(v) === i) // unique dates
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let streak = 1;
        const today = new Date().toDateString();

        if (dates[0] !== today && dates[0] !== new Date(Date.now() - 86400000).toDateString()) {
            return 0; // Streak broken
        }

        for (let i = 0; i < dates.length - 1; i++) {
            const curr = new Date(dates[i]).getTime();
            const next = new Date(dates[i + 1]).getTime();
            const diff = (curr - next) / 86400000;

            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }
}

export const protocolService = new ProtocolService();
