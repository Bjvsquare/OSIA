import { neo4jService } from '../services/Neo4jService';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function inspectSara() {
    const userId = "993afb5f-da82-4e3d-975b-d12945286133";
    const session = driver.session();

    console.log(`--- Inspecting Snapshots for Sara: ${userId} ---`);

    try {
        const result = await session.run(`
            MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..]->(s:BlueprintSnapshot)
            OPTIONAL MATCH (s)-[r:HAS_TRAIT_CONFIG]->(t:Trait)
            RETURN s.id as id, s.timestamp as timestamp, s.source as source, count(r) as traitCount
            ORDER BY s.timestamp DESC
        `, { userId });

        console.log(`\n📸 Snapshots (${result.records.length}):`);
        result.records.forEach(r => {
            console.log(`   - [${r.get('id')}] Source: ${r.get('source')} | Traits: ${r.get('traitCount')} | Time: ${r.get('timestamp')}`);
        });

    } catch (error) {
        console.error("❌ Neo4j Error:", error.message);
    } finally {
        await session.close();
        await driver.close();
        process.exit(0);
    }
}

inspectSara();
