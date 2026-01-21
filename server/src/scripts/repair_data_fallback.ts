import { db } from '../services/../db/JsonDb';
import { originSeedService } from '../services/OriginSeedService';
import { userService } from '../services/UserService';
import * as dotenv from 'dotenv';
dotenv.config();

async function repair() {
    console.log('--- OSIA Data Repair: JSON Fallback Seeding ---');
    
    try {
        const users = await db.getCollection<any>('users');
        const onboardedUsers = users.filter((u: any) => u.onboardingCompleted);
        
        console.log(`Found ${onboardedUsers.length} onboarded users.`);
        
        for (const user of onboardedUsers) {
            const profile = await originSeedService.getProfile(user.id);
            if (!profile || !profile.traits || profile.traits.length === 0) {
                console.log(`User ${user.username} (${user.id}) is missing blueprint. Generating baseline...`);
                
                // Since we don't have birth data, we use a deterministic baseline based on their ID
                // to at least give them a functional UI experience.
                const baselineBirthData = {
                    date: '1990-01-01',
                    time: '12:00:00',
                    location: 'London, UK',
                    latitude: 51.5074,
                    longitude: -0.1278,
                    timezone: 'Europe/London'
                };
                
                await originSeedService.generateFoundationalBlueprint(user.id, baselineBirthData);
                console.log(`✅ Baseline generated for ${user.username}`);
            } else {
                console.log(`User ${user.username} already has blueprint data.`);
            }
        }
        
        console.log('--- Repair Complete ---');
    } catch (error: any) {
        console.error('Repair failed:', error.message);
    } finally {
        process.exit(0);
    }
}

repair();
