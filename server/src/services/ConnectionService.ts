import { neo4jService } from './Neo4jService';
import { db } from '../db/JsonDb';
import { randomUUID } from 'crypto';

export interface ConnectionRequest {
    requestId: string;
    fromUserId: string;
    fromUsername: string;
    fromName?: string;
    fromAvatar?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    type: string; // 'Work', 'Social', etc.
    timestamp: string;
}

export interface ConnectedUser {
    userId: string;
    username: string;
    name?: string;
    avatarUrl?: string;
    connectionType: string;
    connectedSince: string;
}

export class ConnectionService {

    private safeLog(message: string, isError = false) {
        try {
            if (isError) console.error(message);
            else console.log(message);
        } catch (e: any) {
            // EPIPE: Broken pipe - ignore (terminal disconnected)
            if (e.code !== 'EPIPE') {
                // Try file system fallback if possible, or just swallow
            }
        }
    }

    /**
     * Search for users in the local JSON DB (public profile minimal data)
     */
    async searchUsers(query: string, currentUserId: string): Promise<any[]> {
        if (!query || query.length < 2) return [];

        try {
            this.safeLog(`[ConnectionService] SEARCH: Query="${query}", currentUserId="${currentUserId}"`);
            const users = await db.getCollection<any>('users');
            this.safeLog(`[ConnectionService] Database has ${users.length} users.`);

            const lowerQuery = query.trim().toLowerCase();

            const results = users
                .filter(u => {
                    try {
                        const isNotSelf = u.id !== currentUserId;
                        const usernameMatch = u.username && u.username.toLowerCase().includes(lowerQuery);
                        const nameMatch = u.name && u.name.toLowerCase().includes(lowerQuery);

                        if (!isNotSelf && (usernameMatch || nameMatch)) {
                            // Silently filter self without potentially crashing log
                        }

                        return isNotSelf && (usernameMatch || nameMatch);
                    } catch (e) {
                        // Silent catch inside filter loop to avoid spam/crash
                        return false;
                    }
                })
                .map(u => ({
                    userId: u.id,
                    username: u.username,
                    name: u.name,
                    avatarUrl: u.avatarUrl
                }))
                .slice(0, 10);

            this.safeLog(`[ConnectionService] Found ${results.length} results.`);
            return results;
        } catch (error: any) {
            this.safeLog(`[ConnectionService] searchUsers FAILURE: ${error.message}`, true);
            // Return empty array instead of throwing to prevent 500
            return [];
        }
    }

