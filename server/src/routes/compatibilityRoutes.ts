/**
 * Compatibility Routes — v1.0
 * 
 * API endpoints for user-to-user OSIA comparisons.
 */

import express, { Request, Response } from 'express';
import { compatibilityService } from '../services/CompatibilityService';
import { aiCreditsService } from '../services/AICreditsService';
import { authMiddleware } from '../middleware/authMiddleware';

// Extended Request type with user property
interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**

 * GET /api/compatibility/:userId
 * Get quick compatibility score with another user (free)
 */
router.get('/:userId', async (req: AuthRequest, res: express.Response) => {
    try {
        const currentUserId = req.user?.id;
        const targetUserId = req.params.userId as string;

        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }


        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: 'Cannot calculate compatibility with yourself' });
        }

        // Try to get cached score first
        let score = await compatibilityService.getStoredScore(currentUserId, targetUserId);

        // Calculate fresh score if not cached or older than 7 days
        if (!score || isStale(score.calculatedAt, 7)) {
            score = await compatibilityService.calculateQuickScore(currentUserId, targetUserId);
        }

        if (!score) {
            return res.status(404).json({ error: 'Could not calculate compatibility. One or both users may not have OSIA data.' });
        }

        res.json(score);
    } catch (error: any) {
        console.error('[CompatibilityAPI] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/compatibility/analyze
 * Generate deep AI analysis (costs credits)
 * Body: { targetUserId: string }
 */
router.post('/analyze', async (req: AuthRequest, res: express.Response) => {
    try {
        const currentUserId = req.user?.id;
        const { targetUserId } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId is required' });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: 'Cannot analyze compatibility with yourself' });
        }

        // Check credits before generating
        const creditCheck = await aiCreditsService.canGenerate(currentUserId, 'relational_analysis');
        if (!creditCheck.allowed) {
            return res.status(402).json({
                error: 'Insufficient credits',
                reason: creditCheck.reason,
                creditsRequired: creditCheck.creditsRequired
            });
        }

        const analysis = await compatibilityService.generateDeepAnalysis(
            currentUserId,
            currentUserId,
            targetUserId
        );

        if (!analysis) {
            return res.status(500).json({ error: 'Failed to generate analysis' });
        }

        res.json(analysis);
    } catch (error: any) {
        console.error('[CompatibilityAPI] Analyze error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/compatibility/credits/status
 * Get current user's credit status
 */
router.get('/credits/status', async (req: AuthRequest, res: express.Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const credits = await aiCreditsService.getUserCredits(userId);

        res.json({
            totalCredits: credits.totalCredits,
            usedCredits: credits.usedCredits,
            availableCredits: credits.totalCredits - credits.usedCredits,
            freeGenerationUsed: credits.freeGenerationUsed,
            tier: credits.tier,
            generationCount: credits.generationHistory.length
        });
    } catch (error: any) {
        console.error('[CompatibilityAPI] Credits error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper: Check if a date is stale (older than N days)
 */
function isStale(dateStr: string, days: number): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > days;
}

export default router;
