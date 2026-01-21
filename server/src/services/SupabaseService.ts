import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export class SupabaseService {
    private client: SupabaseClient | null = null;
    private static instance: SupabaseService;

    private constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            console.warn('[SupabaseService] Missing credentials. Using mock mode.');
            this.client = null;
            return;
        }

        this.client = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log(`[SupabaseService] Initialized client for ${url}`);
    }

    public static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    getClient(): SupabaseClient | null {
        return this.client;
    }

    async verifyConnectivity(): Promise<boolean> {
        if (!this.client) {
            return false;
        }
        try {
            // Check by querying the users table
            const { error } = await this.client.from('users').select('id').limit(1);
            if (error) throw error;
            console.log('[SupabaseService] Connectivity verified.');
            return true;
        } catch (error) {
            console.error('[SupabaseService] Connectivity failed:', error);
            return false;
        }
    }

    async updateIdentitySignals(userId: string, signals: {
        username: string;
        birthDate: string;
        birthTime?: string;
        birthLocation: string;
        latitude?: number;
        longitude?: number;
        timezone?: string;
        birthTimeConfidence: 'EXACT' | 'WINDOW' | 'UNKNOWN';
        consentVersion: string;
    }): Promise<void> {
        if (!this.client) {
            console.warn('[SupabaseService] Mock mode: skipping identity signal sync.');
            return;
        }

        const { error } = await this.client
            .from('users')
            .upsert({
                id: userId,
                username: signals.username,
                birth_date: signals.birthDate,
                birth_time: signals.birthTime,
                birth_location: signals.birthLocation,
                latitude: signals.latitude,
                longitude: signals.longitude,
                timezone: signals.timezone,
                birth_time_confidence: signals.birthTimeConfidence,
                consent_version: signals.consentVersion
            }, { onConflict: 'username' });

        if (error) {
            console.error('[SupabaseService] Error updating identity signals. Schema mismatch suspected.', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Supabase Signal Sync Failed: ${error.message} (Code: ${error.code})`);
        }
    }
}

export const supabaseService = SupabaseService.getInstance();
