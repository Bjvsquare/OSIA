/**
 * Team OSIA Routes — v1.0
 * 
 * API endpoints for team dynamics and OSIA aggregation.
 */

import express, { Request, Response } from 'express';
import { teamDynamicsService } from '../services/TeamDynamicsService';
import { aiCreditsService } from '../services/AICreditsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireTeamMember } from '../middleware/teamAuthMiddleware';
import { db } from '../db/JsonDb';

// Extended Request type with user property
interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/teams/osia/:teamId/dynamics
 * Get team dynamics profile (aggregated data, free)
 * Restricted to team members.
 */
router.get('/:teamId/dynamics', requireTeamMember, async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get team members (needed for the service)
        const members = await getTeamMembers(teamId);

        const profile = await teamDynamicsService.getTeamDynamics(teamId, members);
        if (!profile) {
            return res.status(404).json({ error: 'Could not generate team dynamics. Members may not have OSIA data.' });
        }

        res.json(profile);
    } catch (error: any) {
        console.error('[TeamOSIAAPI] Dynamics error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/teams/osia/:teamId/analyze
 * Generate AI-powered team report (costs credits)
 * Restricted to team members.
 */
router.post('/:teamId/analyze', requireTeamMember, async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check credits
        const creditCheck = await aiCreditsService.canGenerate(userId, 'team_dynamics');
        if (!creditCheck.allowed) {
            return res.status(402).json({
                error: 'Insufficient credits',
                reason: creditCheck.reason,
                creditsRequired: creditCheck.creditsRequired
            });
        }

        // Get team members
        const members = await getTeamMembers(teamId);
        if (members.length < 2) {
            return res.status(400).json({ error: 'Team needs at least 2 members for analysis' });
        }

        const report = await teamDynamicsService.generateAIReport(userId, teamId, members);
        if (!report) {
            return res.status(500).json({ error: 'Failed to generate team report' });
        }

        res.json(report);
    } catch (error: any) {
        console.error('[TeamOSIAAPI] Analyze error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/teams/osia/:teamId/matrix
 * Get team compatibility matrix (free)
 * Restricted to team members.
 */
router.get('/:teamId/matrix', requireTeamMember, async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const members = await getTeamMembers(teamId);
        if (members.length < 2) {
            return res.status(400).json({ error: 'Team needs at least 2 members for matrix' });
        }

        const matrix = await teamDynamicsService.calculateCompatibilityMatrix(teamId, members);
        res.json(matrix);
    } catch (error: any) {
        console.error('[TeamOSIAAPI] Matrix error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper: Get team members from database
 */
async function getTeamMembers(teamId: string): Promise<{ userId: string; name?: string; role?: string }[]> {
    try {
        // Try to get from teams collection
        const teams = await db.getCollection<{ id: string; members: { userId: string; name?: string; role?: string }[] }>('teams');
        const team = teams.find(t => t.id === teamId);

        if (team?.members) {
            return team.members;
        }

        // Fallback: try team_members collection
        const allMembers = await db.getCollection<{ teamId: string; userId: string; name?: string; role?: string }>('team_members');
        return allMembers.filter(m => m.teamId === teamId);
    } catch {
        return [];
    }
}

export default router;
