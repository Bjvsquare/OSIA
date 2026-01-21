import { supabaseService } from './SupabaseService';

export class WaitlistService {
    async join(email: string): Promise<{ success: boolean; message: string }> {
        const supabase = supabaseService.getClient();

        if (!supabase) {
            console.warn('[Waitlist] Supabase client missing (Mock Mode). Simulating success.');
            return { success: true, message: "Welcome to the Founding Circle (Mock)." };
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('waitlist')
            .select('*')
            .eq('email', email)
            .single();

        if (existing) {
            return { success: true, message: "You're already on the list!" };
        }

        const { error } = await supabase
            .from('waitlist')
            .insert({
                email: email.toLowerCase()
            });

        if (error) {
            console.error('[Waitlist] Error joining:', error);
            throw new Error(error.message);
        }

        console.log(`[WAITLIST] New signup: ${email}`);
        return { success: true, message: "Welcome to the Founding Circle." };
    }
}

export const waitlistService = new WaitlistService();
