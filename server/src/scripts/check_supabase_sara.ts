import { supabaseService } from '../services/SupabaseService';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSaraData() {
    const email = "sarajvv90@gmail.com";
    const supabase = supabaseService.getClient();

    console.log(`--- Checking Supabase for Email: ${email} ---`);

    // 1. Check Users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', email);

    if (userError) {
        console.error("❌ Error fetching from users table:", userError.message);
    } else if (userData && userData.length > 0) {
        const user = userData[0];
        console.log("✅ User Found in 'users' table:");
        console.log(`   ID: ${user.id}`);
        console.log(`   Birth Date: ${user.birth_date}`);
        console.log(`   Birth Time: ${user.birth_time}`);
        console.log(`   Birth Location: ${user.birth_location}`);

        if (user.birth_date && user.birth_location) {
            console.log("\n✨ Found complete birth data in 'users' table.");
            return;
        }
    } else {
        console.log("ℹ️ No user found in 'users' table by username.");
    }

    // 2. Check Waitlist table (sometimes data is left here)
    const { data: waitlistData, error: waitlistError } = await supabase
        .from('waitlist')
        .select('*')
        .eq('email', email);

    if (waitlistError) {
        console.error("❌ Error fetching from waitlist table:", waitlistError.message);
    } else if (waitlistData && waitlistData.length > 0) {
        const entry = waitlistData[0];
        console.log("✅ Entry Found in 'waitlist' table:");
        console.log(JSON.stringify(entry, null, 2));
    } else {
        console.log("ℹ️ No entry found in 'waitlist' table by email.");
    }
}

checkSaraData();
