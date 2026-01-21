import { neo4jService } from '../services/Neo4jService';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

async function repairNeo4j() {
    const session = driver.session();

    console.log(`--- Repairing Neo4j: Removing Empty Snapshots ---`);

    try {
        // 1. Find all snapshots with 0 traits
        const emptyResult = await session.run(`
            MATCH (s:BlueprintSnapshot)
            WHERE NOT (s)-[:HAS_TRAIT_CONFIG]->()
            RETURN s.id as id, s.timestamp as ts, s.source as source
        `);

        console.log(`\nFound ${emptyResult.records.length} empty snapshots.`);

        for (const record of emptyResult.records) {
            const snapId = record.get('id');
            console.log(`   - Repairing around ${snapId} (${record.get('source')})...`);

            // Re-chain relationships: User -> Next (if Latest) or Prev -> Next (if in chain)
            // But simpler: just delete empty ones and let the chain collapse/auto-heal if we match carefully.

            // If it's the LATEST_SNAPSHOT, we need to move the pointer to the PREVIOUS_SNAPSHOT of this node
            await session.run(`
                MATCH (u:User)-[r:LATEST_SNAPSHOT]->(s:BlueprintSnapshot {id: $snapId})
                OPTIONAL MATCH (s)-[:PREVIOUS_SNAPSHOT]->(prev:BlueprintSnapshot)
                WITH u, r, prev
                DELETE r
                FOREACH (p IN CASE WHEN prev IS NOT NULL THEN [prev] ELSE [] END |
                    CREATE (u)-[:LATEST_SNAPSHOT]->(p)
                )
            `, { snapId });

            // If it's in the middle, reconnect the chain
            await session.run(`
                MATCH (parent:BlueprintSnapshot)-[r:PREVIOUS_SNAPSHOT]->(s:BlueprintSnapshot {id: $snapId})
                OPTIONAL MATCH (s)-[:PREVIOUS_SNAPSHOT]->(child:BlueprintSnapshot)
                WITH r, child, parent
                DELETE r
                FOREACH (c IN CASE WHEN child IS NOT NULL THEN [child] ELSE [] END |
                    CREATE (parent)-[:PREVIOUS_SNAPSHOT]->(c)
                )
            `, { snapId });

            // Finally delete the node
            await session.run(`MATCH (s:BlueprintSnapshot {id: $snapId}) DETACH DELETE s`, { snapId });
            console.log(`     ✅ Snapshot ${snapId} purged and chain healed.`);
        }

    } catch (error) {
        console.error("❌ Neo4j Repair Error:", error.message);
    } finally {
        await session.close();
        await driver.close();
        process.exit(0);
    }
}

repairNeo4j();
