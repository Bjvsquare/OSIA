import { foundingCircleService } from './src/services/FoundingCircleService';
import { supabaseService } from './src/services/SupabaseService';

async function approveAll() {
    console.log("--- Approving all pending members ---");
    try {
        const stats = await foundingCircleService.getStats();
        console.log("Current Stats:", stats);

        if (stats.pending > 0) {
            const approved = await foundingCircleService.bulkApprove(stats.pending);
            console.log(`Successfully approved ${approved.length} members.`);
            approved.forEach(m => console.log(` - ${m.email}: ${m.accessCode}`));
        } else {
            console.log("No pending members found.");
        }
    } catch (err) {
        console.error("Error approving members:", err);
    } finally {
        process.exit(0);
    }
}

approveAll();
