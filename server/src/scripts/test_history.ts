import { neo4jService } from '../services/Neo4jService';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function testHistory() {
    const userId = "cfd9b903-24a7-45a0-bf99-ac1f6dc5c9a6";
    const session = driver.session();

    console.log(`--- Testing History Retrieval for User ID: ${userId} ---`);

    try {
        const result = await session.run(`
            MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..10]->(s:BlueprintSnapshot)
            RETURN s.id as id, s.timestamp as timestamp, s.source as source
            ORDER BY s.timestamp DESC
        `, { userId });

        console.log(`\n📜 History Results (${result.records.length}):`);
        result.records.forEach(r => {
            console.log(`   - Snapshot ID: ${r.get('id')} (${r.get('timestamp')}) via ${r.get('source')}`);
        });

        if (result.records.length === 0) {
            console.log("\n⚠️ No history found. Trying separate match...");
            const userCheck = await session.run('MATCH (u:User {userId: $userId}) RETURN u', { userId });
            console.log(`   User node exists? ${userCheck.records.length > 0 ? 'YES' : 'NO'}`);

            const relCheck = await session.run('MATCH (u:User {userId: $userId})-[r]->(s) RETURN type(r), labels(s)', { userId });
            console.log(`   Relationships from User:`);
            relCheck.records.forEach(rc => {
                console.log(`     - [:${rc.get(0)}] -> (:${rc.get(1)})`);
            });
        }

    } catch (error) {
        console.error("❌ Neo4j Error:", error.message);
    } finally {
        await session.close();
        await driver.close();
        process.exit(0);
    }
}

testHistory();
