const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

console.log(`Connecting to ${uri} as ${user}...`);

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function run() {
    try {
        await driver.verifyConnectivity();
        console.log('Connectivity verified!');

        const session = driver.session();
        const res = await session.run('MATCH (n) RETURN count(n) as count');
        console.log('Node count:', res.records[0].get('count').toString());
        await session.close();
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await driver.close();
    }
}

run();
