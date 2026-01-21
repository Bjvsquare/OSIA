import { supabaseService } from '../services/SupabaseService';
import { originSeedService } from '../services/OriginSeedService';
import * as dotenv from 'dotenv';
dotenv.config();

async function regenerateAll() {
    console.log("--- Starting Global Blueprint Regeneration (V2 Engine) ---");

    const supabase = supabaseService.getClient();

    // 1. Fetch all users from Supabase with birth data
    const { data: users, error } = await supabase
        .from('users')
        .select('id, birth_date, birth_time, birth_location');

    if (error) {
        console.error("❌ Failed to fetch users from Supabase:", error.message);
        process.exit(1);
    }

    console.log(`Found ${users.length} users in Supabase.`);

    let successCount = 0;
    let skipCount = 0;

    for (const user of users) {
        if (!user.birth_date || !user.birth_time || !user.birth_location) {
            console.log(`⚠️ Skipping User ${user.id} (Missing birth data)`);
            skipCount++;
            continue;
        }

        console.log(`🔄 Regenerating for User ${user.id}...`);
        try {
            await originSeedService.generateFoundationalBlueprint(user.id, {
                date: user.birth_date,
                time: user.birth_time,
                location: user.birth_location
            });
            console.log(`   ✅ Success`);
            successCount++;
        } catch (err: any) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log("\n--- Regeneration Complete ---");
    console.log(`✅ Regenerated: ${successCount}`);
    console.log(`⚠️ Skipped: ${skipCount}`);

    process.exit(0);
}

regenerateAll();
