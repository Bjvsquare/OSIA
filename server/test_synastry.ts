import { synastryService } from './src/services/SynastryService';

async function test() {
    console.log('--- Elemental Data Verification ---');
    const u1 = '1769099927570';
    const u2 = 'a1e9f2b4-0e0e-4b50-988e-56f943d8838d';

    try {
        const result = await synastryService.calculateSynastry(u1, u2);
        console.log('User1 Elements:', JSON.stringify(result.elements.user1, null, 2));
        console.log('User2 Elements:', JSON.stringify(result.elements.user2, null, 2));
        console.log('Resonance Elements:', JSON.stringify(result.elements.resonance, null, 2));
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
