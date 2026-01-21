/**
 * OSIA Immutable Snapshot Store — v1.0
 * 
 * Enforces append-only storage for OSIA intelligence data.
 * This is the ONLY service that should write intelligence snapshots.
 * 
 * CRITICAL RULES:
 * 1. Snapshots are NEVER updated - always create a new snapshot
 * 2. Snapshots are NEVER deleted (except via GDPR data deletion flow)
 * 3. Every snapshot links to its previous snapshot for lineage tracking
 * 4. All operations are audit-logged
 */

import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';
import { osiaAuditLogger } from './OSIAAuditLogger';
import {
    OSIABlueprintSnapshot,
    Claim,
    Pattern,
    Theme,
    SnapshotSource,
    ClaimFeedback
} from '../types/osia-types';

class OSIASnapshotStore {
    private readonly snapshotCollection = 'osia_snapshots';
    private readonly claimFeedbackCollection = 'osia_claim_feedback';

    /**
     * Create a new immutable snapshot.
     * This is the ONLY way to persist intelligence state changes.
     */
    async createSnapshot(
        userId: string,
        source: SnapshotSource,
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[],
        signalSnapshotId?: string,
        triggerEventId?: string
    ): Promise<OSIABlueprintSnapshot> {
        const snapshotId = `osia_snap_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        // Get previous snapshot ID for lineage tracking
        const previousSnapshot = await this.getLatestSnapshot(userId);
        const previousSnapshotId = previousSnapshot?.snapshotId;

        const snapshot: OSIABlueprintSnapshot = {
            snapshotId,
            userId,
            timestamp,
            source,
            version: '1.0.0',
            claims: Object.freeze([...claims]) as readonly Claim[],
            patterns: Object.freeze([...patterns]) as readonly Pattern[],
            themes: Object.freeze([...themes]) as readonly Theme[],
            signalSnapshotId,
            previousSnapshotId,
            triggerEventId
        };

        // Persist to storage (append-only)
        const snapshots = await db.getCollection<OSIABlueprintSnapshot>(this.snapshotCollection);
        snapshots.push(snapshot);
        await db.saveCollection(this.snapshotCollection, snapshots);

        // Audit log
        await osiaAuditLogger.log('snapshot_created', userId, snapshotId, {
            source,
            claimCount: claims.length,
            patternCount: patterns.length,
            themeCount: themes.length,
            previousSnapshotId
        });

        console.log(`[OSIASnapshotStore] Created snapshot ${snapshotId} for user ${userId}`);
        return snapshot;
    }

    /**
     * Get the latest snapshot for a user.
     * Uses timestamp ordering to find the most recent.
     */
    async getLatestSnapshot(userId: string): Promise<OSIABlueprintSnapshot | null> {
        const snapshots = await db.getCollection<OSIABlueprintSnapshot>(this.snapshotCollection);
        const userSnapshots = snapshots.filter(s => s.userId === userId);

        if (userSnapshots.length === 0) return null;

        return userSnapshots.sort((a, b) =>
            b.timestamp.localeCompare(a.timestamp)
        )[0];
    }

    /**
     * Get a specific snapshot by ID.
     */
    async getSnapshot(snapshotId: string): Promise<OSIABlueprintSnapshot | null> {
        const snapshots = await db.getCollection<OSIABlueprintSnapshot>(this.snapshotCollection);
        return snapshots.find(s => s.snapshotId === snapshotId) || null;
    }

    /**
     * Get snapshot history for a user (newest first).
     */
    async getSnapshotHistory(userId: string, limit: number = 10): Promise<OSIABlueprintSnapshot[]> {
        const snapshots = await db.getCollection<OSIABlueprintSnapshot>(this.snapshotCollection);
        return snapshots
            .filter(s => s.userId === userId)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Compare two snapshots to see what changed.
     */
    async compareSnapshots(
        olderSnapshotId: string,
        newerSnapshotId: string
    ): Promise<SnapshotDiff | null> {
        const older = await this.getSnapshot(olderSnapshotId);
        const newer = await this.getSnapshot(newerSnapshotId);

        if (!older || !newer) return null;

        const olderClaimIds = new Set(older.claims.map(c => c.claimId));
        const newerClaimIds = new Set(newer.claims.map(c => c.claimId));

        const addedClaims = newer.claims.filter(c => !olderClaimIds.has(c.claimId));
        const removedClaims = older.claims.filter(c => !newerClaimIds.has(c.claimId));
        const stableClaims = newer.claims.filter(c => olderClaimIds.has(c.claimId));

        const olderPatternIds = new Set(older.patterns.map(p => p.patternId));
        const newerPatternIds = new Set(newer.patterns.map(p => p.patternId));

        const addedPatterns = newer.patterns.filter(p => !olderPatternIds.has(p.patternId));
        const removedPatterns = older.patterns.filter(p => !newerPatternIds.has(p.patternId));

        return {
            olderSnapshotId,
            newerSnapshotId,
            timeDelta: new Date(newer.timestamp).getTime() - new Date(older.timestamp).getTime(),
            claims: {
                added: addedClaims,
                removed: removedClaims,
                stable: stableClaims.length
            },
            patterns: {
                added: addedPatterns,
                removed: removedPatterns,
                stable: newer.patterns.length - addedPatterns.length
            },
            themes: {
                older: older.themes,
                newer: newer.themes
            }
        };
    }

    /**
     * Record claim feedback (refinement action).
     * This doesn't modify the claim - it creates a feedback record
     * that influences future snapshot generation.
     */
    async recordClaimFeedback(
        userId: string,
        claimId: string,
        resonance: 'fits' | 'partial' | 'doesnt_fit',
        contextTags?: string[]
    ): Promise<ClaimFeedback> {
        const feedback: ClaimFeedback = {
            feedbackId: `fb_${randomUUID()}`,
            claimId,
            userId,
            resonance,
            contextTags: contextTags ? Object.freeze([...contextTags]) : undefined,
            timestamp: new Date().toISOString()
        };

        const allFeedback = await db.getCollection<ClaimFeedback>(this.claimFeedbackCollection);
        allFeedback.push(feedback);
        await db.saveCollection(this.claimFeedbackCollection, allFeedback);

        await osiaAuditLogger.log('claim_feedback_received', userId, claimId, {
            feedbackId: feedback.feedbackId,
            resonance,
            contextTags
        });

        return feedback;
    }

    /**
     * Get all feedback for a specific claim.
     */
    async getClaimFeedback(claimId: string): Promise<ClaimFeedback[]> {
        const allFeedback = await db.getCollection<ClaimFeedback>(this.claimFeedbackCollection);
        return allFeedback.filter(f => f.claimId === claimId);
    }

    /**
     * Get aggregated confidence adjustment for a claim based on feedback.
     */
    async getClaimConfidenceAdjustment(claimId: string): Promise<number> {
        const feedback = await this.getClaimFeedback(claimId);
        if (feedback.length === 0) return 0;

        // Calculate adjustment: fits = +0.1, partial = 0, doesnt_fit = -0.2
        const adjustments: number[] = feedback.map(f => {
            switch (f.resonance) {
                case 'fits': return 0.1;
                case 'partial': return 0;
                case 'doesnt_fit': return -0.2;
            }
        });

        // Cap total adjustment between -0.5 and +0.3
        const total = adjustments.reduce((sum: number, adj: number) => sum + adj, 0);
        return Math.max(-0.5, Math.min(0.3, total));
    }

    // =========================================================================
    // ENFORCEMENT: These methods explicitly PREVENT mutation
    // =========================================================================

    /**
     * FORBIDDEN: Snapshots cannot be updated.
     * This method exists only to throw if someone tries to call it.
     */
    async updateSnapshot(_snapshotId: string, _updates: Partial<OSIABlueprintSnapshot>): Promise<never> {
        throw new Error(
            '[OSIASnapshotStore] FORBIDDEN: Snapshots are immutable. ' +
            'To change intelligence state, create a new snapshot with createSnapshot().'
        );
    }

    /**
     * FORBIDDEN: Snapshots cannot be deleted (except via GDPR flow).
     * This method exists only to throw if someone tries to call it.
     */
    async deleteSnapshot(_snapshotId: string): Promise<never> {
        throw new Error(
            '[OSIASnapshotStore] FORBIDDEN: Snapshots cannot be deleted directly. ' +
            'Use the GDPR data deletion flow for user data removal.'
        );
    }
}

/**
 * Diff structure for comparing two snapshots
 */
export interface SnapshotDiff {
    olderSnapshotId: string;
    newerSnapshotId: string;
    timeDelta: number;  // milliseconds
    claims: {
        added: readonly Claim[];
        removed: readonly Claim[];
        stable: number;
    };
    patterns: {
        added: readonly Pattern[];
        removed: readonly Pattern[];
        stable: number;
    };
    themes: {
        older: readonly Theme[];
        newer: readonly Theme[];
    };
}

export const osiaSnapshotStore = new OSIASnapshotStore();
