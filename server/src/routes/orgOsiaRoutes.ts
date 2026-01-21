/**
 * Organization OSIA Routes — v1.0
 * 
 * API endpoints for organization culture analysis.
 */

import express, { Request, Response } from 'express';
import { orgCultureService } from '../services/OrgCultureService';
import { aiCreditsService } from '../services/AICreditsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireOrgMember } from '../middleware/orgAuthMiddleware';

interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const router = express.Router();

// All routes require authentication and organization membership
router.use(authMiddleware);

/**
 * GET /api/orgs/osia/:orgId/culture
 * Get organization culture profile (aggregated data, free)
 * Restricted to organization members.
 */
router.get('/:orgId/culture', requireOrgMember, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const orgId = req.params.orgId as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await orgCultureService.getOrgCulture(orgId);
        if (!profile) {
            return res.status(404).json({ error: 'Could not generate culture profile. Org may have no member OSIA data.' });
        }

        res.json(profile);
    } catch (error: any) {
        console.error('[OrgOSIAAPI] Culture error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/orgs/osia/:orgId/analyze
 * Generate AI-powered culture report (costs 15 credits)
 * Restricted to organization members.
 */
router.post('/:orgId/analyze', requireOrgMember, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const orgId = req.params.orgId as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check credits
        const creditCheck = await aiCreditsService.canGenerate(userId, 'org_culture');
        if (!creditCheck.allowed) {
            return res.status(402).json({
                error: 'Insufficient credits',
                reason: creditCheck.reason,
                creditsRequired: creditCheck.creditsRequired
            });
        }

        const report = await orgCultureService.generateAIReport(userId, orgId);
        if (!report) {
            return res.status(500).json({ error: 'Failed to generate culture report' });
        }

        res.json(report);
    } catch (error: any) {
        console.error('[OrgOSIAAPI] Analyze error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
