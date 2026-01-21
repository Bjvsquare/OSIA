import { useState, useEffect } from 'react';
import { Zap, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import axios from 'axios';

export function SubscriptionManagement() {
    const [subInfo, setSubInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/subscriptions/current', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubInfo(response.data);
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePortal = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/subscriptions/customer-portal', {
                returnUrl: window.location.href
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err) {
            console.error('Portal error:', err);
            alert('Failed to open billing portal.');
        }
    };

    if (isLoading) return <div className="text-osia-neutral-500 animate-pulse">Synchronizing...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <header>
                <h1 className="text-3xl font-bold text-white">Commercial Status</h1>
                <p className="text-osia-neutral-400 mt-1">Manage your license and deployment parameters.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Current Plan</h3>
                            <div className="text-2xl font-bold capitalize">{subInfo?.subscriptionTier || 'Free Entry'}</div>
                        </div>
                        <div className="bg-osia-teal-500/10 text-osia-teal-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {subInfo?.subscriptionStatus === 'active' ? 'Active' : 'Basic'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-osia-neutral-400">
                            <ShieldCheck size={16} className="text-osia-teal-500" />
                            <span>Full Architecture Access</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-osia-neutral-400">
                            <Zap size={16} className="text-osia-teal-500" />
                            <span>Unlimited Connector Flux</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <Button
                            onClick={handlePortal}
                            className="w-full justify-between group"
                            variant="secondary"
                        >
                            <span>Manage Billing</span>
                            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-8 border-white/5 bg-[#0a1128]/40 flex flex-col justify-center text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center text-osia-neutral-500">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">Certification Status</h4>
                        <p className="text-[10px] text-osia-neutral-500 uppercase tracking-widest mt-1">Not Enrolled</p>
                    </div>
                    <p className="text-xs text-osia-neutral-500 leading-relaxed px-4">
                        Professional practitioners receive certification and advanced client management tools.
                    </p>
                    <Button variant="ghost" className="text-osia-teal-500 text-[10px] uppercase font-bold tracking-widest">Explore Certification</Button>
                </Card>
            </div>
        </div>
    );
}
