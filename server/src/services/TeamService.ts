import { db } from '../db/JsonDb';
import { randomUUID } from 'crypto';
import { blueprintService, TraitProbability, BlueprintSnapshot } from './BlueprintService';
import { teamAnalyticsService, TeamAnalytics, OverviewMetrics } from './TeamAnalyticsService';
import { journeyService } from './JourneyService';

export interface TeamMember {
    userId: string;
    role: 'Leader' | 'Member';
    joinedAt: string;
}

export interface Team {
    id: string;
    name: string;
    type: string;
    purpose: string;
    expectedSize: number;
    successMarkers: string[];
    sessionMode: string;
    creatorId: string;
    members: TeamMember[];
    createdAt: string;
    isDiscoverable?: boolean; // New field for search visibility
}

export interface TeamJoinRequest {
    id: string;
    teamId: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

export class TeamService {
    async createTeam(creatorId: string, data: any): Promise<Team> {
        const teams = await db.getCollection<Team>('teams');

        const newTeam: Team = {
            id: `team_${randomUUID()}`,
            name: data.teamName,
            type: data.teamType,
            purpose: data.purpose,
            expectedSize: Number(data.expectedSize) || 5,
            successMarkers: data.successMarkers,
            sessionMode: data.sessionMode,
            creatorId,
            members: [
                {
                    userId: creatorId,
                    role: 'Leader', // We'll treat Leader as super-admin for now
                    joinedAt: new Date().toISOString()
                }
            ],
            createdAt: new Date().toISOString()
        };

        teams.push(newTeam);
        await db.saveCollection('teams', teams);

        // Log activity for journey credits
        try {
            await journeyService.logActivity(creatorId, 'team_created', { teamId: newTeam.id });
        } catch (e) { /* Ignore journey errors */ }

        return newTeam;
    }

    async joinTeam(teamId: string, userId: string): Promise<void> {
        const teams = await db.getCollection<Team>('teams');
        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) {
            throw new Error('Team not found');
        }

        if (teams[teamIndex].members.some(m => m.userId === userId)) {
            return; // Already a member
        }

        teams[teamIndex].members.push({
            userId,
            role: 'Member',
            joinedAt: new Date().toISOString()
        });

        await db.saveCollection('teams', teams);

        // Log activity for journey credits
        try {
            await journeyService.logActivity(userId, 'team_joined', { teamId });
        } catch (e) { /* Ignore journey errors */ }
    }

    async getTeamDashboardData(teamId: string): Promise<any> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        const memberCount = team.members.length;
        // Threshold: for small teams (≤3), need at least the current count (no suppression — too small for anonymity to matter).
        // For larger teams, need 25% of expected (min 2). Never suppress beyond what the team can actually reach.
        const expectedSize = team.expectedSize || 5;
        const threshold = expectedSize <= 3 ? memberCount : Math.min(Math.max(2, Math.floor(expectedSize * 0.25)), expectedSize);

        // Suppression logic
        if (memberCount < threshold) {
            return {
                team,
                suppressed: true,
                reason: `Insufficient data for anonymity (needs ${threshold} members, currently ${memberCount})`
            };
        }

        // Aggregate signals from all members
        const memberSnapshots = await Promise.all(
            team.members.map(m => blueprintService.getLatestSnapshot(m.userId))
        );

        const validSnapshots = memberSnapshots.filter(s => s !== null && s !== undefined);

        // Fetch user details and snapshot status for the members list
        const users = await db.getCollection<any>('users');
        const enrichedMembers = team.members.map(m => {
            const user = users.find(u => u.id === m.userId);
            const snapshot = memberSnapshots.find((s, idx) => team.members[idx].userId === m.userId);
            return {
                ...m,
                username: user?.username || 'Unknown User',
                name: user?.name || user?.username?.split('@')[0] || 'Explorer',
                hasData: !!snapshot,
                lastSync: snapshot?.timestamp || null,
                avatarUrl: user?.avatarUrl
            };
        });

        // Calculate Data Coverage
        const syncedCount = validSnapshots.length;
        const totalCount = team.members.length;
        const dataCoverage = totalCount > 0 ? parseFloat((syncedCount / totalCount).toFixed(2)) : 0;

        // Use enriched team for the response
        const enrichedTeam = {
            ...team,
            members: enrichedMembers
        };

