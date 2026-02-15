import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        period: 'forever',
        features: ['Personal Blueprint', 'Core Layer Insights', 'Basic Experiments', 'Privacy Controls'],
        current: true,
        cta: 'Current Plan'
    },
    {
        id: 'core',
        name: 'Core',
        price: '$9',
        period: '/month',
        features: ['Everything in Free', 'Advanced Layers', 'Relational Shared Views', 'Weekly Micro-Experiments', 'Priority Support'],
        highlight: true,
        cta: 'Upgrade to Core',
        priceId: 'price_core_monthly'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        period: '/month',
        features: ['Everything in Core', 'Team Dashboard', 'Org Culture Mapping', 'API Access', 'Custom Integrations'],
        cta: 'Upgrade to Pro',
        priceId: 'price_pro_monthly'
    }
];

export function SubscriptionManagement() {
    const [subInfo, setSubInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const data = await api.getSubscription();
            setSubInfo(data);
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpgrade = async (priceId: string, tierName: string) => {
        setUpgrading(tierName);
        try {
            const data = await api.createCheckout(priceId);
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setUpgrading(null);
        }
    };

    const handlePortal = async () => {
        try {
            const data = await api.openBillingPortal();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Portal error:', err);
            alert('Failed to open billing portal.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-osia-neutral-500 animate-pulse text-sm">Loading subscription data...</div>
            </div>
        );
    }

    const currentTier = subInfo?.subscriptionTier || 'free';

    return (
        <div className="space-y-10 max-w-5xl">
            <header>
                <h1 className="text-3xl font-bold text-white">Subscription</h1>
                <p className="text-osia-neutral-400 mt-1">Manage your plan and billing.</p>
            </header>

            {/* Current Plan Banner */}
            {subInfo?.subscriptionStatus === 'active' && currentTier !== 'free' && (
                <Card className="p-6 border-osia-teal-500/20 bg-osia-teal-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-osia-teal-500/10 flex items-center justify-center">
                            <Crown size={20} className="text-osia-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white capitalize">{currentTier} Plan</h3>
                            <p className="text-xs text-osia-neutral-400">Active subscription</p>
                        </div>
                    </div>
                    <Button onClick={handlePortal} variant="secondary" className="text-xs gap-2">
                        Manage Billing <ExternalLink size={14} />
                    </Button>
                </Card>
            )}

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {PRICING_TIERS.map((tier) => {
                    const isCurrent = currentTier === tier.id;
                    const isHighlight = tier.highlight;

                    return (
                        <Card
                            key={tier.id}
                            className={`p-8 relative overflow-hidden transition-all ${isHighlight
                                ? 'border-osia-teal-500/30 bg-gradient-to-b from-osia-teal-500/5 to-transparent'
                                : 'border-white/5 bg-[#0a1128]/40'
                                }`}
                        >
                            {isHighlight && (
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-osia-teal-500 to-transparent" />
                            )}

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold">{tier.name}</h3>
                                        {isCurrent && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest bg-osia-teal-500/10 text-osia-teal-400 px-2 py-0.5 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{tier.price}</span>
                                        <span className="text-osia-neutral-500 text-sm">{tier.period}</span>
                                    </div>
                                </div>

                                <ul className="space-y-3">
                                    {tier.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-sm text-osia-neutral-400">
                                            <Sparkles size={12} className="text-osia-teal-500 shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-2">
                                    {isCurrent ? (
                                        <Button variant="ghost" className="w-full text-osia-neutral-500 cursor-default" disabled>
                                            Current Plan
                                        </Button>
                                    ) : tier.priceId ? (
                                        <Button
                                            variant={isHighlight ? 'primary' : 'secondary'}
                                            className="w-full group"
                                            onClick={() => handleUpgrade(tier.priceId!, tier.name)}
                                            disabled={upgrading === tier.name}
                                        >
                                            {upgrading === tier.name ? 'Loading...' : tier.cta}
                                            {upgrading !== tier.name && <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Certification */}
            <Card className="p-8 border-white/5 bg-[#0a1128]/40 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center text-osia-neutral-500 shrink-0">
                    <Calendar size={28} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold">Practitioner Certification</h4>
                    <p className="text-xs text-osia-neutral-500 mt-1 leading-relaxed max-w-md">
                        Professional practitioners receive certification and advanced client management tools. Coming soon.
                    </p>
                </div>
                <Button variant="ghost" className="text-osia-teal-500 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                    Learn More
                </Button>
            </Card>
        </div>
    );
}
