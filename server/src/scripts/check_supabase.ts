import { supabaseService } from '../services/SupabaseService';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSupabase() {
    console.log("--- Checking Supabase Content ---");
    const supabase = supabaseService.getClient();

    // 1. Check Connectivity/Count
    const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("❌ Error checking count:", countError.message);
    } else {
        console.log(`✅ Total Users in 'users' table: ${count}`);
    }

    // 2. Check for Sara specifically
    const saraId = "993afb5f-da82-4e3d-975b-d12945286133";
    const { data: sara, error: saraError } = await supabase
        .from('users')
        .select('id, birth_date, birth_location')
        .eq('id', saraId)
        .single();

    if (saraError) {
        console.error(`❌ Sara (${saraId}) not found:`, saraError.message);
    } else {
        console.log(`✅ Found Sara:`, sara);
    }

    process.exit(0);
}

checkSupabase();
