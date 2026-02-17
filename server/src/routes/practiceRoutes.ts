import express from 'express';
import { behavioralActivationService } from '../services/BehavioralActivationService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   Practice Routes — /api/practice

   Values discovery + practice nudge management.
   All routes require authentication.
   ═══════════════════════════════════════════════════════════ */

/**
 * GET /api/practice/values
 * Get user's discovered values.
 */
router.get('/values', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const result = await behavioralActivationService.getValues(userId);
        res.json(result);
    } catch (error: any) {
        console.error('[Practice] Get values error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/practice/values
 * Save values from Socratic discovery flow.
 * Body: { values: Array<{ name, definition, source, selfRating, timeSpentRating, tomorrowAction? }> }
 */
router.post('/values', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { values } = req.body;

        if (!Array.isArray(values) || values.length === 0) {
            return res.status(400).json({ error: 'Values array is required' });
        }

        const saved = await behavioralActivationService.saveValues(userId, values);
        res.json({ values: saved });
    } catch (error: any) {
        console.error('[Practice] Save values error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/practice/nudges
 * Get all practice nudges.
 */
router.get('/nudges', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nudges = await behavioralActivationService.getPracticeNudges(userId);
        res.json({ nudges });
    } catch (error: any) {
        console.error('[Practice] Get nudges error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/practice/nudges
 * Create a practice nudge linked to a value.
 * Body: { valueId, title, description, frequency, context }
 */
router.post('/nudges', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { valueId, title, description, frequency, context } = req.body;

        if (!valueId || !title) {
            return res.status(400).json({ error: 'valueId and title are required' });
        }

        const nudge = await behavioralActivationService.createPracticeNudge(userId, {
            valueId,
            title,
            description: description || '',
            frequency: frequency || 'daily',
            context: context || 'anytime',
        });
        res.json({ nudge });
    } catch (error: any) {
        console.error('[Practice] Create nudge error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/practice/nudges/:id
 * Update a practice nudge.
 * Body: { title?, description?, frequency?, context?, isActive? }
 */
router.patch('/nudges/:id', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nudgeId = req.params.id;
        const updates = req.body;

        const nudge = await behavioralActivationService.updatePracticeNudge(userId, nudgeId, updates);
        if (!nudge) {
            return res.status(404).json({ error: 'Nudge not found' });
        }
        res.json({ nudge });
    } catch (error: any) {
        console.error('[Practice] Update nudge error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/practice/nudges/:id
 * Delete a practice nudge.
 */
router.delete('/nudges/:id', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nudgeId = req.params.id;

        const success = await behavioralActivationService.deletePracticeNudge(userId, nudgeId);
        if (!success) {
            return res.status(404).json({ error: 'Nudge not found' });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Practice] Delete nudge error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/practice/nudges/:id/complete
 * Log a practice nudge completion.
 * Body: { reflection?: string }
 */
router.post('/nudges/:id/complete', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nudgeId = req.params.id;
        const { reflection } = req.body;

        const completion = await behavioralActivationService.logCompletion(userId, nudgeId, reflection);
        if (!completion) {
            return res.status(404).json({ error: 'Nudge not found' });
        }
        res.json({ completion });
    } catch (error: any) {
        console.error('[Practice] Complete nudge error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/practice/log
 * Get practice completion log.
 * Query: { limit?: number }
 */
router.get('/log', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit) || 30;
        const log = await behavioralActivationService.getPracticeLog(userId, limit);
        res.json(log);
    } catch (error: any) {
        console.error('[Practice] Get log error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/practice/summary
 * Aggregated practice dashboard data.
 */
router.get('/summary', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const summary = await behavioralActivationService.getPracticeSummary(userId);
        res.json(summary);
    } catch (error: any) {
        console.error('[Practice] Get summary error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/practice/values/:userId
 * Get another user's values (for team/org/member access).
 * Returns only public-safe fields.
 */
router.get('/values/:userId', authMiddleware, async (req: any, res: any) => {
    try {
        const targetUserId = req.params.userId;
        const result = await behavioralActivationService.getValuesForUser(targetUserId);
        res.json(result);
    } catch (error: any) {
        console.error('[Practice] Get shared values error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
