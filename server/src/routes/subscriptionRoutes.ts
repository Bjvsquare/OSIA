import { Router, Request, Response } from 'express';
import { stripeService } from '../services/StripeService';
import { userService } from '../services/UserService';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';

const router = Router();

// Middleware to get user from token
const authenticate = (req: any, res: Response, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/create-checkout-session', authenticate, async (req: any, res: Response) => {
    const { priceId, successUrl, cancelUrl, simulate } = req.body;
    const userId = req.user.id;

    try {
        const session = await stripeService.createCheckoutSession(userId, priceId, successUrl, cancelUrl, simulate);
        res.json({ url: session.url });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/customer-portal', authenticate, async (req: any, res: Response) => {
    const { returnUrl } = req.body;
    const userId = req.user.id;

    try {
        const session = await stripeService.createCustomerPortalSession(userId, returnUrl);
        res.json({ url: session.url });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/current', authenticate, async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
        const user = await userService.getProfile(userId);
        res.json({
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
            onboardingCompleted: user.onboardingCompleted
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
