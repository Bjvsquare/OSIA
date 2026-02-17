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

export interface ConnectionTypeChangeRequest {
    requestId: string;
    fromUserId: string;
    fromUsername?: string;
    fromName?: string;
    fromAvatar?: string;
    toUserId: string;
    toUsername?: string;
    toName?: string;
    currentType: string;
    proposedType: string;
    proposedSubType?: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
    respondedAt?: string;
}

export class ConnectionService {

    private safeLog(message: string, isError = false) {
        try {
            if (isError) console.error(message);
            else console.log(message);
        } catch (e: any) {
            if (e.code !== 'EPIPE') { }
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
            return [];
        }
    }

    /**
     * Send a connection request
     */
    async sendRequest(fromUserId: string, toUserId: string, type: string): Promise<string> {
        console.log(`[ConnectionService] SEND REQUEST: from=${fromUserId}, to=${toUserId}, type=${type}`);

        const isNeo4jHealthy = await neo4jService.isHealthy();
        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Using Virtual Graph fallback.`);

            // Duplicate prevention: check existing connections
            const simConnections = await db.getCollection<any>('sim_connections') || [];
            const alreadyConnected = simConnections.some((c: any) =>
                (c.userA === fromUserId && c.userB === toUserId) ||
                (c.userA === toUserId && c.userB === fromUserId)
            );
            if (alreadyConnected) {
                console.warn(`[ConnectionService] Already connected (virtual): ${fromUserId} <-> ${toUserId}`);
                throw new Error('Already connected');
            }

            // Duplicate prevention: check pending requests in both directions
            const simRequests = await db.getCollection<any>('sim_connection_requests') || [];
            const pendingExists = simRequests.some((r: any) =>
                r.status === 'PENDING' && (
                    (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
                    (r.fromUserId === toUserId && r.toUserId === fromUserId)
                )
            );
            if (pendingExists) {
                console.warn(`[ConnectionService] Pending request already exists (virtual): ${fromUserId} <-> ${toUserId}`);
                throw new Error('Connection request already pending');
            }

            const requestId = `sim_req_${randomUUID()}`;
            const timestamp = new Date().toISOString();
            simRequests.push({ requestId, fromUserId, toUserId, type, status: 'PENDING', timestamp });
            await db.saveCollection('sim_connection_requests', simRequests);

            return requestId;
        }

        const session = await neo4jService.getSession();
        const requestId = `req_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        try {
            console.log(`[ConnectionService] Ensuring users exist in Neo4j...`);
            await session.run(`
                MERGE (a:User {userId: $fromUserId})
                MERGE (b:User {userId: $toUserId})
            `, { fromUserId, toUserId });

            const existing = await session.run(`
                MATCH (a:User {userId: $fromUserId})-[r:CONNECTED_WITH]-(b:User {userId: $toUserId})
                RETURN r
            `, { fromUserId, toUserId });

            if (existing.records.length > 0) {
                console.warn(`[ConnectionService] Connection already exists between ${fromUserId} and ${toUserId}`);
                throw new Error('Already connected');
            }

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

    /**
     * Remove a connection between two users
     */
    async removeConnection(userId: string, targetUserId: string): Promise<void> {
        console.log(`[ConnectionService] REMOVE CONNECTION: ${userId} <-> ${targetUserId}`);

        const isNeo4jHealthy = await neo4jService.isHealthy();

        if (!isNeo4jHealthy) {
            console.log(`[ConnectionService] Neo4j is DOWN. Removing virtual connection.`);
            const simConnections = await db.getCollection<any>('sim_connections') || [];
            const filtered = simConnections.filter((c: any) =>
                !((c.userA === userId && c.userB === targetUserId) ||
                    (c.userA === targetUserId && c.userB === userId))
            );

            if (filtered.length === simConnections.length) {
                throw new Error('Connection not found');
            }

            await db.saveCollection('sim_connections', filtered);
            console.log(`[ConnectionService] Virtual connection removed: ${userId} <-> ${targetUserId}`);
            return;
        }

        const session = await neo4jService.getSession();
        try {
            const result = await session.run(`
                MATCH (a:User {userId: $userId})-[r:CONNECTED_WITH]-(b:User {userId: $targetUserId})
                DELETE r
                RETURN count(r) as deleted
            `, { userId, targetUserId });

            const deleted = result.records[0]?.get('deleted')?.toNumber?.() || 0;
            if (deleted === 0) {
                throw new Error('Connection not found');
            }
            console.log(`[ConnectionService] Neo4j connection removed: ${userId} <-> ${targetUserId}`);
        } finally {
            await session.close();
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       Connection Type Change Requests — Mutual Approval
       Both users must agree before the connection type is updated.
       ═══════════════════════════════════════════════════════════════ */

    /**
     * Propose a change in connection type to the other user
     */
    async proposeTypeChange(
        fromUserId: string,
        toUserId: string,
        proposedType: string,
        proposedSubType?: string
    ): Promise<string> {
        console.log(`[ConnectionService] TYPE CHANGE: ${fromUserId} → ${toUserId}, proposed="${proposedType}"`);

        // Verify they are connected
        const connections = await this.getConnections(fromUserId);
        const existing = connections.find(c => c.userId === toUserId);
        if (!existing) throw new Error('Not connected to this user');

        // Check for duplicate pending request
        const allRequests = await db.getCollection<ConnectionTypeChangeRequest>('connection_type_changes') || [];
        const duplicate = allRequests.find(r =>
            r.status === 'pending' &&
            ((r.fromUserId === fromUserId && r.toUserId === toUserId) ||
                (r.fromUserId === toUserId && r.toUserId === fromUserId))
        );
        if (duplicate) throw new Error('A type change request is already pending for this connection');

        const requestId = `tc_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        const users = await db.getCollection<any>('users');
        const fromUser = users.find(u => u.id === fromUserId);
        const toUser = users.find(u => u.id === toUserId);

        const request: ConnectionTypeChangeRequest = {
            requestId,
            fromUserId,
            fromUsername: fromUser?.username,
            fromName: fromUser?.name,
            fromAvatar: fromUser?.avatarUrl,
            toUserId,
            toUsername: toUser?.username,
            toName: toUser?.name,
            currentType: existing.connectionType,
            proposedType,
            proposedSubType,
            status: 'pending',
            timestamp,
        };

        allRequests.push(request);
        await db.saveCollection('connection_type_changes', allRequests);
        console.log(`[ConnectionService] Type change request ${requestId} created`);

        return requestId;
    }

    /**
     * Get pending type change requests for a user (incoming proposals they need to approve)
     */
    async getPendingTypeChanges(userId: string): Promise<ConnectionTypeChangeRequest[]> {
        const allRequests = await db.getCollection<ConnectionTypeChangeRequest>('connection_type_changes') || [];
        return allRequests.filter(r => r.toUserId === userId && r.status === 'pending');
    }

    /**
     * Get all type change requests involving a user (sent + received, all statuses)
     */
    async getAllTypeChangeRequests(userId: string): Promise<ConnectionTypeChangeRequest[]> {
        const allRequests = await db.getCollection<ConnectionTypeChangeRequest>('connection_type_changes') || [];
        return allRequests.filter(r => r.fromUserId === userId || r.toUserId === userId);
    }

    /**
     * Respond to a type change proposal — approve or reject
     * On approve: updates the connection type in both sim_connections and Neo4j
     */
    async respondToTypeChange(
        requestId: string,
        userId: string,
        action: 'approve' | 'reject'
    ): Promise<ConnectionTypeChangeRequest> {
        const allRequests = await db.getCollection<ConnectionTypeChangeRequest>('connection_type_changes') || [];
        const idx = allRequests.findIndex(r => r.requestId === requestId);

        if (idx === -1) throw new Error('Type change request not found');

        const request = allRequests[idx];

        // Only the target user can respond
        if (request.toUserId !== userId) {
            throw new Error('Only the receiving user can respond to this request');
        }

        if (request.status !== 'pending') {
            throw new Error('This request has already been processed');
        }

        const now = new Date().toISOString();
        request.respondedAt = now;

        if (action === 'reject') {
            request.status = 'rejected';
            allRequests[idx] = request;
            await db.saveCollection('connection_type_changes', allRequests);
            console.log(`[ConnectionService] Type change ${requestId} REJECTED by ${userId}`);
            return request;
        }

        // Approve — update the actual connection type
        request.status = 'approved';
        allRequests[idx] = request;
        await db.saveCollection('connection_type_changes', allRequests);

        // Update sim_connections (JsonDb fallback)
        const simConnections = await db.getCollection<any>('sim_connections') || [];
        const connIdx = simConnections.findIndex((c: any) =>
            (c.userA === request.fromUserId && c.userB === request.toUserId) ||
            (c.userA === request.toUserId && c.userB === request.fromUserId)
        );
        if (connIdx !== -1) {
            simConnections[connIdx].type = request.proposedType;
            if (request.proposedSubType) {
                simConnections[connIdx].subType = request.proposedSubType;
            }
            await db.saveCollection('sim_connections', simConnections);
        }

        // Update Neo4j if available
        const isNeo4jHealthy = await neo4jService.isHealthy();
        if (isNeo4jHealthy) {
            const session = await neo4jService.getSession();
            try {
                await session.run(`
                    MATCH (a:User {userId: $userA})-[r:CONNECTED_WITH]->(b:User {userId: $userB})
                    SET r.type = $newType
                `, {
                    userA: request.fromUserId,
                    userB: request.toUserId,
                    newType: request.proposedType,
                });
                await session.run(`
                    MATCH (a:User {userId: $userB})-[r:CONNECTED_WITH]->(b:User {userId: $userA})
                    SET r.type = $newType
                `, {
                    userA: request.fromUserId,
                    userB: request.toUserId,
                    newType: request.proposedType,
                });
            } finally {
                await session.close();
            }
        }

        console.log(`[ConnectionService] Type change ${requestId} APPROVED: ${request.currentType} → ${request.proposedType}`);
        return request;
    }
}

export const connectionService = new ConnectionService();

