// BlueprintService - Updated 2026-02-04T18:30:00
import { neo4jService } from './Neo4jService';
import { Blueprint } from './AstrologyService';
import { randomUUID } from 'crypto';
import { db } from '../db/JsonDb';

export interface TraitProbability {
    traitId: string;
    layerId: number;
    score: number;
    confidence: number;
    description?: string;
}

export interface BlueprintSnapshot {
    id: string;
    userId: string;
    timestamp: string;
    source: string;
    traits: TraitProbability[];
}

export class BlueprintService {
    private static readonly BODY_CODES: Record<string, string> = {
        'Sun': 'B01', 'Moon': 'B02', 'Mercury': 'B03', 'Venus': 'B04', 'Mars': 'B05',
        'Jupiter': 'B06', 'Saturn': 'B07', 'Uranus': 'B08', 'Neptune': 'B09', 'Pluto': 'B10'
    };

    /**
     * Create a new Signal Snapshot (Raw Numeric Data)
     */
    async createSignalSnapshot(userId: string, blueprint: Blueprint, metadata: any): Promise<string> {
        const signalId = `sig_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        // 1. JSON Fallback First (Always save locally for safety)
        try {
            const localSignals = await db.getCollection<any>('signal_snapshots');
            localSignals.push({
                id: signalId,
                userId,
                timestamp,
                blueprint,
                metadata
            });
            await db.saveCollection('signal_snapshots', localSignals);
        } catch (e) {
            console.error('[BlueprintService] Local JSON save failed:', e);
        }

        if (!(await neo4jService.isHealthy())) {
            console.warn('[BlueprintService] Neo4j unhealthy, using JSON fallback for creation.');
            return signalId;
        }

        const session = await neo4jService.getSession();

        try {
            await session.executeWrite(async (tx: any) => {
                // 1. Create Signal Root
                await tx.run(`
                    CREATE (s:SignalSnapshot {
                        id: $signalId,
                        timestamp: $timestamp,
                        calcVersion: $calcVersion,
                        quality: $quality,
                        latitude: $latitude,
                        longitude: $longitude,
                        calcModel: $calcModel
                    })
                `, {
                    signalId,
                    timestamp,
                    calcVersion: metadata.calcVersion || 'v1.2',
                    quality: metadata.quality || 'high',
                    latitude: metadata.latitude,
                    longitude: metadata.longitude,
                    calcModel: (blueprint as any).calcModel || 'baseline_v1'
                });

                // 2. Link to User
                await tx.run(`
                    MERGE (u:User {userId: $userId})
                    WITH u
                    MATCH (s:SignalSnapshot {id: $signalId})
                    CREATE (u)-[:HAS_SIGNAL_SNAPSHOT]->(s)
                `, { userId, signalId });

                // 3. Batch insert Body states (Neutralized)
                const bodies = blueprint.planets.map(p => ({
                    code: BlueprintService.BODY_CODES[p.name] || p.name,
                    longitude: p.longitude,
                    speed: p.speed,
                    retrograde: p.retrograde,
                    sectorIndex: p.house,
                    signalId
                }));

                await tx.run(`
                    UNWIND $bodies AS b
                    MATCH (s:SignalSnapshot {id: $signalId})
                    CREATE (s)-[:HAS_BODY_STATE]->(bs:BodyState {
                        code: b.code,
                        longitude: b.longitude,
                        speed: b.speed,
                        retrograde: b.retrograde,
                        sectorIndex: b.sectorIndex
                    })
                `, { bodies, signalId });

                // 4. Batch insert Relations (Aspects - Neutralized)
                const relations = blueprint.aspects.map(a => ({
                    p1: BlueprintService.BODY_CODES[a.planet1] || a.planet1,
                    p2: BlueprintService.BODY_CODES[a.planet2] || a.planet2,
                    type: a.type,
                    orb: a.orb,
                    applying: a.applying,
                    signalId
                }));

                await tx.run(`
                    UNWIND $relations AS r
                    MATCH (s:SignalSnapshot {id: $signalId})
                    CREATE (s)-[:HAS_RELATION_STATE]->(rs:RelationState {
                        p1: r.p1,
                        p2: r.p2,
                        type: r.type,
                        orb: r.orb,
                        applying: r.applying
                    })
                `, { relations, signalId });
            });

            return signalId;
        } finally {
            await session.close();
        }
    }

    /**
     * Create a new Narrative Snapshot (Derived Text)
     */
    async createSnapshot(userId: string, traits: TraitProbability[], source: string, signalSnapshotId?: string): Promise<string> {
        const snapshotId = `sn_${randomUUID()}`;
        const timestamp = new Date().toISOString();

        // 1. JSON Fallback
        try {
            const localSnapshots = await db.getCollection<any>('blueprint_snapshots');
            localSnapshots.push({
                id: snapshotId,
                userId,
                timestamp,
                source,
                traits,
                signalSnapshotId
            });
            await db.saveCollection('blueprint_snapshots', localSnapshots);
        } catch (e) {
            console.error('[BlueprintService] Local JSON save failed:', e);
        }

        if (!(await neo4jService.isHealthy())) {
            console.warn('[BlueprintService] Neo4j unhealthy, skipping graph persist.');
            return snapshotId;
        }

        const session = await neo4jService.getSession();

        try {
            await session.executeWrite(async (tx: any) => {
                // 1. Ensure User exists
                await tx.run('MERGE (u:User {userId: $userId})', { userId });

                // 2. Create the Snapshot node
                await tx.run(`
                    CREATE (s:BlueprintSnapshot {
                        id: $snapshotId,
                        timestamp: $timestamp,
                        source: $source,
                        narrativeVersion: 'v1.2'
                    })
                `, { snapshotId, timestamp, source });

                // 3. Link Snapshot to User and chain history
                await tx.run(`
                    MATCH (u:User {userId: $userId})
                    OPTIONAL MATCH (u)-[old:LATEST_SNAPSHOT]->(prev:BlueprintSnapshot)
                    WITH u, old, prev
                    MATCH (s:BlueprintSnapshot {id: $snapshotId})
                    
                    FOREACH (x IN CASE WHEN old IS NOT NULL THEN [1] ELSE [] END |
                        DELETE old
                        CREATE (s)-[:PREVIOUS_SNAPSHOT]->(prev)
                    )
                    
                    CREATE (u)-[:LATEST_SNAPSHOT]->(s)
                `, { userId, snapshotId });

                // 4. Link to Signal Snapshot if provided
                if (signalSnapshotId) {
                    await tx.run(`
                        MATCH (s:BlueprintSnapshot {id: $snapshotId})
                        MATCH (sig:SignalSnapshot {id: $signalSnapshotId})
                        CREATE (s)-[:DERIVED_FROM]->(sig)
                    `, { snapshotId, signalSnapshotId });
                }

                // 5. Batch insert traits using UNWIND
                await tx.run(`
                    UNWIND $traits AS t
                    MATCH (s:BlueprintSnapshot {id: $snapshotId})
                    MERGE (tr:Trait {traitId: t.traitId})
                    CREATE (s)-[r:HAS_TRAIT_CONFIG {
                        layerId: t.layerId,
                        score: t.score,
                        confidence: t.confidence,
                        description: t.description,
                        source: $source
                    }]->(tr)
                `, { snapshotId, traits, source });
            });

            console.log(`[BlueprintService] Created snapshot ${snapshotId} for user ${userId} via ${source}`);
            return snapshotId;
        } finally {
            await session.close();
        }
    }

    /**
     * Get the snapshot history for a user
     */
    async getHistory(userId: string): Promise<any[]> {
        if (!(await neo4jService.isHealthy())) {
            const localSnapshots = await db.getCollection<any>('blueprint_snapshots');
            return localSnapshots
                .filter(s => s.userId === userId)
                .map(s => ({
                    id: s.id,
                    timestamp: s.timestamp,
                    source: s.source
                }))
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }

        const session = await neo4jService.getSession();
        try {
            const result = await session.run(`
                MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT|PREVIOUS_SNAPSHOT*0..10]->(s:BlueprintSnapshot)
                RETURN s.id as id, s.timestamp as timestamp, s.source as source
                ORDER BY s.timestamp DESC
            `, { userId });

            return result.records.map(r => ({
                id: r.get('id'),
                timestamp: r.get('timestamp'),
                source: r.get('source')
            }));
        } finally {
            await session.close();
        }
    }

    /**
     * Get the latest Blueprint Snapshot for a user
     */
    async getLatestSnapshot(userId: string): Promise<BlueprintSnapshot | null> {
        if (!(await neo4jService.isHealthy())) {
            const localSnapshots = await db.getCollection<any>('blueprint_snapshots');
            const userSnaps = localSnapshots.filter(s => s.userId === userId);
            if (userSnaps.length === 0) return null;

            const latest = userSnaps.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
            return {
                id: latest.id,
                userId: latest.userId,
                timestamp: latest.timestamp,
                source: latest.source,
                traits: latest.traits
            };
        }

        const session = await neo4jService.getSession();
        try {
            const result = await session.run(`
                MATCH (u:User {userId: $userId})-[:LATEST_SNAPSHOT]->(s:BlueprintSnapshot)
                RETURN s.id as id
                ORDER BY s.timestamp DESC
                LIMIT 1
            `, { userId });

            const snapshotId = result.records[0]?.get('id');
            if (!snapshotId) return null;

            return this.getSnapshotDetail(snapshotId);
        } finally {
            await session.close();
        }
    }

    /**
     * Get full detail of a specific snapshot
     */
    async getSnapshotDetail(snapshotId: string): Promise<BlueprintSnapshot | null> {
        if (!(await neo4jService.isHealthy())) {
            const localSnapshots = await db.getCollection<any>('blueprint_snapshots');
            const found = localSnapshots.find(s => s.id === snapshotId);
            if (!found) return null;
            return {
                id: found.id,
                userId: found.userId,
                timestamp: found.timestamp,
                source: found.source,
                traits: found.traits
            };
        }

        const session = await neo4jService.getSession();
        try {
            const result = await session.run(`
                MATCH (u:User)-[:LATEST_SNAPSHOT]->(s:BlueprintSnapshot {id: $snapshotId})
                OPTIONAL MATCH (s)-[r:HAS_TRAIT_CONFIG]->(t:Trait)
                RETURN u.userId as userId, s.id as snapshotId, s.timestamp as timestamp, s.source as source,
                       r.layerId as layerId, t.traitId as traitId, r.score as score, 
                       r.confidence as confidence, r.description as description
            `, { snapshotId });

            if (result.records.length === 0) return null;

            const first = result.records[0];
            const snapshot: BlueprintSnapshot = {
                id: first.get('snapshotId'),
                userId: first.get('userId') || 'unknown',
                timestamp: first.get('timestamp'),
                source: first.get('source'),
                traits: []
            };

            result.records.forEach(r => {
                const lid = r.get('layerId');
                if (lid !== null) {
                    snapshot.traits.push({
                        layerId: lid,
                        traitId: r.get('traitId'),
                        score: r.get('score'),
                        confidence: r.get('confidence'),
                        description: r.get('description')
                    });
                }
            });

            return snapshot;
        } finally {
            await session.close();
        }
    }
    /**
     * Get the latest Signal Snapshot ID for a user
     */
    async getLatestSignalId(userId: string): Promise<string | undefined> {
        if (!(await neo4jService.isHealthy())) {
            const localSignals = await db.getCollection<any>('signal_snapshots');
            const userSignals = localSignals.filter(s => s.userId === userId);
            if (userSignals.length === 0) return undefined;

            const latest = userSignals.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
            return latest.id;
        }

        const session = await neo4jService.getSession();
        try {
            const result = await session.run(`
                MATCH (u:User {userId: $userId})-[:HAS_SIGNAL_SNAPSHOT]->(s:SignalSnapshot)
                RETURN s.id as id
                ORDER BY s.timestamp DESC
                LIMIT 1
            `, { userId });
            return result.records[0]?.get('id');
        } finally {
            await session.close();
        }
    }

    /**
     * Get the full Blueprint from the latest Signal Snapshot
     */
    async getLatestSignal(userId: string): Promise<Blueprint | null> {
        const signalId = await this.getLatestSignalId(userId);
        if (!signalId) return null;

        if (!(await neo4jService.isHealthy())) {
            const localSignals = await db.getCollection<any>('signal_snapshots');
            const found = localSignals.find(s => s.id === signalId);
            if (!found) return null;
            return found.blueprint as Blueprint;
        }

        const session = await neo4jService.getSession();
        try {
            // Fetch Bodies
            const bodyRes = await session.run(`
                MATCH (s:SignalSnapshot {id: $signalId})-[:HAS_BODY_STATE]->(b:BodyState)
                RETURN b.code as code, b.longitude as longitude, b.speed as speed, 
                       b.retrograde as retrograde, b.sectorIndex as house
            `, { signalId });

            // Fetch Relations
            const relRes = await session.run(`
                MATCH (s:SignalSnapshot {id: $signalId})-[:HAS_RELATION_STATE]->(r:RelationState)
                RETURN r.p1 as p1, r.p2 as p2, r.type as type, r.orb as orb, r.applying as applying
            `, { signalId });

            // Reconstruct Sign names from longitude (approximate if not stored, 
            // but we need them for element/modality. Better to store SIGN code too?)
            // OSIA v1.2 stores longitude. 0-30 = Aries, etc.
            const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
            const getSign = (lon: number) => signs[Math.floor(lon / 30) % 12];

            // Reconstruct Reverse Body Codes
            const REVERSE_CODES: Record<string, string> = {
                'B01': 'Sun', 'B02': 'Moon', 'B03': 'Mercury', 'B04': 'Venus', 'B05': 'Mars',
                'B06': 'Jupiter', 'B07': 'Saturn', 'B08': 'Uranus', 'B09': 'Neptune', 'B10': 'Pluto'
            };

            const planets = bodyRes.records.map(r => {
                const code = r.get('code');
                const lon = r.get('longitude');
                return {
                    name: REVERSE_CODES[code] || code,
                    sign: getSign(lon),
                    longitude: lon,
                    degree: lon % 30,
                    speed: r.get('speed'),
                    retrograde: r.get('retrograde'),
                    house: r.get('house')
                };
            });

            const aspects = relRes.records.map(r => ({
                planet1: REVERSE_CODES[r.get('p1')] || r.get('p1'),
                planet2: REVERSE_CODES[r.get('p2')] || r.get('p2'),
                type: r.get('type'),
                orb: r.get('orb'),
                applying: r.get('applying')
            }));

            const elements = { fire: 0, earth: 0, air: 0, water: 0 };
            const elementMap: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
                'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
                'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
                'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
                'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
            };

            planets.forEach(p => {
                const element = elementMap[p.sign];
                if (element) elements[element]++;
            });

            return {
                planets,
                aspects,
                houses: {
                    ascendant: getSign(planets.find(p => p.name === 'Sun')?.longitude || 0), // Mock ASC if not stored
                    midheaven: getSign(planets.find(p => p.name === 'Sun')?.longitude || 0), // Mock MC
                    cusps: new Array(12).fill(0),
                    distribution: {} // Will be recalculated if needed
                },
                elements
            };
        } finally {
            await session.close();
        }
    }
}

export const blueprintService = new BlueprintService();
