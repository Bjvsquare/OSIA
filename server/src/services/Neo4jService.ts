import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

export class Neo4jService {
    private driver: Driver;
    private static instance: Neo4jService;

    private constructor() {
        const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';

        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        console.log(`[Neo4jService] Initialized driver for ${uri}`);
    }

    private healthy: boolean = true;
    private lastCheck: number = 0;
    private readonly CHECK_INTERVAL = 30000; // 30 seconds

    public static getInstance(): Neo4jService {
        if (!Neo4jService.instance) {
            Neo4jService.instance = new Neo4jService();
        }
        return Neo4jService.instance;
    }

    async isHealthy(): Promise<boolean> {
        const now = Date.now();
        if (now - this.lastCheck < this.CHECK_INTERVAL) {
            return this.healthy;
        }

        this.healthy = await this.verifyConnectivity();
        this.lastCheck = now;
        return this.healthy;
    }

    async getSession(): Promise<Session> {
        return this.driver.session();
    }

    async verifyConnectivity(): Promise<boolean> {
        try {
            // Implement a timeout for connectivity verification to prevent long hangs on DNS failure
            const CONNECTIVITY_TIMEOUT = 5000; // 5 seconds

            const connectivityPromise = this.driver.verifyConnectivity();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Neo4j connectivity check timed out')), CONNECTIVITY_TIMEOUT)
            );

            await Promise.race([connectivityPromise, timeoutPromise]);

            console.log('[Neo4jService] Connectivity verified.');
            this.healthy = true;
            return true;
        } catch (error) {
            console.error('[Neo4jService] Connectivity failed:', (error as any).message || error);
            this.healthy = false;
            return false;
        }
    }

    async close() {
        await this.driver.close();
        console.log('[Neo4jService] Driver closed.');
    }

    // Generic execute method
    async runQuery<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
        const session = await this.getSession();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => record.toObject() as T);
        } finally {
            await session.close();
        }
    }
}

export const neo4jService = Neo4jService.getInstance();
