const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'neo4j+s://905f8271.databases.neo4j.io';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'AeuN3YBt4JCAjjUnecamGHaN7m2K0GRV6riiQo30xgQ';

async function debugNeo4j() {
    console.log(`Connecting to Neo4j at ${uri}...`);
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        console.log('\n1. Checking User nodes...');
        const userRes = await session.run('MATCH (u:User) RETURN u LIMIT 5');
        console.log(`Found ${userRes.records.length} users.`);
        userRes.records.forEach(r => {
            console.log('User Properties:', JSON.stringify(r.get('u').properties, null, 2));
        });

        const targetUserId = '1769099927570';
        console.log(`\n2. Checking BlueprintSnapshots for user ${targetUserId}...`);
        const snapshotRes = await session.run(`
            MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..5]->(s:BlueprintSnapshot)
            RETURN s LIMIT 5
        `, { userId: targetUserId });

        console.log(`Found ${snapshotRes.records.length} snapshots for user.`);
        snapshotRes.records.forEach(r => {
            console.log('Snapshot Properties:', JSON.stringify(r.get('s').properties, null, 2));
        });

        if (snapshotRes.records.length > 0) {
            const snapshotId = snapshotRes.records[0].get('s').properties.id;
            console.log(`\n3. Checking Snapshot Traits for snapshot ${snapshotId}...`);
            const traitRes = await session.run(`
                MATCH (s:BlueprintSnapshot {id: $snapshotId})-[r:HAS_TRAIT_CONFIG]->(t:Trait)
                RETURN r, t LIMIT 5
            `, { snapshotId });

            console.log(`Found ${traitRes.records.length} trait relationships.`);
            traitRes.records.forEach(r => {
                console.log('Rel Properties:', JSON.stringify(r.get('r').properties, null, 2));
                console.log('Trait Properties:', JSON.stringify(r.get('t').properties, null, 2));
            });
        }

        console.log(`\n4. Checking Migrated HAS_TRAIT relationships for user ${targetUserId}...`);
        const migratedRes = await session.run(`
            MATCH (u:User {userId: $userId})-[r:HAS_TRAIT]->(t:Trait)
            RETURN r, t LIMIT 5
        `, { userId: targetUserId });

        console.log(`Found ${migratedRes.records.length} migrated trait relationships.`);
        migratedRes.records.forEach(r => {
            console.log('Rel Properties:', JSON.stringify(r.get('r').properties, null, 2));
            console.log('Trait Properties:', JSON.stringify(r.get('t').properties, null, 2));
        });

    } catch (error) {
        console.error('Neo4j Debug Error:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

debugNeo4j();
