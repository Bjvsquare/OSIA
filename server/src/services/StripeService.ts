import Stripe from 'stripe';
import dotenv from 'dotenv';
import { userService } from './UserService';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2025-01-27.acacia' as any,
}) : null;

export class StripeService {
    private static instance: StripeService;

    private constructor() { }

    public static getInstance(): StripeService {
        if (!StripeService.instance) {
            StripeService.instance = new StripeService();
        }
        return StripeService.instance;
    }

    private getStripe() {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.');
        }
        return stripe;
    }

    async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string, simulate: boolean = false) {
        const logFile = require('path').join(process.cwd(), 'server-vital-signs.log');
        const log = (msg: string) => require('fs').appendFileSync(logFile, `[${new Date().toISOString()}] [StripeService] ${msg}\n`);

        log(`createCheckoutSession called: userId=${userId}, priceId=${priceId}, simulate=${simulate}`);

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
        const isPlaceholder = stripeSecretKey.includes('placeholder');

        if (isPlaceholder) {
            log(`Using simulated checkout. priceId=${priceId}`);

            const lowerPriceId = (priceId || '').toLowerCase();
            const tier = lowerPriceId.includes('core') ? 'core' :
                lowerPriceId.includes('pro') ? 'pro' :
                    lowerPriceId.includes('team') ? 'teams' :
                        lowerPriceId.includes('api') ? 'api' : 'free';

            if (simulate) {
                // If called from the Simulation Page, do the actual update
                log(`[SIMULATION] Triggering final update for user ${userId} to tier ${tier}`);
                await userService.updateSubscription(userId, {
                    subscriptionId: `sim_sub_${Date.now()}`,
                    subscriptionStatus: 'active',
                    subscriptionTier: tier
                });
                return { url: successUrl.replace('{CHECKOUT_SESSION_ID}', `sim_session_${Date.now()}`) };
            }

            // Otherwise, redirect to the simulation page
            const displayTier = tier.charAt(0).toUpperCase() + tier.slice(1);
            const simUrl = `/checkout/simulation?priceId=${priceId}&tier=${displayTier}`;
            return { url: simUrl };
        }

        const stripeClient = this.getStripe();
        const user = await userService.getProfile(userId);

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripeClient.customers.create({
                email: user.username,
                metadata: { userId }
            });
            customerId = customer.id;
            await userService.updateSubscription(userId, { stripeCustomerId: customerId });
        }

        // Determine if this is a trial tier (e.g., Core)
        const isTrialTier = priceId.includes('core');

        // Define metadata for the subscription
        const tier = priceId.includes('core') ? 'core' :
            priceId.includes('pro') ? 'pro' :
                priceId.includes('team') ? 'teams' : 'free';

        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            automatic_payment_methods: {
                enabled: true,
            },
            subscription_data: {
                trial_period_days: isTrialTier ? 7 : undefined,
                metadata: { userId, tier }
            },
            metadata: { userId, tier }
        } as any);

        return session;
    }

    async createCustomerPortalSession(userId: string, returnUrl: string) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
        if (stripeSecretKey.includes('placeholder')) {
            console.log(`[StripeService] Using simulated portal for placeholder key.`);
            return { url: returnUrl };
        }

        const stripeClient = this.getStripe();
        const user = await userService.getProfile(userId);
        if (!user.stripeCustomerId) {
            throw new Error('User has no stripe customer id');
        }

        const session = await stripeClient.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl,
        });

        return session;
    }

    async handleWebhook(sig: string, payload: Buffer) {
        const stripeClient = this.getStripe();
        let event: Stripe.Event;

        try {
            event = stripeClient.webhooks.constructEvent(
                payload,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET || ''
            );
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || 'core';
        const subscriptionId = session.subscription as string;

        if (userId) {
            await userService.updateSubscription(userId, {
                subscriptionId,
                subscriptionStatus: 'active',
                subscriptionTier: tier
            });
            console.log(`[StripeService] Checkout completed for user ${userId} with tier ${tier}`);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const userId = subscription.metadata.userId;
        const tier = subscription.metadata.tier || 'core';
        if (userId) {
            const status = subscription.status;
            await userService.updateSubscription(userId, {
                subscriptionStatus: status,
                subscriptionTier: status === 'active' || status === 'trialing' ? tier : 'free'
            });
            console.log(`[StripeService] Subscription updated for user ${userId} to ${status} (${tier})`);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const userId = subscription.metadata.userId;
        if (userId) {
            await userService.updateSubscription(userId, {
                subscriptionStatus: 'canceled',
                subscriptionTier: 'free',
                subscriptionId: undefined
            });
            console.log(`[StripeService] Subscription deleted for user ${userId}`);
        }
    }
}

export const stripeService = StripeService.getInstance();
