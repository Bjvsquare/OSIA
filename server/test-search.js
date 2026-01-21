const axios = require('axios');

async function testSearch() {
    const BASE_URL = 'http://localhost:3001';
    const TEST_EMAIL = `tester_${Date.now()}@example.com`;
    const TEST_PASS = 'password123';

    try {
        console.log(`--- Signing up with ${TEST_EMAIL} ---`);
        const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
            username: TEST_EMAIL,
            password: TEST_PASS
        });
        const token = signupRes.data.token;
        const currentUserId = signupRes.data.user.id;
        console.log(`   Logged in. userId: ${currentUserId}`);

        const queries = ['Sara', 'Barend', 'barendjvv', 'metavr', 'example.com'];

        for (const q of queries) {
            console.log(`\n--- Searching for "${q}" ---`);
            try {
                const res = await axios.get(`${BASE_URL}/api/connect/search?q=${q}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`Results for "${q}": Found ${res.data.length}`);
                res.data.forEach(u => console.log(` - ${u.username} (${u.name || 'No Name'})`));
            } catch (e) {
                console.error(`Error searching for "${q}":`, e.response ? e.response.data : e.message);
            }
        }
    } catch (e) {
        console.error('Test failed:', e.response ? e.response.data : e.message);
    }
}

testSearch();
