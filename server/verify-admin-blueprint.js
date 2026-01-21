const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'ousia-secret-key-2024-phoenix-trust';
const adminUserId = '1769099927570'; // barendjvv@gmail.com from users.json

const token = jwt.sign({ id: adminUserId, username: 'barendjvv@gmail.com' }, JWT_SECRET);
const API_BASE = 'http://localhost:3001/api';

async function verify() {
    try {
        console.log('--- Verifying Admin Blueprint API ---');
        console.log(`Using Token: ${token.substring(0, 20)}...`);

        // 1. Get Users
        console.log('\n1. Fetching users...');
        const usersRes = await axios.get(`${API_BASE}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Found ${usersRes.data.length} users.`);

        const targetUser = usersRes.data.find(u => u.username === 'sarajvv90@gmail.com') || usersRes.data[0];
        console.log(`Using target user: ${targetUser.username} (${targetUser.id})`);

        // 2. Get History
        console.log('\n2. Fetching blueprint history...');
        const historyRes = await axios.get(`${API_BASE}/admin/blueprint/${targetUser.id}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`History items: ${historyRes.data.length}`);
        console.log(JSON.stringify(historyRes.data, null, 2));

        if (historyRes.data.length > 0) {
            const snapshotId = historyRes.data[0].id;
            console.log(`\n3. Fetching snapshot detail: ${snapshotId}`);
            const snapshotRes = await axios.get(`${API_BASE}/admin/blueprint/snapshot/${snapshotId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Snapshot Detail Status:', snapshotRes.status);
            console.log('Snapshot ID (Expected to be valid):', snapshotRes.data.id);
            console.log('Traits count:', snapshotRes.data.traits?.length);

            if (snapshotRes.data.traits && snapshotRes.data.traits.length > 0) {
                console.log('First trait sample:', JSON.stringify(snapshotRes.data.traits[0], null, 2));
                // Check for 'traitId' field which frontend expects
                if (snapshotRes.data.traits[0].traitId) {
                    console.log('SUCCESS: traitId found in response.');
                } else {
                    console.log('FAILURE: traitId NOT found in response.');
                }
            } else {
                console.log('LOG: Snapshot was found but has no traits.');
            }
        } else {
            console.log('No history found for this user. Cannot verify snapshot detail.');
            console.log('Attempting to find any user with history...');
            for (const user of usersRes.data) {
                const hRes = await axios.get(`${API_BASE}/admin/blueprint/${user.id}/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (hRes.data.length > 0) {
                    console.log(`Found history for user: ${user.username} (${user.id})`);
                    // Recursively check this one? No, just run the logic once.
                    return;
                }
            }
            console.log('No user in the system has blueprint history nodes in Neo4j.');
        }

    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

verify();
