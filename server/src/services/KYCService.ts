import { db } from '../db/JsonDb';

/* ═══════════════════════════════════════════════════════════
   KYCService — KYC Verification Lifecycle Management
   
   Manages the full KYC lifecycle:
   pending → submitted → under_review → verified/rejected → locked
   
   Stored in kyc_records.json via JsonDb
   ═══════════════════════════════════════════════════════════ */

const KYC_DEADLINE_DAYS = 3;
const KYC_EXTENSION_DAYS = 3;

export interface KYCPortrait {
    imageUrl: string;
    uploadedAt: string;
    validationStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    metadata?: {
        width: number;
        height: number;
        format: string;
        fileSizeBytes: number;
    };
}

export interface VerificationEvent {
    event: string;
    timestamp: string;
    details?: string;
}

export interface KYCRecord {
    userId: string;
    accountType: 'individual' | 'organization';
    status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'locked' | 'locked_final';
    registeredAt: string;
    kycDeadline: string;
    unlockUsed: boolean;
    unlockRequestedAt?: string;
    extendedDeadline?: string;
    portrait?: KYCPortrait;
    idDocumentUrl?: string;
    orgVerification?: {
        logoUrl: string;
        logoValidation: 'pending' | 'approved' | 'rejected';
        businessName?: string;
        businessRegDocUrl?: string;
        taxId?: string;
        contactEmail?: string;
    };
    verificationHistory: VerificationEvent[];
    verifiedAt?: string;
    verifiedBy?: 'auto' | 'manual';
}

export type KYCStatus = KYCRecord['status'];

class KYCService {
    private readonly COLLECTION = 'kyc_records';

