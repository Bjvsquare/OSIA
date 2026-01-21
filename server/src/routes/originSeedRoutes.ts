import express from 'express';
import { originSeedService } from '../services/OriginSeedService';
import { auditLogger } from '../services/AuditLogger';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, async (req: any, res) => {
    try {
        const profile = req.body;
        const userId = req.user.id || req.user.userId;
        await originSeedService.saveProfile(userId, profile);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'origin_seed_save',
            status: 'success'
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        console.log(`[OriginSeedAPI] Fetching profile for user: ${userId}`);
        const profile = await originSeedService.getProfile(userId);
        console.log(`[OriginSeedAPI] Profile found: ${!!profile}, Traits: ${profile?.traits?.length || 0}`);
        res.json(profile || {});
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assessment/hypotheses', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const hypotheses = await originSeedService.getHypotheses(userId);
        res.json(hypotheses);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/assessment/refine', authMiddleware, async (req: any, res) => {
    try {
        const { layerId, iteration } = req.body;
        const userId = req.user.id || req.user.userId;
        const refined = await originSeedService.refineHypothesis(userId, layerId, iteration);
        res.json(refined);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/assessment/complete', authMiddleware, async (req: any, res) => {
    try {
        const { traits } = req.body;
        const userId = req.user.id || req.user.userId;
        await originSeedService.finalizeAssessment(userId, traits);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
