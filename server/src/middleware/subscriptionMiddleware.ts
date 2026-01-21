import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/UserService';

export const requireSubscription = (tier: 'free' | 'core' | 'pro' | 'teams' = 'core') => {
    return async (req: any, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const user = await userService.getProfile(userId);
            const userTier = user.subscriptionTier || 'free';

            const tierOrder = ['free', 'core', 'pro', 'teams', 'enterprise'];
            const userTierIndex = tierOrder.indexOf(userTier);
            const requiredTierIndex = tierOrder.indexOf(tier);

            if (userTierIndex >= requiredTierIndex) {
                return next();
            }

            res.status(403).json({
                error: 'Upgrade required',
                requiredTier: tier,
                currentTier: userTier
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
};
