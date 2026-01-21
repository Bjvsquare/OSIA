import { connectionService } from './src/services/ConnectionService';

async function testSearch() {
    console.log('Testing ConnectionService search...');

    // Use an ID that shouldn't match "alice" or "bob"
    const currentUserId = 'test_admin_id';

    try {
        // Query "ali" -> expect Alice
        const resultsAlice = await connectionService.searchUsers('ali', currentUserId);
        console.log(`Query 'ali': Found ${resultsAlice.length} users`);
        resultsAlice.forEach(u => console.log(` - ${u.username} (${u.name})`));

        // Query "bar" -> expect Barend
        const resultsBarend = await connectionService.searchUsers('bar', currentUserId);
        console.log(`Query 'bar': Found ${resultsBarend.length} users`);
        resultsBarend.forEach(u => console.log(` - ${u.username} (${u.name})`));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testSearch();
