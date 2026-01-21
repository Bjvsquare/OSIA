import { neo4jService } from '../services/Neo4jService';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function checkNeo4j() {
    const userId = "cfd9b903-24a7-45a0-bf99-ac1f6dc5c9a6";
    const session = driver.session();

    console.log(`--- Inspecting Neo4j for User ID: ${userId} ---`);

    try {
        // 1. Check User node
        const userResult = await session.run(
            'MATCH (u:User {userId: $userId}) RETURN u',
            { userId }
        );
        console.log(`   User Node Found: ${userResult.records.length > 0 ? 'YES' : 'NO'}`);

        // 2. Check Snapshots
        const snapResult = await session.run(
            'MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT]->(s:BlueprintSnapshot) RETURN s.id as sid, s.timestamp as ts',
            { userId }
        );
        console.log(`   Snapshots Found: ${snapResult.records.length}`);
        snapResult.records.forEach(r => {
            console.log(`     - Snapshot ID: ${r.get('sid')} (${r.get('ts')})`);
        });

        // 3. Check Traits
        const traitResult = await session.run(
            'MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT]->(s:BlueprintSnapshot)-[r:HAS_TRAIT_CONFIG]->(t:Trait) ' +
            'RETURN count(r) as count',
            { userId }
        );
        console.log(`   Trait Relationships Found: ${traitResult.records[0].get('count')}`);

        if (snapResult.records.length > 0) {
            console.log("\n✨ Snapshot exists in Neo4j.");
        } else {
            console.log("\n❌ No Blueprint snapshots found in Neo4j for this user.");
        }

    } catch (error) {
        console.error("❌ Neo4j Error:", error.message);
    } finally {
        await session.close();
        await driver.close();
        process.exit(0);
    }
}

checkNeo4j();
