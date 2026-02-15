import { supabaseService } from './SupabaseService';
import { emailService } from './EmailService';

interface FoundingCircleMember {
    id: string;
    email: string;
    queueNumber: number;
    accessCode: string;
    status: 'pending' | 'approved' | 'activated';
    signedUpAt: string;
    approvedAt: string | null;
    activatedAt: string | null;
    metadata?: {
        referralSource?: string;
        notes?: string;
    };
}

export class FoundingCircleService {
    private readonly MAX_FOUNDING_MEMBERS = 150;

    /**
     * Generate a unique access code for a founding circle member
     */
    /**
     * Generate a unique, secure access code
     * Format: OSIA-XXXX-YYYY-ZZZZ
     */
    private generateAccessCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0 to avoid confusion
        const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `OSIA-${segment()}-${segment()}-${segment()}`;
    }

    /**
     * Helper to map DB result to Interface
     */
    private mapToMember(row: any): FoundingCircleMember {
        return {
            id: row.id,
            email: row.email,
            queueNumber: row.queue_number,
            accessCode: row.access_code,
            status: row.status,
            signedUpAt: row.signed_up_at,
            approvedAt: row.approved_at,
            activatedAt: row.activated_at,
            metadata: row.metadata
        };
    }

    /**
     * Add a new member to the founding circle waitlist
     */
    async joinWaitlist(email: string, referralSource?: string): Promise<{ queueNumber: number; message: string; accessCode?: string }> {
        const supabase = supabaseService.getClient();

        if (!supabase) {
            console.warn('[FoundingCircle] Mock mode: Join successful');
            return {
                queueNumber: 1,
                message: "Welcome to the Founding Circle! (Mock Mode)",
                accessCode: "OSIA-MOCK-CODE"
            };
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('founding_circle')
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (existing) {
            return {
                queueNumber: existing.queue_number,
                message: `You're already on the waitlist at position #${existing.queue_number}`,
                accessCode: existing.access_code
            };
        }

        // Calculate next queue number
        const { count } = await supabase
            .from('founding_circle')
            .select('*', { count: 'exact', head: true });

        const queueNumber = (count || 0) + 1;
        const accessCode = this.generateAccessCode();

        // Create new member
        const { error } = await supabase
            .from('founding_circle')
            .insert({
                email: email.toLowerCase(),
                queue_number: queueNumber,
                status: 'pending',
                access_code: accessCode,
                metadata: { referralSource: referralSource || 'direct' }
            });

        if (error) throw new Error(error.message);

        console.log(`[FoundingCircle] New member joined: ${email} at position #${queueNumber}`);

        // Send welcome email with access code
        emailService.sendAccessCodeEmail(email, accessCode, queueNumber).catch(err => {
            console.error('[FoundingCircle] Failed to send welcome email:', err);
        });

        return {
            queueNumber,
            accessCode,
            message: queueNumber <= this.MAX_FOUNDING_MEMBERS
                ? `Welcome to the Founding Circle! You're #${queueNumber} in line. Your access code is ${accessCode}`
                : `You're on the waitlist at position #${queueNumber}. We'll notify you when spots open up.`
        };
    }

    /**
     * Get status for a specific email
     */
    async getStatus(email: string): Promise<FoundingCircleMember | null> {
        const client = supabaseService.getClient();
        if (!client) return null;

        const { data } = await client
            .from('founding_circle')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        return data ? this.mapToMember(data) : null;
    }

    /**
     * Get all founding circle members (admin only)
     */
    async getAllMembers(): Promise<FoundingCircleMember[]> {
        const client = supabaseService.getClient();
        if (!client) return [];

        const { data } = await client
            .from('founding_circle')
            .select('*')
            .order('queue_number', { ascending: true });

        return (data || []).map(this.mapToMember);
    }

    /**
     * Approve a member and generate their access code
     */
    async approveMember(memberId: string): Promise<FoundingCircleMember> {
        const supabase = supabaseService.getClient();
        if (!supabase) throw new Error('Cannot approve members in mock mode');

        // Fetch current state
        const { data: member } = await supabase
            .from('founding_circle')
            .select('*')
            .eq('id', memberId)
            .single();

        if (!member) throw new Error('Member not found');
        if (member.status === 'approved' || member.status === 'activated') {
            throw new Error('Member already approved or activated');
        }

        const accessCode = this.generateAccessCode();

        const { data: updated, error } = await supabase
            .from('founding_circle')
            .update({
                access_code: accessCode,
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', memberId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        console.log(`[FoundingCircle] Approved member: ${member.email} with code ${accessCode}`);

        // Send access code email
        emailService.sendAccessCodeEmail(member.email, accessCode, member.queue_number).catch(err => {
            console.error('[FoundingCircle] Failed to send approval email:', err);
        });

        return this.mapToMember(updated);
    }

    /**
     * Bulk approve first N pending members
     */
    async bulkApprove(count: number): Promise<FoundingCircleMember[]> {
        const supabase = supabaseService.getClient();
        if (!supabase) return [];

        const { data: pending } = await supabase
            .from('founding_circle')
            .select('*')
            .eq('status', 'pending')
            .order('queue_number', { ascending: true })
            .limit(count);

        if (!pending || pending.length === 0) return [];

        const approved: FoundingCircleMember[] = [];

        for (const member of pending) {
            const accessCode = this.generateAccessCode();
            const { data: updated } = await supabase
                .from('founding_circle')
                .update({
                    access_code: accessCode,
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', member.id)
                .select()
                .single();

            if (updated) {
                approved.push(this.mapToMember(updated));
                // Send access code email for each approved member
                emailService.sendAccessCodeEmail(member.email, accessCode, member.queue_number).catch(err => {
                    console.error(`[FoundingCircle] Failed to send email to ${member.email}:`, err);
                });
            }
        }

        console.log(`[FoundingCircle] Bulk approved ${approved.length} members`);
        return approved;
    }

    /**
     * Validate an access code and mark as activated
     */
    async validateAndActivateCode(accessCode: string, email: string): Promise<{ valid: boolean; email?: string; queueNumber?: number }> {
        const supabase = supabaseService.getClient();
        console.log(`[FoundingCircle] Validating code: ${accessCode} for email: ${email}`);

        if (!supabase) {
            if (accessCode === 'OSIA-MOCK-CODE') {
                return { valid: true, email, queueNumber: 1 };
            }
            return { valid: false };
        }

        const { data: member, error } = await supabase
            .from('founding_circle')
            .select('*')
            .eq('access_code', accessCode)
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (error || !member) {
            console.log(`[FoundingCircle] Code/Email check failed for: ${accessCode} / ${email}`);
            return { valid: false };
        }

        // Check if already activated
        if (member.status === 'activated') {
            console.log(`[FoundingCircle] Code already used by ${email}. Allowing re-validation for idempotency.`);
            // If it's already used by the SAME email, we allow it for idempotency (e.g. page refresh or partial signup)
            return {
                valid: true,
                email: member.email,
                queueNumber: member.queue_number
            };
        }

        // Only allow 'approved' members to activate
        if (member.status !== 'approved') {
            if (member.status === 'pending') {
                throw new Error('Your waitlist spot has not been approved yet. We will notify you when it is your turn!');
            }
            throw new Error('Access code is not valid for activation');
        }

        // Mark as activated
        const { error: updateError } = await supabase
            .from('founding_circle')
            .update({
                status: 'activated',
                activated_at: new Date().toISOString()
            })
            .eq('id', member.id);

        if (updateError) throw new Error(updateError.message);

        console.log(`[FoundingCircle] Activated code for: ${member.email}`);

        return {
            valid: true,
            email: member.email,
            queueNumber: member.queue_number
        };
    }

    /**
     * Get statistics for admin dashboard
     */
    async getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        activated: number;
        remainingSlots: number;
    }> {
        const client = supabaseService.getClient();
        if (!client) {
            return { total: 0, pending: 0, approved: 0, activated: 0, remainingSlots: this.MAX_FOUNDING_MEMBERS };
        }

        const { data } = await client
            .from('founding_circle')
            .select('status');

        const members = data || [];

        return {
            total: members.length,
            pending: members.filter(m => m.status === 'pending').length,
            approved: members.filter(m => m.status === 'approved').length,
            activated: members.filter(m => m.status === 'activated').length,
            remainingSlots: Math.max(0, this.MAX_FOUNDING_MEMBERS - members.filter(m => m.status === 'activated').length)
        };
    }

    /**
     * Remove a member from the waitlist
     */
    async removeMember(memberId: string): Promise<void> {
        const supabase = supabaseService.getClient();
        if (!supabase) return;

        // 1. Get the member's queue number
        const { data: member } = await supabase
            .from('founding_circle')
            .select('queue_number')
            .eq('id', memberId)
            .single();

        if (!member) return;

        const originalQueueNumber = member.queue_number;

        // 2. Delete the member
        await supabase
            .from('founding_circle')
            .delete()
            .eq('id', memberId);

        // 3. Shift others up (Since Founding Circle is limited, sequential updates are fine)
        const { data: others } = await supabase
            .from('founding_circle')
            .select('id, queue_number')
            .gt('queue_number', originalQueueNumber)
            .order('queue_number', { ascending: true });

        if (others && others.length > 0) {
            for (const other of others) {
                await supabase
                    .from('founding_circle')
                    .update({ queue_number: other.queue_number - 1 })
                    .eq('id', other.id);
            }
        }

        console.log(`[FoundingCircle] Removed member: ${memberId} and shifted ${others?.length || 0} members up`);
    }
}

export const foundingCircleService = new FoundingCircleService();
