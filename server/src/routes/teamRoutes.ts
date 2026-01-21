import express from 'express';
import { teamService } from '../services/TeamService';
import { connectionService } from '../services/ConnectionService';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireTeamMember, requireTeamAdmin } from '../middleware/teamAuthMiddleware';
import { auditLogger } from '../services/AuditLogger';

const router = express.Router();

// Create a new team
router.post('/', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const team = await teamService.createTeam(userId, req.body);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'create_team',
            status: 'success',
            details: { teamId: team.id, teamName: team.name }
        });

        res.status(201).json(team);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Join a team
router.post('/:id/join', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        await teamService.joinTeam(teamId, userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'join_team',
            status: 'success',
            details: { teamId }
        });

        res.json({ success: true, message: 'Successfully joined the team' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get team dashboard data
router.get('/:id/dashboard', authMiddleware, requireTeamMember, async (req: any, res: any) => {
    try {
        const teamId = req.params.id;
        const data = await teamService.getTeamDashboardData(teamId);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all teams for the current user
router.get('/my-teams', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teams = await teamService.getTeamsForUser(userId);
        res.json(teams);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== TEAM SEARCH & JOIN REQUEST ROUTES =====

// Search for teams to join
router.get('/search', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const query = req.query.q as string || '';
        const teams = await teamService.searchTeams(query, userId);
        res.json(teams);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's pending join requests
router.get('/my-requests', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requests = await teamService.getMyJoinRequests(userId);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Request to join a team
router.post('/:id/request-join', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        const { message } = req.body;

        const request = await teamService.requestToJoinTeam(teamId, userId, message);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'request_join_team',
            status: 'success',
            details: { teamId, requestId: request.id }
        });

        res.json({ success: true, request });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get pending join requests for a team (admin only)
router.get('/:id/join-requests', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        const requests = await teamService.getJoinRequests(teamId, userId);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Handle join request (approve/reject)
router.patch('/:id/join-requests/:requestId', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requestId = req.params.requestId;
        const { action } = req.body; // 'approve' or 'reject'

        if (!action || (action !== 'approve' && action !== 'reject')) {
            return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
        }

        const result = await teamService.handleJoinRequest(requestId, userId, action);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: `${action}_join_request`,
            status: 'success',
            details: { requestId }
        });

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});


// Search for users to add to a team
router.get('/members/search', authMiddleware, async (req: any, res: any) => {
    try {
        const query = req.query.q as string;
        const currentUserId = req.user.id || req.user.userId;
        const results = await connectionService.searchUsers(query, currentUserId);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add a specific member to a team (Leader/Admin only)
router.post('/:id/members', authMiddleware, requireTeamAdmin, async (req: any, res: any) => {
    try {
        const teamId = req.params.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        await teamService.joinTeam(teamId, userId);

        await auditLogger.log({
            userId: req.user.id || req.user.userId,
            username: req.user.username,
            action: 'add_team_member',
            status: 'success',
            details: { teamId, addedUserId: userId }
        });

        res.json({ success: true, message: 'Member added successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Leave a team
router.post('/:id/leave', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;

        await teamService.leaveTeam(teamId, userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'leave_team',
            status: 'success',
            details: { teamId }
        });

        res.json({ success: true, message: 'Successfully left the team' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a team
router.delete('/:id', authMiddleware, requireTeamAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;

        await teamService.deleteTeam(teamId, userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'delete_team',
            status: 'success',
            details: { teamId }
        });

        res.json({ success: true, message: 'Team deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update member role
router.patch('/:id/members/:targetUserId/role', authMiddleware, requireTeamAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        const targetUserId = req.params.targetUserId;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        await teamService.updateMemberRole(teamId, userId, targetUserId, role);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'update_member_role',
            status: 'success',
            details: { teamId, targetUserId, newRole: role }
        });

        res.json({ success: true, message: 'Member role updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get team messages
router.get('/:id/messages', authMiddleware, requireTeamMember, async (req: any, res: any) => {
    try {
        const teamId = req.params.id;
        const messages = await teamService.getMessages(teamId);
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Send team message
router.post('/:id/messages', authMiddleware, requireTeamAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        const { content } = req.body;

        const message = await teamService.saveMessage(teamId, userId, content);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'send_team_message',
            status: 'success',
            details: { teamId }
        });

        res.json(message);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Remove a member (Kick)
router.delete('/:id/members/:targetUserId', authMiddleware, requireTeamAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const teamId = req.params.id;
        const targetUserId = req.params.targetUserId;

        await teamService.removeTeamMember(teamId, userId, targetUserId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'remove_team_member',
            status: 'success',
            details: { teamId, targetUserId }
        });

        res.json({ success: true, message: 'Member removed successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a message (user can only delete their own)
router.delete('/:id/messages/:messageId', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const messageId = req.params.messageId;

        await teamService.deleteMessage(messageId, userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'delete_team_message',
            status: 'success',
            details: { messageId }
        });

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
