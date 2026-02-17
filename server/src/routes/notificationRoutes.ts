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

export default router;
