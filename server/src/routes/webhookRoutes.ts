import { Router, Request, Response } from 'express';
import express from 'express';
import { stripeService } from '../services/StripeService';

const router = Router();

// Stripe webhooks require the raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    try {
        await stripeService.handleWebhook(sig, req.body);
        res.json({ received: true });
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

export default router;
