import { neo4jService } from '../services/Neo4jService';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function auditNeo4j() {
    const session = driver.session();

    console.log(`--- Auditing Neo4j Database ---`);

    try {
        // 1. List all Users
        const usersResult = await session.run('MATCH (u:User) RETURN u.userId as id');
        console.log(`\n👥 Users Found (${usersResult.records.length}):`);
        for (const record of usersResult.records) {
            const uid = record.get('id');
            console.log(`   - User ID: ${uid}`);

            // 2. Count Snapshots per User
            const snapResult = await session.run(
                'MATCH (u:User {userId: $uid})-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..]->(s:BlueprintSnapshot) RETURN count(s) as count',
                { uid }
            );
            console.log(`     └ Snapshots: ${snapResult.records[0].get('count')}`);

            // 3. Check Latest Snapshot
            const latestResult = await session.run(
                'MATCH (u:User {userId: $uid})-[:LATEST_SNAPSHOT]->(s:BlueprintSnapshot) RETURN s.id as id, s.timestamp as ts',
                { uid }
            );
            if (latestResult.records.length > 0) {
                console.log(`     └ Latest: ${latestResult.records[0].get('id')} (${latestResult.records[0].get('ts')})`);
            } else {
                console.log(`     └ Latest: ❌ NONE`);
            }
        }

        // 4. Orphan Snapshots
        const orphanResult = await session.run(
            'MATCH (s:BlueprintSnapshot) WHERE NOT (:User)-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*]->(s) RETURN count(s) as count'
        );
        console.log(`\n🏚️ Orphan Snapshots: ${orphanResult.records[0].get('count')}`);

    } catch (error) {
        console.error("❌ Neo4j Error:", error.message);
    } finally {
        await session.close();
        await driver.close();
        process.exit(0);
    }
}

auditNeo4j();