        if (validSnapshots.length === 0) {
            return {
                team: enrichedTeam,
                suppressed: true,
                reason: 'No member data available yet.'
            };
        }

        // Calculate 8-Layer Climate Indicators
        const layerResults = [1, 2, 3, 4, 5, 6, 7, 8].map(layerId => {
            const scores = validSnapshots.map(s => {
                const trait = s!.traits.find(t => t.layerId === layerId);
                return trait ? trait.score : 0.5;
            });

            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

            // Cognitive Diversity Index (Standard Deviation)
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            const deviation = Math.sqrt(variance);

            return {
                layerId,
                score: parseFloat(mean.toFixed(2)),
                diversity: parseFloat(deviation.toFixed(2))
            };
        });

        const getLayer = (id: number) => layerResults.find(l => l.layerId === id);

        // Map specific layers to the core OSIA team indicators
        const pace = getLayer(2)!.score; // Energy
        const safety = getLayer(7)!.score; // Emotional
        const clarity = getLayer(4)!.score; // Logic
        const identity = getLayer(8)!.score; // Identity/Purpose
        const resilience = getLayer(1)!.score; // Foundation/Root

        // Diversity Friction: High deviation in core layers reduces effective Collective IQ
        const diversityFriction = (getLayer(4)!.diversity + getLayer(7)!.diversity + getLayer(1)!.diversity) / 3;

        // Collective IQ calculation (weighted + alignment penalty)
        const rawIQ = (clarity * 0.4 + safety * 0.3 + resilience * 0.3);
        const collectiveIQ = rawIQ * (1 - (diversityFriction * 0.15)); // Up to 15% reduction for extreme cognitive dissonance

        // Dynamic Insights Engine
        const friction = [];
        const strengths = [];

        // Logic for friction based on diversity and low scores
        if (getLayer(4)!.diversity > 0.25) friction.push('Cognitive Dissonance (Logic Mismatch)');
        if (safety < 0.6) friction.push('Emotional Friction');
        if (getLayer(2)!.diversity > 0.3) friction.push('Pace Asymmetry');
        if (friction.length === 0) friction.push('Low minor operational friction');

        // Logic for strengths
        if (safety > 0.85) strengths.push('High Psychological Safety');
        if (pace > 0.8) strengths.push('High Execution Velocity');
        if (identity > 0.8) strengths.push('Deep Purpose Alignment');
        if (strengths.length === 0) strengths.push('Steady Growth Phase');

        // Compute advanced analytics using the dedicated service
        const memberDetails = enrichedMembers.map(m => ({ userId: m.userId, name: m.name }));
        const analytics = teamAnalyticsService.computeFullAnalytics(
            validSnapshots as BlueprintSnapshot[],
            memberDetails
        );

