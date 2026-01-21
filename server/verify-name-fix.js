const axios = require('axios');

async function verifyNameFix() {
    const BASE_URL = 'http://localhost:3001';
    const ALICE_EMAIL = `alice_${Date.now()}@example.com`;
    const ALICE_NAME = 'Alice Wonderland';
    const TEST_PASS = 'password123';

    try {
        console.log(`1. Signing up ${ALICE_NAME} (${ALICE_EMAIL})...`);
        const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
            username: ALICE_EMAIL,
            password: TEST_PASS,
            name: ALICE_NAME
        });
        const aliceToken = signupRes.data.token;
        console.log('   Signup successful.');

        console.log('2. Signing up a second user to perform the search...');
        const bobEmail = `bob_${Date.now()}@example.com`;
        const bobSignup = await axios.post(`${BASE_URL}/api/auth/signup`, {
            username: bobEmail,
            password: TEST_PASS,
            name: 'Bob Searcher'
        });
        const bobToken = bobSignup.data.token;
        console.log('   Bob signed up.');

        console.log('3. Searching for "Alice" (Name search)...');
        const search1 = await axios.get(`${BASE_URL}/api/connect/search?q=Alice`, {
            headers: { 'Authorization': `Bearer ${bobToken}` }
        });
        console.log(`   Found ${search1.data.length} results.`);
        const foundAlice = search1.data.find(u => u.name === ALICE_NAME);
        if (foundAlice) {
            console.log('   SUCCESS: Found Alice by first name.');
        } else {
            console.log('   FAILURE: Alice not found by name.');
        }

        console.log('4. Searching for " wonderland " (Trimmed name search)...');
        const search2 = await axios.get(`${BASE_URL}/api/connect/search?q=%20wonderland%20`, {
            headers: { 'Authorization': `Bearer ${bobToken}` }
        });
        console.log(`   Found ${search2.data.length} results.`);
        if (search2.data.length > 0) {
            console.log('   SUCCESS: Search is robust to spaces.');
        } else {
            console.log('   FAILURE: Search failed with spaces.');
        }

        console.log('5. Searching for Alice\'s email...');
        const search3 = await axios.get(`${BASE_URL}/api/connect/search?q=${ALICE_EMAIL}`, {
            headers: { 'Authorization': `Bearer ${bobToken}` }
        });
        console.log(`   Found ${search3.data.length} results.`);
        if (search3.data.length > 0) {
            console.log('   SUCCESS: Found Alice by email.');
        } else {
            console.log('   FAILURE: Alice not found by email.');
        }

    } catch (err) {
        console.error('Verification failed:', err.response ? err.response.data : err.message);
    }
}

verifyNameFix();
