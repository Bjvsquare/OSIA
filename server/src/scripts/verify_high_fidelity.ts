import { originSeedService } from '../services/OriginSeedService';
import { neo4jService } from '../services/Neo4jService';
import { randomUUID } from 'crypto';

async function verify() {
    console.log(" --- HIGH-FIDELITY SIGNAL INTEGRITY (V1.2) VERIFICATION --- ");

    const testId = `test_user_${randomUUID().slice(0, 8)}`;
    const birthData = {
        date: "1990-01-01",
        time: "12:00:00",
        location: "London, UK",
        timezoneOffset: 0 // UTC
    };

    console.log(`[1] Running first generation for ${testId}...`);
    await originSeedService.generateFoundationalBlueprint(testId, birthData);

    const session = await neo4jService.getSession();
    try {
        console.log("\n[2] Inspecting Graph Structure...");

        const result = await session.run(`
            MATCH (u:User {userId: $testId})-[:HAS_SIGNAL_SNAPSHOT]->(sig:SignalSnapshot)
            MATCH (u)-[:LATEST_SNAPSHOT]->(sn:BlueprintSnapshot)-[:DERIVED_FROM]->(sig)
            OPTIONAL MATCH (sig)-[:HAS_BODY_STATE]->(b:BodyState)
            OPTIONAL MATCH (sn)-[r:HAS_TRAIT_CONFIG]->(t:Trait)
            RETURN sig, sn, count(DISTINCT b) as bodies, count(DISTINCT r) as traits
        `, { testId });

        if (result.records.length > 0) {
            const row = result.records[0];
            const sig = row.get('sig').properties;
            const sn = row.get('sn').properties;
            console.log(`✅ User -> SignalSnapshot linkage confirmed.`);
            console.log(`✅ Snapshot -> Signal linkage confirmed.`);
            console.log(`✅ Bodies found: ${row.get('bodies')}`);
            console.log(`✅ Traits found: ${row.get('traits')}`);
        } else {
            console.log("❌ Graph linkage failed.");
        }

        console.log("\n[3] Determinism Sample (Layer 1):");
        const l1Result = await session.run(`
            MATCH (u:User {userId: $testId})-[:LATEST_SNAPSHOT]->(sn:BlueprintSnapshot)-[r:HAS_TRAIT_CONFIG {layerId: 1}]->(t:Trait)
            RETURN r.description as text
        `, { testId });

        if (l1Result.records.length > 0) {
            const text = l1Result.records[0].get('text');
            console.log("Text Sample:", text.substring(0, 50) + "...");
        }

        console.log("\n[4] UTC Offset Check (Planetary Shift)...");
        const testId2 = `test_user_offset_${randomUUID().slice(0, 8)}`;
        await originSeedService.generateFoundationalBlueprint(testId2, { ...birthData, timezoneOffset: 600 }); // +10 hours

        const moonResult = await session.run(`
            MATCH (u:User)-[:HAS_SIGNAL_SNAPSHOT]->(sig)-[:HAS_BODY_STATE]->(b:BodyState {name: 'Moon'})
            WHERE u.userId IN [$testId, $testId2]
            RETURN u.userId as id, b.longitude as lon, properties(b) as props
        `, { testId, testId2 });

        const moons: any = {};
        moonResult.records.forEach(r => {
            moons[r.get('id')] = r.get('lon');
            console.log(`User: ${r.get('id')}, Moon Lon: ${r.get('lon')}`);
        });

        if (moons[testId] !== undefined && moons[testId2] !== undefined) {
            if (Math.abs(moons[testId] - moons[testId2]) > 0.01) {
                console.log(`✅ Moon correctly shifted from ${moons[testId]} to ${moons[testId2]}`);
            } else {
                console.log("❌ Moon did not move significantly.");
            }
        } else {
            console.log("❌ Could not retrieve Moon positions for comparison.");
        }

    } finally {
        await session.close();
    }
}

verify().catch(console.error).finally(() => process.exit());
