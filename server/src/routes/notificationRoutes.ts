/**
 * Notification Routes — Push subscription management
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { pushNotificationService } from '../services/PushNotificationService';

const router = Router();

// GET VAPID public key
router.get('/vapid-key', authMiddleware, (_req: any, res: any) => {
    const publicKey = pushNotificationService.getVapidPublicKey();
    if (!publicKey) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { subscription } = req.body;

        if (!subscription) {
            return res.status(400).json({ error: 'subscription is required' });
        }

        await pushNotificationService.saveSubscription(userId, subscription);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Notifications] Subscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unsubscribe from push notifications
router.delete('/unsubscribe', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await pushNotificationService.removeSubscription(userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Notifications] Unsubscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check subscription status
router.get('/status', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const hasSubscription = await pushNotificationService.hasSubscription(userId);
        res.json({ subscribed: hasSubscription });
    } catch (error: any) {
        console.error('[Notifications] Status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test notification (development only)
router.post('/test', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const sent = await pushNotificationService.sendToUser(userId, {
            title: '🎯 Test Notification',
            body: 'Push notifications are working!',
            url: '/practice',
        });
        res.json({ sent });
    } catch (error: any) {
        console.error('[Notifications] Test error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ━━━ Nudge Schedule Management ━━━

// GET nudge schedule for current user
router.get('/schedule', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nudges = await pushNotificationService.getNudgeSchedule(userId);
        res.json({ schedule: nudges });
    } catch (error: any) {
        console.error('[Notifications] Schedule GET error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT nudge schedule — save/update nudge time
router.put('/schedule', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { notifyAt, label } = req.body;

        if (!notifyAt || !/^\d{2}:\d{2}$/.test(notifyAt)) {
            return res.status(400).json({ error: 'notifyAt must be in HH:MM format' });
        }

        const schedule = await pushNotificationService.saveNudgeSchedule(userId, notifyAt, label);
        res.json({ success: true, schedule });
    } catch (error: any) {
        console.error('[Notifications] Schedule PUT error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE nudge schedule — disable nudge notifications
router.delete('/schedule', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await pushNotificationService.removeNudgeSchedule(userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Notifications] Schedule DELETE error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
