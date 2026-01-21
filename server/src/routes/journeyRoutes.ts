import { Router } from 'express';
import { journeyService } from '../services/JourneyService';
import { authMiddleware } from '../middleware/authMiddleware';
import { auditLogger } from '../services/AuditLogger';

const router = Router();

// Get full journey progress
router.get('/progress', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const progress = await journeyService.getJourneyProgress(userId);
        res.json(progress);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's earned badges
router.get('/badges', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const badges = await journeyService.getUserBadges(userId);
        res.json(badges);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's journey level
router.get('/level', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const level = await journeyService.calculateJourneyLevel(userId);
        res.json(level);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all milestone definitions
router.get('/milestones', authMiddleware, async (req: any, res: any) => {
    try {
        const milestones = journeyService.getAllMilestones();
        res.json(milestones);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Check and unlock any earned milestones
router.post('/check-milestones', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const unlocked = await journeyService.checkAndUnlockMilestones(userId);

        if (unlocked.length > 0) {
            await auditLogger.log({
                userId,
                username: req.user.username,
                action: 'unlock_milestone',
                status: 'success',
                details: { unlockedMilestones: unlocked.map(m => m.milestoneId) }
            });
        }

        res.json({
            success: true,
            unlockedCount: unlocked.length,
            unlocked
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Manually unlock a specific milestone (admin/debug)
router.post('/milestones/:id/unlock', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const milestone = await journeyService.unlockMilestone(userId, req.params.id);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'unlock_milestone',
            status: 'success',
            details: { milestoneId: req.params.id }
        });

        res.json(milestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get subscription credits for current billing period
router.get('/credits', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const credits = await journeyService.getSubscriptionCredits(userId);
        res.json(credits);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Log an activity (called from various platform actions)
router.post('/activity', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { type, metadata } = req.body;

        const activity = await journeyService.logActivity(userId, type, metadata);
        res.json(activity);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get credit values and discount tiers (for UI display)
router.get('/credit-info', authMiddleware, async (req: any, res: any) => {
    try {
        res.json({
            creditValues: journeyService.getCreditValues(),
            discountTiers: journeyService.getDiscountTiers()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
