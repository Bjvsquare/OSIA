import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncFoundingCircle() {
    console.log('Syncing Founding Circle data...');
    const jsonPath = path.join(__dirname, '../../data/founding_circle.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('No JSON data found.');
        return;
    }

    const members = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const member of members) {
        console.log(`Processing ${member.email}...`);

        // Check if exists
        const { data: existing } = await supabase
            .from('founding_circle')
            .select('id')
            .eq('email', member.email)
            .single();

        if (existing) {
            console.log(`  - Already in DB (ID: ${existing.id}). Updating access code...`);
            // Ensure access code matches if it differs
            await supabase
                .from('founding_circle')
                .update({
                    access_code: member.accessCode,
                    status: member.status,
                    queue_number: member.queueNumber
                })
                .eq('id', existing.id);
        } else {
            console.log(`  - Inserting new record...`);
            const { error } = await supabase.from('founding_circle').insert({
                // id: member.id, // Let Supabase gen UUID or use existing? Better to let Supabase gen UUID usually, but to keep links we might want to map.
                // For simplicity, let's just insert data.
                email: member.email,
                queue_number: member.queueNumber,
                access_code: member.accessCode,
                status: member.status,
                signed_up_at: member.signedUpAt,
                approved_at: member.approvedAt,
                activated_at: member.activatedAt,
                metadata: member.metadata
            });
            if (error) console.error('Error inserting:', error);
        }
    }
    console.log('Sync complete.');
}

syncFoundingCircle();
