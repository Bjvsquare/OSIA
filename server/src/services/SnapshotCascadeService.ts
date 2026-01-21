import { db } from '../db/JsonDb';
import { osiaIntelligenceService } from './OSIAIntelligenceService';
import { Signal } from './ClaimEngine';

/**
 * SnapshotCascadeService
 * 
 * After a user completes a refinement session (Patterns feedback + thought experiments),
 * this service cascades the updated blueprint data to:
 *   1. OSIA intelligence (regenerate claims, patterns, themes)
 *   2. Team analytics (update user's team contribution)
 *   3. Connection data (refresh relational connectors)
 *   4. Org datasets (update culture analysis)
 */

export class SnapshotCascadeService {

    /**
     * Execute the full cascade after a refinement session.
     * Called when the user finishes refining their blueprint.
     */
    async cascadeUpdate(userId: string): Promise<{
        success: boolean;
        snapshotId: string;
        cascadeResults: {
            osiaRegenerated: boolean;
            teamsUpdated: string[];
            connectionsRefreshed: boolean;
            orgsUpdated: string[];
        };
    }> {
        console.log(`[Cascade] Starting cascade update for user ${userId}`);

        // 1. Get the latest blueprint snapshot
        const snapshots = await db.getCollection<any>('blueprint_snapshots');
        const userSnapshots = snapshots.filter(s => s.userId === userId);
        const latestSnapshot = userSnapshots.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        if (!latestSnapshot) {
            throw new Error('No blueprint snapshot found for cascade.');
        }

        const cascadeResults = {
            osiaRegenerated: false,
            teamsUpdated: [] as string[],
            connectionsRefreshed: false,
            orgsUpdated: [] as string[],
        };

        // 2. Regenerate OSIA intelligence output
        try {
            const osiaSignals: Signal[] = latestSnapshot.traits.map((trait: any, index: number) => ({
                signalId: `SIG.REFINE.${userId}.${index}`,
                userId,
                questionId: `TRAIT.${trait.traitId}`,
                layerIds: [trait.layerId],
                rawValue: trait.description || `Trait ${trait.traitId}`,
                normalizedValue: trait.description || `Trait ${trait.traitId}`,
                timestamp: new Date().toISOString(),
                source: 'refinement' as const,
            }));

            await osiaIntelligenceService.processSignals(
                userId,
                osiaSignals,
                'refinement',
                { includeRelationalConnectors: true }
            );
            cascadeResults.osiaRegenerated = true;
            console.log(`[Cascade] OSIA intelligence regenerated for ${userId}`);
        } catch (err) {
            console.error(`[Cascade] OSIA regeneration failed for ${userId}:`, err);
        }

        // 3. Update team data
        try {
            const teams = await db.getCollection<any>('teams');
            const userTeams = teams.filter((t: any) =>
                t.members?.some((m: any) => m.userId === userId)
            );

            for (const team of userTeams) {
                // Update user's contribution data within the team
                const memberIndex = team.members.findIndex((m: any) => m.userId === userId);
                if (memberIndex !== -1) {
                    team.members[memberIndex].latestSnapshotId = latestSnapshot.id;
                    team.members[memberIndex].lastUpdated = new Date().toISOString();
                    cascadeResults.teamsUpdated.push(team.id);
                }
            }

            if (userTeams.length > 0) {
                await db.saveCollection('teams', teams);
                console.log(`[Cascade] Updated ${userTeams.length} teams for ${userId}`);
            }
        } catch (err) {
            console.error(`[Cascade] Team update failed for ${userId}:`, err);
        }

        // 4. Refresh connection/compatibility data
        try {
            const connections = await db.getCollection<any>('connections');
            const userConnections = connections.filter((c: any) =>
                c.userId1 === userId || c.userId2 === userId
            );

            for (const conn of userConnections) {
                // Mark connection scores as stale so they get recalculated on next view
                conn.stale = true;
                conn.lastCascade = new Date().toISOString();
            }

            if (userConnections.length > 0) {
                await db.saveCollection('connections', connections);
                cascadeResults.connectionsRefreshed = true;
                console.log(`[Cascade] Marked ${userConnections.length} connections for refresh`);
            }
        } catch (err) {
            console.error(`[Cascade] Connection refresh failed for ${userId}:`, err);
        }

        // 5. Update org-level culture data
        try {
            const orgMembers = await db.getCollection<any>('organization_members');
            const userOrgs = orgMembers
                .filter((m: any) => m.userId === userId)
                .map((m: any) => m.organizationId);

            for (const orgId of userOrgs) {
                // Mark org culture analysis as needing recalculation
                const orgData = await db.getCollection<any>('organizations');
                const org = orgData.find((o: any) => o.id === orgId);
                if (org) {
                    org.cultureStale = true;
                    org.lastMemberUpdate = new Date().toISOString();
                    cascadeResults.orgsUpdated.push(orgId);
                }
                await db.saveCollection('organizations', orgData);
            }

            if (userOrgs.length > 0) {
                console.log(`[Cascade] Updated ${userOrgs.length} organizations for ${userId}`);
            }
        } catch (err) {
            console.error(`[Cascade] Org update failed for ${userId}:`, err);
        }

        // 6. Record the cascade event
        const cascadeEvents = await db.getCollection<any>('cascade_events');
        cascadeEvents.push({
            id: `cascade_${Date.now()}`,
            userId,
            snapshotId: latestSnapshot.id,
            timestamp: new Date().toISOString(),
            results: cascadeResults,
        });
        await db.saveCollection('cascade_events', cascadeEvents);

        console.log(`[Cascade] Cascade complete for ${userId}:`, cascadeResults);

        return {
            success: true,
            snapshotId: latestSnapshot.id,
            cascadeResults,
        };
    }
}

export const snapshotCascadeService = new SnapshotCascadeService();
