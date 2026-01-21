import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

console.log(`Connecting to ${uri} as ${user}...`);

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function test() {
    try {
        await driver.verifyConnectivity();
        console.log('SUCCESS: Connected to Neo4j');

        const session = driver.session();
        const result = await session.run('RETURN 1 as val');
        console.log('Query result:', result.records[0].get('val').toNumber());
        await session.close();
    } catch (err) {
        console.error('FAILURE: Neo4j connection failed');
        console.error(err);
    } finally {
        await driver.close();
    }
}

test();
