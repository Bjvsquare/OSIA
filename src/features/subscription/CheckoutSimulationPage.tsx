import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Shield, Lock, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

export function CheckoutSimulationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { auth, refreshProfile } = useAuth();

    const priceId = searchParams.get('priceId') || '';
    const tierName = searchParams.get('tier') || 'Core';
    const amount = tierName === 'Pro' ? '$299' : tierName === 'Core' ? '$29' : '$0';
    const period = tierName === 'Pro' ? '/yr' : '/mo';

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            // Initiate the backend simulation
            const token = auth.token;
            const response = await axios.post('/api/subscriptions/create-checkout-session', {
                priceId,
                successUrl: `${window.location.origin}/home?session_id=sim_${Date.now()}`,
                cancelUrl: `${window.location.origin}/pricing`,
                simulate: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Simulate UI delay for immersive feel
            setTimeout(() => {
                setIsProcessing(false);
                setIsSuccess(true);

                // Final redirect after success animation
                setTimeout(() => {
                    if (response.data.url) {
                        window.location.href = response.data.url;
                    } else {
                        navigate(`/home?session_id=sim_${Date.now()}`);
                    }
                }, 2000);
            }, 3500);
        } catch (err) {
            console.error('Simulation error:', err);
            setIsProcessing(false);
            alert('Simulation sync failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden flex items-center justify-center py-20 px-6">
            <PlexusBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-12"
            >
                {/* Left Side: Order Summary & Brand */}
                <div className="space-y-8">
                    <button
                        onClick={() => navigate('/pricing')}
                        className="flex items-center gap-2 text-osia-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} />
                        Back to Pricing
                    </button>

                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-[0.3em]">Checkout Flow</div>
                        <h1 className="text-4xl font-bold tracking-tight">Syncing Your Identity.</h1>
                        <p className="text-osia-neutral-500 text-sm">Review your selection and establish your financial connection.</p>
                    </div>

                    <Card className="p-8 border-white/5 bg-white/[0.02] space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{tierName} Access</h3>
                                <p className="text-xs text-osia-neutral-500">Subscription Tier</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-osia-teal-500">{amount}</div>
                                <p className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">{period}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-osia-neutral-500">Subtotal</span>
                                <span>{amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-osia-neutral-500">Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2">
                                <span>Total Due</span>
                                <span className="text-osia-teal-500">{amount}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Lock size={12} />
                            Encrypted
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={12} />
                            Verified
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Logic */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {!isProcessing && !isSuccess ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* Visual Credit Card Placeholder */}
                                <div className="relative aspect-[1.6/1] w-full rounded-2xl overflow-hidden shadow-2xl group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-osia-teal-500/20 via-[#0a1128] to-osia-purple-500/20" />
                                    <div className="absolute inset-0 backdrop-blur-3xl border border-white/10 p-8 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="text-2xl font-bold tracking-tighter opacity-80">OSIA</div>
                                            <div className="w-12 h-8 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                                                <div className="w-full h-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-xl font-mono tracking-[0.2em] text-white/90">
                                                {formData.cardNumber || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Card Holder</div>
                                                    <div className="text-sm font-medium uppercase tracking-widest truncate max-w-[150px]">
                                                        {formData.cardName || 'YOUR NAME'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Expires</div>
                                                    <div className="text-sm font-mono">{formData.expiry || 'MM/YY'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handlePayment} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest pl-2">Name on Card</label>
                                            <Input
                                                name="cardName"
                                                placeholder="Barend Jansen"
                                                value={formData.cardName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest pl-2">Card Number</label>
                                            <Input
                                                name="cardNumber"
                                                placeholder="4920 0802 4567 3128"
                                                value={formData.cardNumber}
                                                onChange={e => {
                                                    const v = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                                                    setFormData(prev => ({ ...prev, cardNumber: v.slice(0, 19) }));
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest pl-2">Expiry</label>
                                                <Input
                                                    name="expiry"
                                                    placeholder="MM/YY"
                                                    value={formData.expiry}
                                                    onChange={e => {
                                                        const v = e.target.value.replace(/\D/g, '');
                                                        if (v.length <= 4) {
                                                            const formatted = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
                                                            setFormData(prev => ({ ...prev, expiry: formatted }));
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest pl-2">CVC</label>
                                                <Input
                                                    name="cvc"
                                                    placeholder="•••"
                                                    type="password"
                                                    maxLength={3}
                                                    value={formData.cvc}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full py-6 text-xs font-black uppercase tracking-[0.2em]"
                                    >
                                        Establish Connection
                                    </Button>

                                    <p className="text-[9px] text-osia-neutral-600 text-center leading-relaxed italic">
                                        "Payments are processed through simulated infrastructure. No actual funds will be transferred during this testing phase."
                                    </p>
                                </form>
                            </motion.div>
                        ) : isProcessing ? (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center space-y-8 text-center"
                            >
                                <div className="relative w-32 h-32">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-2 border-osia-teal-500/20 border-t-osia-teal-500"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 size={32} className="text-osia-teal-500 animate-spin" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold">Syncing Financial Identity...</h3>
                                    <p className="text-osia-neutral-500 text-sm">Aligning your OSIA account with secure nodes.</p>
                                </div>
                                <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3.5 }}
                                        className="h-full bg-osia-teal-500 shadow-[0_0_10px_rgba(56,163,165,0.5)]"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center space-y-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="w-24 h-24 rounded-full bg-osia-teal-500 flex items-center justify-center text-osia-deep-900"
                                >
                                    <CheckCircle2 size={48} />
                                </motion.div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-bold">Connection Established.</h3>
                                    <p className="text-osia-neutral-300 text-sm">Your {tierName} access is now active and synced.</p>
                                </div>
                                <p className="text-osia-neutral-500 text-xs mt-12 animate-pulse">Redirecting to your Home view...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
