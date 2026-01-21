import { db } from '../db/JsonDb';
import { supabaseService } from './SupabaseService';
import { neo4jService } from './Neo4jService';

export class MigrationService {
    async migrateAll() {
        console.log('[Migration] Starting migration...');

        await this.migrateUsers();
        await this.migrateFoundingCircle();
        await this.migrateProfilesToGraph();

        console.log('[Migration] Migration complete.');
    }

    private async migrateUsers() {
        const users = await db.getCollection<any>('users');
        const supabase = supabaseService.getClient();
        if (!supabase) {
            console.warn('[Migration] Supabase mock mode: skipping user migration');
            return;
        }

        for (const user of users) {
            // Note: In a real Supabase setup, you'd usually create them in auth.users first.
            // For this migration, we assume the public.users table exists.
            const { error } = await supabase.from('users').upsert({
                id: user.id.length === 36 ? user.id : undefined, // Check if it's already a UUID
                username: user.username,
                name: user.name,
                bio: user.bio,
                avatar_url: user.avatarUrl,
                is_admin: user.isAdmin,
                created_at: user.createdAt
            });
            if (error) console.error(`[Migration] Error migrating user ${user.username}:`, error.message);
        }
        console.log(`[Migration] Migrated ${users.length} users to Supabase.`);
    }

    private async migrateFoundingCircle() {
        const items = await db.getCollection<any>('founding_circle');
        const supabase = supabaseService.getClient();
        if (!supabase) {
            console.warn('[Migration] Supabase mock mode: skipping founding circle migration');
            return;
        }

        for (const item of items) {
            const { error } = await supabase.from('founding_circle').upsert({
                email: item.email,
                queue_number: item.queueNumber,
                access_code: item.accessCode,
                status: item.status,
                signed_up_at: item.signedUpAt,
                approved_at: item.approvedAt,
                activated_at: item.activatedAt,
                metadata: item.metadata
            });
            if (error) console.error(`[Migration] Error migrating founding circle item ${item.email}:`, error.message);
        }
        console.log(`[Migration] Migrated ${items.length} founding circle items to Supabase.`);
    }

    private async migrateProfilesToGraph() {
        const profiles = await db.getCollection<any>('profiles');

        for (const profile of profiles) {
            // Create user node
            await neo4jService.runQuery(
                'MERGE (u:User {userId: $userId})',
                { userId: profile.userId || profile.user_id }
            );

            // Create traits and relationships
            for (const trait of profile.trait_vector) {
                await neo4jService.runQuery(`
                    MERGE (t:Trait {traitId: $traitId})
                    WITH t
                    MATCH (u:User {userId: $userId})
                    MERGE (u)-[r:HAS_TRAIT]->(t)
                    SET r.score = $score,
                        r.confidence = $confidence,
                        r.updated_at = timestamp()
                `, {
                    userId: profile.userId || profile.user_id,
                    traitId: trait.trait_id,
                    score: trait.score,
                    confidence: trait.confidence
                });
            }
        }
        console.log(`[Migration] Migrated ${profiles.length} profiles to Neo4j Graph.`);
    }
}

export const migrationService = new MigrationService();
