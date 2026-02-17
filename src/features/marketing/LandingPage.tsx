import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Layers, Brain, MessageSquare, Shield, Eye, Sparkles, ArrowRight, ChevronDown, Menu, X } from 'lucide-react';

export function LandingPage() {
    const [email, setEmail] = useState('');
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/auth/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (response.ok) {
                setJoined(true);
            } else {
                alert('Connection to Founding Circle failed. Please try again.');
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            alert('Service unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const fadeUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            {/* ── Header ─────────────────────────────────────────── */}
            <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-500 ${scrolled ? 'backdrop-blur-xl bg-osia-deep-900/80 border-b border-white/5 shadow-2xl' : ''}`}>
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="OSIA" className="h-5 w-auto" />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-500">
                    <a href="#how-it-works" className="hover:text-osia-teal-500 transition-colors">What is OSIA</a>
                    <a href="#founding-circle" className="hover:text-osia-teal-500 transition-colors">Founding Circle</a>
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

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[60px] left-0 right-0 z-40 backdrop-blur-xl bg-osia-deep-900/95 border-b border-white/5 px-6 py-6 space-y-4 md:hidden"
                    >
                        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white/60 hover:text-osia-teal-400 transition-colors py-2">
                            What is OSIA
                        </a>
                        <a href="#founding-circle" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white/60 hover:text-osia-teal-400 transition-colors py-2">
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

            <main className="relative z-10 pt-28">
                {/* ── Hero Section ─────────────────────────────────── */}
                <section className="container mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-4xl space-y-8"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-osia-teal-500/15 to-purple-500/10 border border-osia-teal-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-teal-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-osia-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-osia-teal-500" />
                            </span>
                            <span>Founding Circle — 150 Members</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
                            <span className="block">Know your patterns.</span>
                            <span className="bg-gradient-to-r from-osia-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                                Change your conversations.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-osia-neutral-400 max-w-2xl mx-auto leading-relaxed">
                            OSIA builds a living map of how you think, relate, and grow — then gives you
                            micro-experiments you can use <em>today</em>.
                        </p>

                        {/* Trust markers */}
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-600">
                            {['Consent-first', 'No scraping', 'Delete anytime', 'You own your data'].map((t, i) => (
                                <span key={i} className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-osia-teal-500/60" />
                                    {t}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="pt-8 flex flex-col items-center gap-5">
                            {!joined ? (
                                <form onSubmit={handleJoin} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-black/40 border-white/10 py-5 text-base flex-1"
                                    />
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="px-8 py-5 text-sm whitespace-nowrap font-bold tracking-wide group"
                                        disabled={loading}
                                    >
                                        {loading ? 'Joining...' : 'Request Access'}
                                        {!loading && <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                                    </Button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-gradient-to-r from-osia-teal-500/10 to-cyan-500/5 border border-osia-teal-500/20"
                                >
                                    <p className="text-osia-teal-400 font-bold text-lg">You're in the circle.</p>
                                    <p className="text-osia-neutral-500 text-sm mt-1">We'll email you when your access window opens.</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="mt-20"
                    >
                        <a href="#how-it-works" className="flex flex-col items-center gap-2 text-osia-neutral-600 hover:text-osia-neutral-400 transition-colors">
                            <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Explore</span>
                            <ChevronDown size={16} className="animate-bounce" />
                        </a>
                    </motion.div>
                </section>

                {/* ── How It Works ────────────────────────────────── */}
                <section id="how-it-works" className="py-32 border-y border-white/5 scroll-mt-28 bg-gradient-to-b from-black/40 to-transparent">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <motion.div {...fadeUp} className="text-center space-y-4 mb-20">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three layers. One living map.</h2>
                            <p className="text-osia-neutral-500 max-w-xl mx-auto">
                                OSIA doesn't label you. It listens to the signals you share and builds a layered understanding that evolves with you.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Eye,
                                    step: '01',
                                    title: 'Share your signals',
                                    desc: 'Choose what to share — from reflection prompts to birth data to team feedback. Every input is consent-based.',
                                    color: 'osia-teal'
                                },
                                {
                                    icon: Layers,
                                    step: '02',
                                    title: 'See your patterns',
                                    desc: 'OSIA maps your signals into layers — energy, cognition, relational style — showing how you naturally operate.',
                                    color: 'cyan'
                                },
                                {
                                    icon: Sparkles,
                                    step: '03',
                                    title: 'Run micro-experiments',
                                    desc: 'Get practical prompts tailored to your patterns. Try one today, see what shifts, and watch your map evolve.',
                                    color: 'purple'
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: i * 0.15 }}
                                >
                                    <Card className="p-8 border-white/5 bg-[#0a1128]/40 backdrop-blur-lg h-full relative overflow-hidden group hover:border-white/10 transition-all duration-500">
                                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-osia-teal-500/5 to-transparent blur-2xl group-hover:opacity-100 opacity-50 transition-opacity" />
                                        <div className="relative space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center`}>
                                                    <item.icon size={20} className={`text-${item.color}-400`} />
                                                </div>
                                                <span className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">{item.step}</span>
                                            </div>
                                            <h3 className="text-lg font-bold">{item.title}</h3>
                                            <p className="text-sm text-osia-neutral-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Living Map Preview ──────────────────────────── */}
                <section className="py-32">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <motion.div {...fadeUp} className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                    A map that grows<br />
                                    <span className="text-osia-teal-400">with you.</span>
                                </h2>
                                <p className="text-osia-neutral-400 leading-relaxed">
                                    Your Living Map updates when evidence stabilises — not when the latest moment feels loud.
                                    It's a calm snapshot, not a verdict.
                                </p>
                                <div className="space-y-3 pt-2">
                                    {[
                                        'Patterns emerge over time, not from one data point',
                                        'Insights are framed as hypotheses with confidence levels',
                                        'You can always challenge or override any observation'
                                    ].map((text, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-osia-teal-500 shrink-0" />
                                            <span className="text-sm text-osia-neutral-400">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <Card className="p-8 border-white/5 bg-[#0a1128]/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-osia-teal-500/3 to-purple-500/3" />
                                    <div className="relative space-y-6">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-600 pb-2 border-b border-white/5">
                                            Living Map — Preview
                                        </div>
                                        {[
                                            { label: 'Coherence', status: 'Emerging', progress: 45, color: 'from-purple-500 to-pink-500' },
                                            { label: 'Energy Pattern', status: 'Stable', progress: 78, color: 'from-osia-teal-500 to-cyan-400' },
                                            { label: 'Relational Theme', status: 'Developing', progress: 55, color: 'from-blue-500 to-indigo-400' },
                                            { label: 'Growth Edge', status: 'Forming', progress: 25, color: 'from-amber-500 to-orange-400' }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-osia-neutral-400">{item.label}</span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-osia-neutral-500 px-2 py-0.5 rounded bg-white/5">{item.status}</span>
                                                </div>
                                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${item.progress}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                                        className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-[9px] text-osia-neutral-700 font-bold uppercase tracking-[0.15em] pt-2">
                                            Shape of experience · Not a claim about you
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Principles ──────────────────────────────────── */}
                <section id="principles" className="py-32 bg-gradient-to-b from-osia-teal-500/[0.03] to-transparent border-y border-white/5 scroll-mt-28">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <motion.div {...fadeUp} className="text-center space-y-4 mb-20">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for depth. Not judgement.</h2>
                            <p className="text-osia-neutral-500 max-w-xl mx-auto">Trust isn't a feature we added. It's the foundation we built on.</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: Shield, title: 'Consent-first', text: 'Every signal you share is your choice. No background scraping, no hidden data collection.' },
                                { icon: Eye, title: 'Transparent', text: 'Insights are hypotheses with confidence labels. You always know how OSIA reached its observations.' },
                                { icon: Brain, title: 'Not a diagnosis', text: 'OSIA is a reflection tool, not a therapeutic substitute. It shows patterns — you decide what they mean.' },
                                { icon: Layers, title: 'Data-minimal', text: 'We collect only what\'s needed for the experience you asked for. Nothing more.' },
                                { icon: MessageSquare, title: 'Built for conversation', text: 'Shared views between partners or teammates require mutual, revocable consent from both sides.' },
                                { icon: Sparkles, title: 'Always evolving', text: 'Your map grows with you. Delete anything, export everything, challenge any observation.' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="space-y-3 p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                                >
                                    <item.icon size={18} className="text-osia-teal-500" />
                                    <h4 className="text-sm font-bold">{item.title}</h4>
                                    <p className="text-xs text-osia-neutral-500 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div {...fadeUp} className="mt-16 text-center">
                            <p className="text-lg font-medium text-osia-neutral-300 italic">"OSIA is a mirror you can adjust — not a verdict."</p>
                        </motion.div>
                    </div>
                </section>

                {/* ── Founding Circle CTA ────────────────────────── */}
                <section id="founding-circle" className="py-32 scroll-mt-28">
                    <div className="container mx-auto px-6 max-w-2xl text-center">
                        <motion.div {...fadeUp} className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-400">
                                Early Access
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Join the<br />
                                <span className="bg-gradient-to-r from-osia-teal-400 to-cyan-400 bg-clip-text text-transparent">Founding Circle</span>
                            </h2>
                            <p className="text-osia-neutral-400 max-w-lg mx-auto leading-relaxed">
                                The first 150 members get lifetime access, shape the product roadmap, and help define what ethical
                                self-understanding technology looks like.
                            </p>

                            {!joined ? (
                                <form onSubmit={handleJoin} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-4">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-black/40 border-white/10 py-5 text-base flex-1"
                                    />
                                    <Button type="submit" variant="primary" className="px-8 py-5 text-sm font-bold" disabled={loading}>
                                        {loading ? 'Joining...' : 'Request Access'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="p-6 rounded-2xl bg-osia-teal-500/10 border border-osia-teal-500/20 inline-block">
                                    <p className="text-osia-teal-400 font-bold">You're in the circle ✦</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>

                {/* ── Privacy & Terms ────────────────────────────── */}
                <section id="privacy" className="py-24 border-t border-white/5">
                    <div className="container mx-auto px-6 max-w-4xl space-y-10">
                        <div className="text-center space-y-3">
                            <h2 className="text-2xl font-bold tracking-tight">Privacy Policy</h2>
                            <p className="text-[10px] text-osia-neutral-600 uppercase tracking-widest font-bold">Last updated: January 2026</p>
                        </div>
                        <div className="text-sm text-osia-neutral-500 space-y-4 max-w-2xl mx-auto leading-relaxed">
                            <p>OSIA is designed with privacy as its first principle. We do not sell your data, we do not use your private reflections to train models for other users, and we only collect what is necessary to power the experience you requested.</p>
                            <p>All signal data is encrypted, and relational shared views require mutual, revocable consent.</p>
                        </div>
                    </div>
                </section>

                <section id="terms" className="py-24 bg-black/30 border-y border-white/5">
                    <div className="container mx-auto px-6 max-w-4xl space-y-10">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight">Terms of Service</h2>
                        </div>
                        <div className="text-sm text-osia-neutral-500 space-y-4 max-w-2xl mx-auto leading-relaxed">
                            <p>By using OSIA, you agree to engage in experiments that are reflective in nature. OSIA is not a diagnostic tool or a substitute for professional therapy.</p>
                            <p>As a Founding Member, you agree to provide feedback to help shape the future of consensus-driven AI.</p>
                        </div>
                    </div>
                </section>

                {/* ── Footer ─────────────────────────────────────── */}
                <footer className="py-16 text-center space-y-6">
                    <img src="/logo.png" alt="OSIA" className="h-4 w-auto mx-auto opacity-30" />
                    <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-osia-neutral-700">
                        <a href="#privacy" className="hover:text-osia-neutral-400 transition-colors">Privacy</a>
                        <a href="#terms" className="hover:text-osia-neutral-400 transition-colors">Terms</a>
                        <a href="#principles" className="hover:text-osia-neutral-400 transition-colors">Principles</a>
                    </nav>
                    <p className="text-[9px] text-osia-neutral-800 font-bold uppercase tracking-[0.25em]">
                        © 2026 OSIA · Built for clarity, consent, and better conversations.
                    </p>
                </footer>
            </main>
        </div>
    );
}