    /**
     * Initialize a KYC record for a newly registered user.
     * Called automatically during signup.
     */
    async initializeKYC(userId: string, accountType: 'individual' | 'organization' = 'individual'): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);

        // Don't create duplicate
        const existing = records.find(r => r.userId === userId);
        if (existing) return existing;

        const now = new Date();
        const deadline = new Date(now.getTime() + KYC_DEADLINE_DAYS * 24 * 60 * 60 * 1000);

        const record: KYCRecord = {
            userId,
            accountType,
            status: 'pending',
            registeredAt: now.toISOString(),
            kycDeadline: deadline.toISOString(),
            unlockUsed: false,
            verificationHistory: [{
                event: 'kyc_initialized',
                timestamp: now.toISOString(),
                details: `KYC deadline set for ${deadline.toISOString()}`
            }]
        };

        records.push(record);
        await db.saveCollection(this.COLLECTION, records);
        console.log(`[KYC] Initialized KYC for user ${userId}, deadline: ${deadline.toISOString()}`);

        return record;
    }

    /**
     * Get the current KYC status for a user.
     */
    async getStatus(userId: string): Promise<KYCRecord & { timeRemaining?: { days: number; hours: number; minutes: number }; isOverdue: boolean }> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const record = records.find(r => r.userId === userId);

        if (!record) {
            // Auto-create for existing users who registered before KYC was implemented
            const newRecord = await this.initializeKYC(userId);
            return { ...newRecord, isOverdue: false };
        }

        const now = new Date();
        const effectiveDeadline = record.extendedDeadline || record.kycDeadline;
        const deadline = new Date(effectiveDeadline);
        const remaining = deadline.getTime() - now.getTime();
        const isOverdue = remaining <= 0 && !['verified', 'locked', 'locked_final'].includes(record.status);

        const timeRemaining = remaining > 0 ? {
            days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
            hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
            minutes: Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
        } : undefined;

        return { ...record, timeRemaining, isOverdue };
    }

    /**
     * Submit individual KYC with portrait + ID document.
     */
    async submitKYC(
        userId: string,
        portraitUrl: string,
        idDocumentUrl?: string,
        metadata?: { width: number; height: number; format: string; fileSizeBytes: number }
    ): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const idx = records.findIndex(r => r.userId === userId);

        if (idx === -1) {
            throw new Error('KYC record not found. Please contact support.');
        }

        const record = records[idx];

        if (record.status === 'locked' || record.status === 'locked_final') {
            throw new Error('Account is locked. Cannot submit KYC.');
        }

        if (record.status === 'verified') {
            throw new Error('KYC already verified.');
        }

        const now = new Date().toISOString();

        record.portrait = {
            imageUrl: portraitUrl,
            uploadedAt: now,
            validationStatus: 'pending',
            metadata
        };

        if (idDocumentUrl) {
            record.idDocumentUrl = idDocumentUrl;
        }

        record.status = 'submitted';
        record.verificationHistory.push({
            event: 'kyc_submitted',
            timestamp: now,
            details: `Portrait + ID document uploaded`
        });

        records[idx] = record;
        await db.saveCollection(this.COLLECTION, records);
        console.log(`[KYC] User ${userId} submitted individual KYC`);

        return record;
    }

    /**
     * Submit organization KYC with logo + business documentation.
     * Always goes to under_review (no auto-approve for orgs).
     */
    async submitOrgKYC(
        userId: string,
        data: {
            logoUrl: string;
            businessRegDocUrl?: string;
            businessName: string;
            taxId?: string;
            contactEmail?: string;
        }
    ): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const idx = records.findIndex(r => r.userId === userId);

        if (idx === -1) throw new Error('KYC record not found.');

        const record = records[idx];
        const now = new Date().toISOString();

        if (record.status === 'locked' || record.status === 'locked_final') {
            throw new Error('Account is locked. Cannot submit KYC.');
        }

        record.accountType = 'organization';
        record.orgVerification = {
            logoUrl: data.logoUrl,
            logoValidation: 'pending',
            businessName: data.businessName,
            businessRegDocUrl: data.businessRegDocUrl,
            taxId: data.taxId,
            contactEmail: data.contactEmail
        };

        // Orgs always require manual admin review
        record.status = 'under_review';
        record.verificationHistory.push({
            event: 'org_kyc_submitted',
            timestamp: now,
            details: `Org KYC submitted: ${data.businessName}`
        });

        records[idx] = record;
        await db.saveCollection(this.COLLECTION, records);
        console.log(`[KYC] Org KYC submitted for user ${userId}: ${data.businessName}`);

        return record;
    }

    /**
     * Request a 3-day extension (one-time only).
     */
    async requestExtension(userId: string): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const idx = records.findIndex(r => r.userId === userId);

        if (idx === -1) throw new Error('KYC record not found.');

        const record = records[idx];

        if (record.unlockUsed) {
            throw new Error('Extension already used. Only one extension is allowed.');
        }

        if (record.status !== 'locked' && record.status !== 'pending') {
            throw new Error('Extension can only be requested when account is pending or locked.');
        }

        const now = new Date();
        const extension = new Date(now.getTime() + KYC_EXTENSION_DAYS * 24 * 60 * 60 * 1000);

        record.unlockUsed = true;
        record.unlockRequestedAt = now.toISOString();
        record.extendedDeadline = extension.toISOString();
        record.status = 'pending';
        record.verificationHistory.push({
            event: 'extension_granted',
            timestamp: now.toISOString(),
            details: `Extended deadline to ${extension.toISOString()}`
        });

        records[idx] = record;
        await db.saveCollection(this.COLLECTION, records);
        console.log(`[KYC] Extension granted for user ${userId}, new deadline: ${extension.toISOString()}`);

        return record;
    }

    /**
     * Admin: review a submitted KYC.
     */
    async adminReview(userId: string, decision: 'approve' | 'reject', reason?: string): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const idx = records.findIndex(r => r.userId === userId);

        if (idx === -1) throw new Error('KYC record not found.');

        const record = records[idx];
        const now = new Date().toISOString();

        if (decision === 'approve') {
            record.status = 'verified';
            record.verifiedAt = now;
            record.verifiedBy = 'manual';
            if (record.portrait) {
                record.portrait.validationStatus = 'approved';
            }
            record.verificationHistory.push({
                event: 'kyc_approved',
                timestamp: now,
                details: 'Manually approved by admin'
            });
            console.log(`[KYC] User ${userId} KYC APPROVED by admin`);
        } else {
            record.status = 'rejected';
            if (record.portrait) {
                record.portrait.validationStatus = 'rejected';
                record.portrait.rejectionReason = reason || 'Did not meet quality requirements';
            }
            record.verificationHistory.push({
                event: 'kyc_rejected',
                timestamp: now,
                details: reason || 'Rejected by admin'
            });
            console.log(`[KYC] User ${userId} KYC REJECTED: ${reason}`);
        }

        records[idx] = record;
        await db.saveCollection(this.COLLECTION, records);

        return record;
    }

    /**
     * Auto-approve KYC and set portrait as profile picture.
     * Only for individuals. Orgs always need manual review.
     */
    async autoApprove(userId: string): Promise<KYCRecord> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const idx = records.findIndex(r => r.userId === userId);

        if (idx === -1) throw new Error('KYC record not found.');

        const record = records[idx];

        // Never auto-approve organizations
        if (record.accountType === 'organization') {
            throw new Error('Organization KYC requires manual admin review.');
        }

        const now = new Date().toISOString();

        record.status = 'verified';
        record.verifiedAt = now;
        record.verifiedBy = 'auto';
        if (record.portrait) {
            record.portrait.validationStatus = 'approved';
        }
        record.verificationHistory.push({
            event: 'kyc_auto_approved',
            timestamp: now,
            details: 'Passed automated validation checks'
        });

        records[idx] = record;
        await db.saveCollection(this.COLLECTION, records);

        // Set portrait as profile picture
        if (record.portrait?.imageUrl) {
            try {
                const { userService } = require('./UserService');
                await userService.updateAvatar(userId, record.portrait.imageUrl);
                console.log(`[KYC] User ${userId} portrait set as profile picture`);
            } catch (e: any) {
                console.warn(`[KYC] Could not set avatar for ${userId}: ${e.message}`);
            }
        }

        console.log(`[KYC] User ${userId} KYC AUTO-APPROVED`);
        return record;
    }

    /**
     * Check all pending KYC records for deadline expiry.
     * Locks accounts that have passed their deadline.
     */
    async checkDeadlines(): Promise<{ locked: string[]; lockedFinal: string[] }> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        const now = new Date();
        const locked: string[] = [];
        const lockedFinal: string[] = [];
        let changed = false;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if (record.status !== 'pending') continue;

            const effectiveDeadline = record.extendedDeadline || record.kycDeadline;
            const deadline = new Date(effectiveDeadline);

            if (now > deadline) {
                if (record.unlockUsed) {
                    record.status = 'locked_final';
                    record.verificationHistory.push({
                        event: 'account_locked_final',
                        timestamp: now.toISOString(),
                        details: 'Extended deadline expired. Must contact support.'
                    });
                    lockedFinal.push(record.userId);
                } else {
                    record.status = 'locked';
                    record.verificationHistory.push({
                        event: 'account_locked',
                        timestamp: now.toISOString(),
                        details: 'KYC deadline expired. Extension available.'
                    });
                    locked.push(record.userId);
                }
                records[i] = record;
                changed = true;
            }
        }

        if (changed) {
            await db.saveCollection(this.COLLECTION, records);
        }

        if (locked.length > 0 || lockedFinal.length > 0) {
            console.log(`[KYC] Deadline check: ${locked.length} locked, ${lockedFinal.length} locked_final`);
        }

        return { locked, lockedFinal };
    }

    /**
     * Get all submissions pending admin review.
     */
    async getPendingReviews(): Promise<KYCRecord[]> {
        const records = await db.getCollection<KYCRecord>(this.COLLECTION);
        return records.filter(r => r.status === 'submitted' || r.status === 'under_review');
    }

    /**
     * Get all KYC records (admin dashboard).
     */
    async getAllRecords(): Promise<KYCRecord[]> {
        return db.getCollection<KYCRecord>(this.COLLECTION);
    }
}

export const kycService = new KYCService();
