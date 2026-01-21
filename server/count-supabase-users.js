const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function countUsers() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(url, key);

    try {
        const { data, count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        console.log(`Supabase users count: ${count}`);

        // Get some emails to compare
        const { data: users, error: err2 } = await supabase
            .from('users')
            .select('username')
            .limit(10);

        if (err2) throw err2;
        console.log('Sample usernames from Supabase:');
        users.forEach(u => console.log(` - ${u.username}`));

    } catch (e) {
        console.error('Failed to count users:', e.message);
    }
}

countUsers();
