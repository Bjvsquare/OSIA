import express from 'express';
import { realtimeService } from '../services/RealtimeService';
import { authMiddleware } from '../middleware/authMiddleware';
import { userService } from '../services/UserService';

const router = express.Router();

// GET /api/realtime/session
router.get('/session', authMiddleware, async (req: any, res: any) => {
    const voice = (req.query.voice as string) || 'verse';
    const userId = req.user.id;

    console.log(`[RealtimeRoute] Received request for session token (user: ${userId}, voice: ${voice})`);

    try {
        // Verify User Tier
        const user = await userService.getProfile(userId);
        if (user.subscriptionTier !== 'pro') {
            console.warn(`[RealtimeRoute] Access denied: User ${userId} is on ${user.subscriptionTier} tier.`);
            return res.status(403).json({
                error: 'Premium Feature',
                details: 'Realtime Voice Interaction requires a Pro subscription.'
            });
        }

        const session = await realtimeService.createSessionToken(voice);
        console.log('[RealtimeRoute] Session token created successfully');
        res.json(session);
    } catch (error: any) {
        console.error('[RealtimeRoute] Error:', error.message);
        res.status(500).json({
            error: 'Failed to create realtime session',
            details: error.message
        });
    }
});

export default router;
