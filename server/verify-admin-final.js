
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ousia-secret-key-2024-phoenix-trust';
const BASE_URL = 'http://localhost:3001';

async function verifyAdmin() {
    console.log('--- Admin Access Verification ---');

    // 1. Generate an Admin Token
    const adminToken = jwt.sign({
        id: '1769099927570',
        username: 'barendjvv@gmail.com',
        isAdmin: true
    }, JWT_SECRET);

    const config = {
        headers: { Authorization: `Bearer ${adminToken}` }
    };

    try {
        // Test 1: Analytics
        console.log('Testing GET /api/admin/analytics...');
        const analytics = await axios.get(`${BASE_URL}/api/admin/analytics`, config);
        console.log('✅ Analytics accessible. Total Users:', analytics.data.totalUsers);

        // Test 2: Users List
        console.log('Testing GET /api/admin/users...');
        const users = await axios.get(`${BASE_URL}/api/admin/users`, config);
        console.log('✅ Users list accessible. Count:', users.data.length);

        // Test 3: Blueprint History
        console.log('Testing GET /api/admin/blueprint/:userId/history...');
        const userId = '1769099927570';
        const history = await axios.get(`${BASE_URL}/api/admin/blueprint/${userId}/history`, config);
        console.log('✅ Blueprint history accessible. Snapshots:', history.data.length);

        console.log('\n--- VERIFICATION SUCCESSFUL ---');
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

verifyAdmin();
