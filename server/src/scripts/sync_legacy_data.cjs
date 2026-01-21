const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load env from server/.env
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading env from: ' + envPath);
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found at ' + envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.log('Available keys: ' + Object.keys(env).join(', '));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncFoundingCircle() {
    console.log('Syncing Founding Circle data...');
    const jsonPath = path.resolve(__dirname, '../../data/founding_circle.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('No JSON data found at ' + jsonPath);
        return;
    }

    const { data: membersJson } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // Wait, the file I saw earlier was an array directly, not {data: [...]}.
    const members = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const member of members) {
        console.log(`Processing ${member.email}...`);

        const { data: existing } = await supabase
            .from('founding_circle')
            .select('*')
            .eq('email', member.email.toLowerCase())
            .maybeSingle();

        const payload = {
            email: member.email.toLowerCase(),
            queue_number: member.queueNumber,
            access_code: member.accessCode,
            status: member.status,
            signed_up_at: member.signedUpAt,
            approved_at: member.approvedAt,
            activated_at: member.activatedAt,
            metadata: member.metadata
        };

        if (existing) {
            console.log(`  - Already in DB. Updating...`);
            await supabase
                .from('founding_circle')
                .update(payload)
                .eq('id', existing.id);
        } else {
            console.log(`  - Inserting new record...`);
            const { error } = await supabase.from('founding_circle').insert(payload);
            if (error) console.error('Error inserting:', error);
        }
    }
    console.log('Sync complete.');
}

syncFoundingCircle().catch(console.error);