        return {
            team: enrichedTeam,
            suppressed: false,
            metrics: {
                pace: parseFloat(pace.toFixed(2)),
                safety: parseFloat(safety.toFixed(2)),
                clarity: parseFloat(clarity.toFixed(2)),
                collectiveIQ: parseFloat(collectiveIQ.toFixed(2)),
                dataCoverage,
                syncedCount,
                totalCount,
                layers: layerResults,
                lastCalibrated: new Date().toISOString()
            },
            // Legacy quick insights
            topFriction: friction.slice(0, 3),
            coreStrengths: strengths.slice(0, 3),
            pressureTags: team.type === 'Corporate' ? ['Deadlines', 'Agile Velocity'] : ['Performance', 'Context Shift'],
            // Advanced Analytics (Enterprise)
            analytics
        };
    }

    async getTeamsForUser(userId: string): Promise<Team[]> {
        const teams = await db.getCollection<Team>('teams');
        return teams.filter(t => t.members.some(m => m.userId === userId));
    }

    async leaveTeam(teamId: string, userId: string): Promise<void> {
        const teams = await db.getCollection<Team>('teams');
        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) {
            throw new Error('Team not found');
        }

        const team = teams[teamIndex];
        const initialMemberCount = team.members.length;

        // Remove the member
        team.members = team.members.filter(m => m.userId !== userId);

        if (team.members.length === initialMemberCount) {
            throw new Error('User is not a member of this team');
        }

        // Potential logic: If the creator/last leader leaves, handle ownership transfer?
        // For now, we just allow leaving.

        await db.saveCollection('teams', teams);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);

        if (!team) throw new Error('Team not found');

        // Only creator or an admin can delete
        const member = team.members.find(m => m.userId === userId);
        const isCreator = team.creatorId === userId;

        if (!isCreator && (!member || (member.role !== 'Leader' && member.role !== 'Admin' as any))) {
            throw new Error('Unauthorized to delete team');
        }

        const filteredTeams = teams.filter(t => t.id !== teamId);
        await db.saveCollection('teams', filteredTeams);
    }

    async updateMemberRole(teamId: string, userId: string, targetUserId: string, newRole: 'Leader' | 'Member' | 'Admin'): Promise<void> {
        const teams = await db.getCollection<Team>('teams');
        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) throw new Error('Team not found');

        const team = teams[teamIndex];
        const requestor = team.members.find(m => m.userId === userId);

        // Only Leader or Admin can promote
        if (!requestor || (requestor.role !== 'Leader' && requestor.role !== 'Admin' as any)) {
            throw new Error('Unauthorized to change roles');
        }

        const targetMember = team.members.find(m => m.userId === targetUserId);
        if (!targetMember) throw new Error('Target user is not a member');

        targetMember.role = newRole as any;
        await db.saveCollection('teams', teams);
    }

    async removeTeamMember(teamId: string, adminId: string, targetUserId: string): Promise<void> {
        const teams = await db.getCollection<Team>('teams');
        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) throw new Error('Team not found');

        const team = teams[teamIndex];
        const requestor = team.members.find(m => m.userId === adminId);

        // Only Leader or Admin can remove members
        if (!requestor || (requestor.role !== 'Leader' && requestor.role !== 'Admin' as any)) {
            throw new Error('Unauthorized to remove members');
        }

        // Cannot remove the Creator (Leadership transfer required first)
        if (targetUserId === team.creatorId) {
            throw new Error('Cannot remove the Team Creator');
        }

        const initialLength = team.members.length;
        team.members = team.members.filter(m => m.userId !== targetUserId);

        if (team.members.length === initialLength) {
            throw new Error('Target user is not a member');
        }

        await db.saveCollection('teams', teams);
    }

    async saveMessage(teamId: string, userId: string, content: string): Promise<any> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);
        if (!team) throw new Error('Team not found');

        // Verify user is Leader/Admin
        const member = team.members.find(m => m.userId === userId);
        if (!member || (member.role !== 'Leader' && member.role !== 'Admin' as any)) {
            throw new Error('Only core team members can send messages');
        }

        const messages = await db.getCollection<any>('team_messages');
        const newMessage = {
            id: `msg_${randomUUID()}`,
            teamId,
            userId,
            content,
            timestamp: new Date().toISOString()
        };

        messages.push(newMessage);
        await db.saveCollection('team_messages', messages);

        // Log activity for journey credits
        try {
            await journeyService.logActivity(userId, 'team_message', { teamId });
        } catch (e) { /* Ignore journey errors */ }

        return newMessage;
    }

    async getMessages(teamId: string): Promise<any[]> {
        const messages = await db.getCollection<any>('team_messages');
        const users = await db.getCollection<any>('users');

        return messages
            .filter(m => m.teamId === teamId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(msg => {
                const user = users.find(u => u.id === msg.userId);
                return {
                    ...msg,
                    senderName: user?.name || user?.username || 'Unknown',
                    senderAvatar: user?.avatarUrl
                };
            });
    }

    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const messages = await db.getCollection<any>('team_messages');
        const messageIndex = messages.findIndex(m => m.id === messageId);

        if (messageIndex === -1) {
            throw new Error('Message not found');
        }

        const message = messages[messageIndex];

        // Only allow the sender to delete their own message
        if (message.userId !== userId) {
            throw new Error('You can only delete your own messages');
        }

        messages.splice(messageIndex, 1);
        await db.saveCollection('team_messages', messages);
    }

    async isMember(teamId: string, userId: string): Promise<boolean> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);
        return team?.members.some(m => m.userId === userId) || false;
    }

    async isAdmin(teamId: string, userId: string): Promise<boolean> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);
        const member = team?.members.find(m => m.userId === userId);
        return member?.role === 'Leader' || member?.role === 'Admin' as any;
    }

    // ===== TEAM SEARCH & JOIN REQUEST METHODS =====

    /**
     * Search for teams by name (only returns discoverable teams)
     */
    async searchTeams(query: string, userId: string): Promise<Team[]> {
        const teams = await db.getCollection<Team>('teams');
        const lowerQuery = query.toLowerCase().trim();

        // Filter teams that match the query and are discoverable
        // Also exclude teams the user is already a member of
        return teams.filter(t => {
            const matchesQuery = t.name.toLowerCase().includes(lowerQuery);
            const isDiscoverable = t.isDiscoverable !== false; // Default to discoverable if not set
            const notAlreadyMember = !t.members.some(m => m.userId === userId);
            return matchesQuery && isDiscoverable && notAlreadyMember;
        }).map(t => ({
            ...t,
            members: [] // Don't expose member details in search results
        }));
    }

    /**
     * Request to join a team (creates a pending request)
     */
    async requestToJoinTeam(teamId: string, userId: string, message?: string): Promise<TeamJoinRequest> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Check if already a member
        if (team.members.some(m => m.userId === userId)) {
            throw new Error('You are already a member of this team');
        }

        // Check for existing pending request
        const requests = await db.getCollection<TeamJoinRequest>('team_requests');
        const existingRequest = requests.find(
            r => r.teamId === teamId && r.userId === userId && r.status === 'pending'
        );

        if (existingRequest) {
            throw new Error('You already have a pending request to join this team');
        }

        const newRequest: TeamJoinRequest = {
            id: `req_${randomUUID()}`,
            teamId,
            userId,
            status: 'pending',
            message,
            createdAt: new Date().toISOString()
        };

        requests.push(newRequest);
        await db.saveCollection('team_requests', requests);

        return newRequest;
    }

    /**
     * Get pending join requests for a team (admin only)
     */
    async getJoinRequests(teamId: string, adminUserId: string): Promise<any[]> {
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Check if user is admin/leader
        const member = team.members.find(m => m.userId === adminUserId);
        if (!member || (member.role !== 'Leader' && member.role !== 'Admin' as any)) {
            throw new Error('Unauthorized to view join requests');
        }

        const requests = await db.getCollection<TeamJoinRequest>('team_requests');
        const users = await db.getCollection<any>('users');

        // Get pending requests for this team with user details
        return requests
            .filter(r => r.teamId === teamId && r.status === 'pending')
            .map(r => {
                const user = users.find(u => u.id === r.userId);
                return {
                    ...r,
                    userName: user?.name || user?.username?.split('@')[0] || 'Unknown',
                    userEmail: user?.username,
                    userAvatar: user?.avatarUrl
                };
            });
    }

    /**
     * Approve or reject a join request
     */
    async handleJoinRequest(
        requestId: string,
        adminUserId: string,
        action: 'approve' | 'reject'
    ): Promise<{ success: boolean; message: string }> {
        const requests = await db.getCollection<TeamJoinRequest>('team_requests');
        const requestIndex = requests.findIndex(r => r.id === requestId);

        if (requestIndex === -1) {
            throw new Error('Request not found');
        }

        const request = requests[requestIndex];
        const teams = await db.getCollection<Team>('teams');
        const team = teams.find(t => t.id === request.teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Check if user is admin/leader
        const member = team.members.find(m => m.userId === adminUserId);
        if (!member || (member.role !== 'Leader' && member.role !== 'Admin' as any)) {
            throw new Error('Unauthorized to handle join requests');
        }

        // Update request status
        requests[requestIndex].status = action === 'approve' ? 'approved' : 'rejected';
        requests[requestIndex].resolvedAt = new Date().toISOString();
        requests[requestIndex].resolvedBy = adminUserId;
        await db.saveCollection('team_requests', requests);

        // If approved, add user to team
        if (action === 'approve') {
            await this.joinTeam(request.teamId, request.userId);
            return { success: true, message: 'Request approved and user added to team' };
        }

        return { success: true, message: 'Request rejected' };
    }

    /**
     * Get user's pending join requests
     */
    async getMyJoinRequests(userId: string): Promise<any[]> {
        const requests = await db.getCollection<TeamJoinRequest>('team_requests');
        const teams = await db.getCollection<Team>('teams');

        return requests
            .filter(r => r.userId === userId)
            .map(r => {
                const team = teams.find(t => t.id === r.teamId);
                return {
                    ...r,
                    teamName: team?.name || 'Unknown Team'
                };
            });
    }
}

export const teamService = new TeamService();
