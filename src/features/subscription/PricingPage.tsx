import { motion } from 'framer-motion';
import { Check, Shield, Code, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const tiers = [
    {
        name: 'Entry',
        price: 'Free',
        description: 'Instant identity value and foundational layers.',
        features: [
            '3 foundational layers',
            'Basic symbolic twin',
            '1 connector comparison',
            'Relational highlight summary'
        ],
        cta: 'Get Started',
        variant: 'free'
    },
    {
        name: 'Core',
        price: '$29',
        priceSuffix: '/mo',
        description: 'Convert curiosity into deep consistency.',
        features: [
            'Full 15-layer unlock path',
            'Evolving symbolic twin',
            'Unlimited connectors',
            'Growth dashboard',
            'Weekly insight cycles',
            '7-day free trial'
        ],
        cta: 'Start 7-Day Trial',
        variant: 'core',
        highlight: true,
        priceId: 'price_core_monthly' // Replace with real Stripe Price ID
    },
    {
        name: 'Pro',
        price: '$299',
        priceSuffix: '/yr',
        description: 'Monetize professional use and certification.',
        features: [
            'Multi-profile management',
            'Professional dashboard',
            'Group chemistry reports',
            'Exportable client reports',
            'Certification L1'
        ],
        cta: 'Go Pro',
        variant: 'pro',
        priceId: 'price_pro_annual_starter'
    }
];

export function PricingPage() {
    const { userProfile, auth } = useAuth();
    const currentTier = userProfile?.subscriptionTier || 'free';

    const tierMapping: Record<string, string> = {
        'Entry': 'free',
        'Core': 'core',
        'Pro': 'pro',
        'Teams / Enterprise': 'teams',
        'API Infrastructure': 'api'
    };

    const handleSubscription = async (priceId: string, tierName?: string) => {
        if (!auth.isAuthenticated) {
            window.location.href = '/signup';
            return;
        }

        // Handle Free/Entry tier
        if (tierName === 'Entry' || !priceId) {
            window.location.href = '/home'; // Or some other appropriate action for "Free"
            return;
        }

        try {
            const token = auth.token;
            const response = await axios.post('/api/subscriptions/create-checkout-session', {
                priceId,
                successUrl: `${window.location.origin}/home?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/pricing`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err: any) {
            console.error('Subscription error:', err);
            const errorMsg = err.response?.data?.error || err.message;
            alert(`Failed to initiate checkout: ${errorMsg}`);
        }
    };

    const isCurrentPlan = (tierName: string) => {
        const internalTier = tierMapping[tierName] || tierName.toLowerCase();
        return currentTier.toLowerCase() === internalTier.toLowerCase();
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden pb-20">
            <PlexusBackground />

            <div className="relative z-10 pt-32 container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold tracking-tight mb-6"
                    >
                        Pricing Architecture.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-osia-neutral-400 text-lg"
                    >
                        Choose the depth of your journey. From individual curiosity to professional deployment.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                        >
                            <Card className={`h-full p-8 flex flex-col border-white/5 bg-[#0a1128]/40 hover:border-white/10 transition-all ${tier.highlight ? 'ring-2 ring-osia-teal-500/50 transform scale-105 z-20' : ''}`}>
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-osia-teal-500 mb-2">{tier.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{tier.price}</span>
                                        {tier.priceSuffix && <span className="text-osia-neutral-500 text-sm">{tier.priceSuffix}</span>}
                                    </div>
                                    <p className="text-osia-neutral-500 text-sm mt-4 leading-relaxed">
                                        {tier.description}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-grow">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-osia-neutral-300">
                                            <Check size={16} className="text-osia-teal-500 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={tier.highlight ? 'primary' : 'secondary'}
                                    className="w-full py-4 text-[10px] uppercase font-bold tracking-widest disabled:opacity-50"
                                    onClick={() => handleSubscription(tier.priceId || '', tier.name)}
                                    disabled={isCurrentPlan(tier.name)}
                                >
                                    {isCurrentPlan(tier.name) ? 'Current Plan' : tier.cta}
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Additional Tiers (Teams & API) */}
                <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => handleSubscription('price_team_custom')}
                    >
                        <Card className="p-8 border-white/5 bg-white/[0.02] flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-osia-purple-500/10 flex items-center justify-center text-osia-purple-500">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Teams / Enterprise</h4>
                                    <p className="text-xs text-osia-neutral-500">Department rollout, team dashboards, and predictive analytics.</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} />
                            </Button>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={() => handleSubscription('price_api_usage')}
                    >
                        <Card className="p-8 border-white/5 bg-white/[0.02] flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-500">
                                    <Code size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">API Infrastructure</h4>
                                    <p className="text-xs text-osia-neutral-500">Usage-based billing for human-intelligence integrations.</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} />
                            </Button>
                        </Card>
                    </motion.div>
                </div>

                <div className="mt-20 text-center max-w-2xl mx-auto">
                    <h5 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest mb-4">Ethical Proportionality</h5>
                    <p className="text-xs text-osia-neutral-500 leading-relaxed italic">
                        "OSIA gates advanced tooling and reports, never basic safety or clarity. Data collection is always proportionate to the value returned."
                    </p>
                </div>
            </div>
        </div>
    );
}
