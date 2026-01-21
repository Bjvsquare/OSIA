/**
 * Refinement API Routes
 * 
 * Endpoints for the Blueprint Refinement & Data Feedback Loop system.
 * These power the Patterns feedback, Protocol thought experiments,
 * and the Blueprint Refinement Centre.
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { thoughtExperimentService } from '../services/ThoughtExperimentService';
import { snapshotCascadeService } from '../services/SnapshotCascadeService';

const router = Router();

// ============================================================================
// GET CURRENT BLUEPRINT WITH FRESHNESS DATA
// ============================================================================

router.get('/current', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const blueprint = await thoughtExperimentService.getCurrentBlueprint(userId);
        res.json(blueprint);
    } catch (error: any) {
        console.error('[Refinement] Get current error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET THOUGHT EXPERIMENT QUESTION FOR A LAYER
// ============================================================================

router.get('/question/:layerId', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const layerId = parseInt(req.params.layerId);

        if (isNaN(layerId) || layerId < 1 || layerId > 15) {
            return res.status(400).json({ error: 'Layer ID must be between 1 and 15.' });
        }

        const experiment = await thoughtExperimentService.generateQuestion(userId, layerId);
        res.json(experiment);
    } catch (error: any) {
        console.error('[Refinement] Generate question error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// SUBMIT THOUGHT EXPERIMENT RESPONSE
// ============================================================================

router.post('/submit', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { experimentId, answer } = req.body;

        if (!experimentId || !answer) {
            return res.status(400).json({ error: 'experimentId and answer are required.' });
        }

        if (answer.trim().length < 2) {
            return res.status(400).json({ error: 'Please provide a more reflective answer.' });
        }

        const result = await thoughtExperimentService.processResponse(userId, experimentId, answer);
        res.json(result);
    } catch (error: any) {
        console.error('[Refinement] Submit response error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// COMPLETE REFINEMENT SESSION — TRIGGER CASCADE
// ============================================================================

router.post('/complete', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const cascade = await snapshotCascadeService.cascadeUpdate(userId);
        res.json(cascade);
    } catch (error: any) {
        console.error('[Refinement] Complete session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET REFINEMENT HISTORY
// ============================================================================

router.get('/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const history = await thoughtExperimentService.getRefinementHistory(userId, limit);
        res.json(history);
    } catch (error: any) {
        console.error('[Refinement] History error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
