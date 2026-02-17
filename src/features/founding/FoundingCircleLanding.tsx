import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, Users, Shield, Zap, CheckCircle2, Copy, Check, Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';

export function FoundingCircleLanding() {
    const [email, setEmail] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [queueNumber, setQueueNumber] = useState<number | null>(null);
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.joinFoundingCircle({ email, referralSource });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join waitlist');
            }

            setQueueNumber(data.queueNumber);
            setAccessCode(data.accessCode || null);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900">
            {/* ── Fixed Header ───────────────────────────────── */}
            <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-500 ${scrolled ? 'backdrop-blur-xl bg-osia-deep-900/80 border-b border-white/5 shadow-2xl' : ''}`}>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="OSIA" className="h-5 w-auto" />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-500">
                    <a href="#benefits" className="hover:text-osia-teal-500 transition-colors">What is OSIA</a>
                    <a href="#join" className="hover:text-osia-teal-500 transition-colors">Founding Circle</a>
                </nav>

                {/* Desktop CTAs */}
                <div className="hidden md:flex items-center gap-3">
                    <Button
                        onClick={() => window.location.href = '/login'}
                        variant="secondary"
                        className="px-5 py-2 text-[10px] uppercase font-bold tracking-widest border-white/10 hover:border-white/20"
                    >
                        Sign In
                    </Button>
                    <button
                        onClick={() => window.location.href = '/signup'}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-[10px] uppercase font-bold tracking-widest hover:opacity-90 transition-opacity"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-white/50 hover:text-white/80 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[60px] left-0 right-0 z-40 backdrop-blur-xl bg-osia-deep-900/95 border-b border-white/5 px-6 py-6 space-y-4 md:hidden"
                    >
                        <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white/60 hover:text-osia-teal-400 transition-colors py-2">
                            What is OSIA
                        </a>
                        <a href="#join" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white/60 hover:text-osia-teal-400 transition-colors py-2">
                            Founding Circle
                        </a>
                        <div className="border-t border-white/5 pt-4 space-y-3">
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full py-2.5 rounded-lg border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white/80 transition-all"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => window.location.href = '/signup'}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                            >
                                Sign Up
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Body ───────────────────────────────────────── */}
            <div className="flex items-center justify-center p-6 pt-24 min-h-screen">
                <div className="max-w-4xl w-full space-y-12">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Sparkles className="w-8 h-8 text-osia-teal-500" />
                            <h1 className="text-6xl font-black text-white tracking-tighter">
                                Founding Circle
                            </h1>
                        </div>
                        <p className="text-xl text-osia-neutral-400 max-w-2xl mx-auto">
                            Be among the first 150 pioneers to shape the future of OSIA
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!submitted ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8"
                            >
                                {/* Benefits Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { icon: Shield, title: 'Exclusive Access', desc: 'First to experience OSIA' },
                                        { icon: Users, title: 'Shape Development', desc: 'Direct influence on features' },
                                        { icon: Zap, title: 'Founding Badge', desc: 'Lifetime recognition' }
                                    ].map((benefit, i) => (
                                        <motion.div
                                            key={benefit.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Card className="p-6 bg-white/5 border-white/10 text-center space-y-3 hover:bg-white/[0.08] transition-colors">
                                                <div className="flex justify-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-osia-teal-500/10 flex items-center justify-center">
                                                        <benefit.icon className="w-6 h-6 text-osia-teal-500" />
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-white">{benefit.title}</h3>
                                                <p className="text-sm text-osia-neutral-500">{benefit.desc}</p>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Signup Form */}
                                <Card className="p-10 bg-white/[0.02] border-white/10 backdrop-blur-xl">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white uppercase tracking-widest">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-osia-neutral-500" size={20} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white placeholder-osia-neutral-600 focus:border-osia-teal-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white uppercase tracking-widest">
                                                How did you hear about us? (Optional)
                                            </label>
                                            <select
                                                value={referralSource}
                                                onChange={(e) => setReferralSource(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-osia-teal-500 focus:outline-none transition-colors [&>option]:bg-osia-deep-900 [&>option]:text-white"
                                            >
                                                <option value="">Select one...</option>
                                                <option value="twitter">Twitter</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="friend">Friend referral</option>
                                                <option value="search">Search engine</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="w-full py-6 text-sm font-black uppercase tracking-widest"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Joining...' : 'Join the Founding Circle'}
                                        </Button>
                                    </form>
                                </Card>

                                {/* Footer Note */}
                                <p className="text-center text-xs text-osia-neutral-600 uppercase tracking-widest">
                                    Limited to 150 founding members • No spam, ever
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="p-12 bg-osia-teal-500/5 border-osia-teal-500/20 text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="w-20 h-20 rounded-full bg-osia-teal-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-osia-teal-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-white">Welcome to the Founding Circle!</h2>
                                        <p className="text-osia-neutral-400">
                                            You're in the queue. We'll notify you when it's your turn.
                                        </p>
                                    </div>

                                    <div className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="text-sm font-bold text-osia-neutral-500 uppercase tracking-widest mb-1">
                                            Your Position
                                        </div>
                                        <div className="text-5xl font-black text-osia-teal-500">
                                            #{queueNumber}
                                        </div>
                                    </div>

                                    {accessCode && (
                                        <div className="space-y-3">
                                            <div className="text-sm font-bold text-osia-neutral-500 uppercase tracking-widest">
                                                Your Access Code
                                            </div>
                                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-osia-purple-500/10 border border-osia-purple-500/30 rounded-2xl">
                                                <span className="text-2xl font-mono font-black text-osia-purple-300 tracking-wider">
                                                    {accessCode}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(accessCode);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                    title="Copy code"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-osia-neutral-400" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-sm text-osia-neutral-500">
                                                Save this code — you'll need it to create your account.
                                            </p>
                                        </div>
                                    )}

                                    {queueNumber && queueNumber <= 150 && !accessCode && (
                                        <div className="p-4 bg-osia-purple-500/10 border border-osia-purple-500/20 rounded-xl">
                                            <p className="text-sm text-osia-purple-300 font-bold">
                                                🎉 You're in the first 150! Check your email for your access code.
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-sm text-osia-neutral-500">
                                        We've also sent a confirmation to <span className="text-white font-bold">{email}</span>
                                    </p>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
