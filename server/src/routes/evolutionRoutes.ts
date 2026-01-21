/**
 * Evolution Routes — v1.0
 * 
 * API endpoints for OSIA evolution and reflection features.
 */

import { Router } from 'express';
import { osiaEvolutionService } from '../services/OSIAEvolutionService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/evolution/timeline
 * Get user's OSIA evolution timeline
 */
router.get('/timeline', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit as string) || 10;

        const timeline = await osiaEvolutionService.getEvolutionTimeline(userId, limit);

        if (!timeline) {
            return res.json({
                snapshots: [],
                patternChanges: [],
                themeEvolution: [],
                overallGrowth: {
                    overallProgress: 0,
                    stabilityGrowth: 0,
                    newPatternsDiscovered: 0,
                    areasOfImprovement: [],
                    areasNeedingAttention: []
                }
            });
        }

        res.json(timeline);
    } catch (error: any) {
        console.error('[Evolution] Timeline error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/evolution/reflection
 * Get reflection insights comparing past and present self
 */
router.get('/reflection', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;

        const reflection = await osiaEvolutionService.getReflectionInsights(userId);

        if (!reflection) {
            return res.json({
                pastSelf: 'Continue using Sentari to build your baseline profile.',
                presentSelf: 'Your journey is just beginning.',
                keyEvolutions: [],
                nextStepsGuidance: [
                    'Complete protocols regularly to track your growth',
                    'Connect with others to gain relational insights',
                    'Refine your Blueprint through recalibration sessions'
                ]
            });
        }

        res.json(reflection);
    } catch (error: any) {
        console.error('[Evolution] Reflection error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/evolution/next-steps
 * Get personalized next step recommendations
 */
router.get('/next-steps', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;

        const recommendations = await osiaEvolutionService.getNextStepRecommendations(userId);

        res.json({ recommendations });
    } catch (error: any) {
        console.error('[Evolution] Next steps error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
