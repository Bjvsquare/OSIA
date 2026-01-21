import { connectionService } from './src/services/ConnectionService';

async function testCrash() {
    console.log('Testing ConnectionService search for crash...');
    try {
        await connectionService.searchUsers('al', 'test_user_id');
        console.log('Search completed without crash.');
    } catch (error: any) {
        console.error('CRASH CAUGHT:', error);
        console.error(error.stack);
    }
}

testCrash();
