import { neo4jService } from '../services/Neo4jService';
import { supabaseService } from '../services/SupabaseService';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

async function cleanupUser() {
    const email = "sarajvv90@gmail.com";
    const userId = "cfd9b903-24a7-45a0-bf99-ac1f6dc5c9a6";

    console.log(`--- Starting Cleanup for ${email} ---`);

    // 1. Neo4j Cleanup
    try {
        const session = await neo4jService.getSession();
        console.log("   Cleaning Neo4j...");
        await session.run(`
            MATCH (u:User {userId: $userId})
            OPTIONAL MATCH (u)-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..]->(s:BlueprintSnapshot)
            DETACH DELETE u, s
        `, { userId });
        await session.close();
        console.log("   ✅ Neo4j cleaned.");
    } catch (e) {
        console.error("   ❌ Neo4j cleanup failed:", e.message);
    }

    // 2. Supabase Cleanup (Waitlist)
    try {
        const supabase = supabaseService.getClient();
        console.log("   Cleaning Supabase Waitlist...");
        const { error } = await supabase
            .from('waitlist')
            .delete()
            .eq('email', email);

        if (error) throw error;
        console.log("   ✅ Supabase Waitlist cleaned.");
    } catch (e) {
        console.warn("   ⚠️ Supabase Cleanup Warning (may not have entry):", e.message);
    }

    console.log(`--- Cleanup Complete. ${email} can now sign up again. ---`);
    process.exit(0);
}

cleanupUser();
