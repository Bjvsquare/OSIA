import express from 'express';
import { lifeAreaService, LIFE_AREA_DOMAINS, LifeAreaDomain } from '../services/LifeAreaService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   Life Area Routes — /api/life-areas
   
   All routes require authentication.
   ═══════════════════════════════════════════════════════════ */

/**
 * GET /api/life-areas
 * Get all 7 life areas for the current user.
 */
router.get('/', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const areas = await lifeAreaService.getAll(userId);
        res.json({ areas });
    } catch (error: any) {
        console.error('[LifeArea] Get all error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/life-areas/dashboard
 * Aggregated dashboard payload for the home screen.
 */
router.get('/dashboard', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const summary = await lifeAreaService.getDashboardSummary(userId);
        res.json(summary);
    } catch (error: any) {
        console.error('[LifeArea] Dashboard error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/life-areas/:domain/score
 * Update health score for a specific life area.
 * Body: { score: number (1-10) }
 */
router.patch('/:domain/score', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const domain = req.params.domain as LifeAreaDomain;
        const { score } = req.body;

        if (!LIFE_AREA_DOMAINS.includes(domain)) {
            return res.status(400).json({ error: `Invalid domain: ${domain}` });
        }
        if (typeof score !== 'number' || score < 1 || score > 10) {
            return res.status(400).json({ error: 'Score must be a number between 1 and 10' });
        }

        const area = await lifeAreaService.updateScore(userId, domain, score);
        res.json({ area });
    } catch (error: any) {
        console.error('[LifeArea] Update score error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/life-areas/:domain/focus
 * Toggle active focus and optionally set a goal.
 * Body: { isActive: boolean, goal?: string, goalDeadline?: string }
 */
router.patch('/:domain/focus', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const domain = req.params.domain as LifeAreaDomain;
        const { isActive, goal, goalDeadline } = req.body;

        if (!LIFE_AREA_DOMAINS.includes(domain)) {
            return res.status(400).json({ error: `Invalid domain: ${domain}` });
        }

        const area = await lifeAreaService.setFocus(userId, domain, isActive, goal, goalDeadline);
        res.json({ area });
    } catch (error: any) {
        console.error('[LifeArea] Set focus error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/life-areas/:domain/activity
 * Log an activity.
 * Body: { type: string, details: string }
 */
router.post('/:domain/activity', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const domain = req.params.domain as LifeAreaDomain;
        const { type, details } = req.body;

        if (!LIFE_AREA_DOMAINS.includes(domain)) {
            return res.status(400).json({ error: `Invalid domain: ${domain}` });
        }

        const area = await lifeAreaService.logActivity(userId, domain, type, details);
        res.json({ area });
    } catch (error: any) {
        console.error('[LifeArea] Log activity error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/life-areas/:domain/complete-today
 * Mark the daily micro-commitment as done.
 */
router.post('/:domain/complete-today', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const domain = req.params.domain as LifeAreaDomain;

        if (!LIFE_AREA_DOMAINS.includes(domain)) {
            return res.status(400).json({ error: `Invalid domain: ${domain}` });
        }

        const area = await lifeAreaService.completeOneToday(userId, domain);
        res.json({ area });
    } catch (error: any) {
        console.error('[LifeArea] Complete today error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