    /**
     * Send a connection request
     */
    async sendRequest(fromUserId: string, toUserId: string, type: string): Promise<string> {
        console.log(`[ConnectionService] SEND REQUEST: from=${fromUserId}, to=${toUserId}, type=${type}`);

        // --- NEO4J FALLBACK LOGIC ---
        const isNeo4jHealthy = await neo4jService.isHealthy();
        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Using Virtual Graph fallback.`);
            const requestId = `sim_req_${randomUUID()}`;
            const timestamp = new Date().toISOString();

            // Simulating persistence in JSON DB
            const simRequests = await db.getCollection<any>('sim_connection_requests') || [];
            simRequests.push({ requestId, fromUserId, toUserId, type, status: 'PENDING', timestamp });
            await db.saveCollection('sim_connection_requests', simRequests);

            return requestId;
        }

        const session = await neo4jService.getSession();
        const requestId = `req_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        try {
            // 1. Ensure both users exist in Neo4j
            console.log(`[ConnectionService] Ensuring users exist in Neo4j...`);
            await session.run(`
                MERGE (a:User {userId: $fromUserId})
                MERGE (b:User {userId: $toUserId})
            `, { fromUserId, toUserId });

            // 2. Check if connection already exists
            const existing = await session.run(`
                MATCH (a:User {userId: $fromUserId})-[r:CONNECTED_WITH]-(b:User {userId: $toUserId})
                RETURN r
            `, { fromUserId, toUserId });

            if (existing.records.length > 0) {
                console.warn(`[ConnectionService] Connection already exists between ${fromUserId} and ${toUserId}`);
                throw new Error('Already connected');
            }

            // 3. Create Request Edge
            console.log(`[ConnectionService] Creating CONNECTION_REQUEST edge...`);
            await session.run(`
                MATCH (a:User {userId: $fromUserId})
                MATCH (b:User {userId: $toUserId})
                MERGE (a)-[r:CONNECTION_REQUEST {
                    requestId: $requestId, 
                    status: 'PENDING', 
                    type: $type, 
                    timestamp: $timestamp
                }]->(b)
            `, { fromUserId, toUserId, requestId, type, timestamp });

            console.log(`[ConnectionService] Request ${requestId} sent successfully.`);
            return requestId;
        } catch (error: any) {
            console.error('[ConnectionService] sendRequest FAILED:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    /**
     * Get pending incoming requests
     */
    async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
        const isNeo4jHealthy = await neo4jService.isHealthy();
        let pending: any[] = [];

        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Fetching virtual requests.`);
            const simRequests = await db.getCollection<any>('sim_connection_requests') || [];
            pending = simRequests.filter((r: any) => r.toUserId === userId && r.status === 'PENDING');
        } else {
            const session = await neo4jService.getSession();
            try {
                const result = await session.run(`
                    MATCH (a:User)-[r:CONNECTION_REQUEST {status: 'PENDING'}]->(b:User {userId: $userId})
                    RETURN r, a.userId as fromUserId
                `, { userId });

                pending = result.records.map(rec => ({
                    requestId: rec.get('r').properties.requestId,
                    fromUserId: rec.get('fromUserId'),
                    status: rec.get('r').properties.status,
                    type: rec.get('r').properties.type,
                    timestamp: rec.get('r').properties.timestamp
                }));
            } finally {
                await session.close();
            }
        }

        if (pending.length === 0) return [];
        const users = await db.getCollection<any>('users');

        return pending.map(p => {
            const u = users.find(u => u.id === p.fromUserId);
            return {
                ...p,
                fromUsername: u?.username || 'Unknown',
                fromName: u?.name,
                fromAvatar: u?.avatarUrl
            };
        });
    }

    /**
     * Respond to a request (Accept/Reject)
     */
    async respondToRequest(requestId: string, userId: string, action: 'accept' | 'reject', type?: string): Promise<void> {
        const isNeo4jHealthy = await neo4jService.isHealthy();

        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Responding to virtual request.`);
            const simRequests = await db.getCollection<any>('sim_connection_requests') || [];
            const reqIndex = simRequests.findIndex((r: any) => r.requestId === requestId);

            if (reqIndex === -1) throw new Error('Request not found');

            if (action === 'reject') {
                simRequests.splice(reqIndex, 1);
            } else {
                const req = simRequests[reqIndex];
                simRequests.splice(reqIndex, 1);

                const simConnections = await db.getCollection<any>('sim_connections') || [];
                const timestamp = new Date().toISOString();
                const finalType = type || req.type;

                simConnections.push({ userA: req.fromUserId, userB: req.toUserId, type: finalType, since: timestamp });
                await db.saveCollection('sim_connections', simConnections);
            }
            await db.saveCollection('sim_connection_requests', simRequests);
            return;
        }

        const session = await neo4jService.getSession();
        try {
            if (action === 'reject') {
                await session.run(`
                    MATCH (a)-[r:CONNECTION_REQUEST {requestId: $requestId}]->(b:User {userId: $userId})
                    DELETE r
                `, { requestId, userId });
            } else {
                const reqResult = await session.run(`
                    MATCH (a)-[r:CONNECTION_REQUEST {requestId: $requestId}]->(b:User {userId: $userId})
                    RETURN a, r
                `, { requestId, userId });

                if (reqResult.records.length === 0) throw new Error('Request not found');

                const finalType = type || reqResult.records[0].get('r').properties.type;
                const timestamp = new Date().toISOString();

                await session.run(`
                    MATCH (a)-[r:CONNECTION_REQUEST {requestId: $requestId}]->(b:User {userId: $userId})
                    DELETE r
                    MERGE (a)-[:CONNECTED_WITH {type: $finalType, since: $timestamp}]->(b)
                    MERGE (b)-[:CONNECTED_WITH {type: $finalType, since: $timestamp}]->(a)
                `, { requestId, userId, finalType, timestamp });
            }
        } finally {
            await session.close();
        }
    }

    /**
     * Get accepted connections
     */
    async getConnections(userId: string): Promise<ConnectedUser[]> {
        const isNeo4jHealthy = await neo4jService.isHealthy();
        let connections: any[] = [];

        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Fetching virtual connections.`);
            const simConnections = await db.getCollection<any>('sim_connections') || [];
            connections = simConnections
                .filter((c: any) => c.userA === userId || c.userB === userId)
                .map((c: any) => ({
                    userId: c.userA === userId ? c.userB : c.userA,
                    connectionType: c.type,
                    connectedSince: c.since
                }));
        } else {
            const session = await neo4jService.getSession();
            try {
                const result = await session.run(`
                    MATCH (u:User {userId: $userId})-[r:CONNECTED_WITH]->(other:User)
                    RETURN other.userId as userId, r.type as type, r.since as since
                `, { userId });

                connections = result.records.map(rec => ({
                    userId: rec.get('userId'),
                    connectionType: rec.get('type'),
                    connectedSince: rec.get('since')
                }));
            } finally {
                await session.close();
            }
        }

        if (connections.length === 0) return [];
        const users = await db.getCollection<any>('users');

        return connections.map(c => {
            const u = users.find(u => u.id === c.userId);
            return {
                ...c,
                username: u?.username || 'Unknown',
                name: u?.name,
                avatarUrl: u?.avatarUrl
            } as ConnectedUser;
        });
    }
}

export const connectionService = new ConnectionService();
