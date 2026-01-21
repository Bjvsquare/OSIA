/**
 * Nudges Routes — v1.0
 * 
 * API endpoints for OSIA-driven behavioral nudges.
 */

import express, { Request, Response } from 'express';
import { nudgesService } from '../services/NudgesService';
import { authMiddleware } from '../middleware/authMiddleware';

interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/nudges
 * Get today's active nudges for the current user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const nudges = await nudgesService.getActiveNudges(userId);
        return res.json({ nudges });
    } catch (error: any) {
        console.error('[NudgesAPI] Get error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/nudges/generate
 * Force generate new daily nudges (refresh)
 */
router.post('/generate', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const daily = await nudgesService.generateDailyNudges(userId);
        return res.json(daily);
    } catch (error: any) {
        console.error('[NudgesAPI] Generate error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/nudges/ai
 * Get an AI-enhanced personalized nudge (costs credits)
 */
router.post('/ai', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { context } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const nudge = await nudgesService.getAINudge(userId, context);
        if (!nudge) {
            return res.status(404).json({ error: 'Could not generate AI nudge. Credits may be insufficient or no OSIA data.' });
        }

        return res.json(nudge);
    } catch (error: any) {
        console.error('[NudgesAPI] AI nudge error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/nudges/:nudgeId/dismiss
 * Dismiss a nudge
 */
router.post('/:nudgeId/dismiss', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const nudgeId = req.params.nudgeId as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const success = await nudgesService.dismissNudge(userId, nudgeId);
        return res.json({ success });
    } catch (error: any) {
        console.error('[NudgesAPI] Dismiss error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/nudges/:nudgeId/complete
 * Mark a nudge as completed
 */
router.post('/:nudgeId/complete', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const nudgeId = req.params.nudgeId as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const success = await nudgesService.completeNudge(userId, nudgeId);
        return res.json({ success });
    } catch (error: any) {
        console.error('[NudgesAPI] Complete error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
