import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PlexusBackground } from '../../components/viz/PlexusBackground';

export function LandingPage() {
    const [email, setEmail] = useState('');
    const [joined, setJoined] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://127.0.0.1:3001/api/auth/waitlist', {
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
        }
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-osia-deep-900/40 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="OSIA" className="h-6 w-auto" />
                </div>
                <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-osia-neutral-400">
                    <a href="#how-it-works" className="hover:text-osia-teal-500 transition-colors">How it works</a>
                    <a href="#ethics" className="hover:text-osia-teal-500 transition-colors">Data & Ethics</a>
                    <a href="#founding-circle" className="hover:text-osia-teal-500 transition-colors">Founding Circle</a>
                </nav>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => window.location.href = '/login'}
                        variant="secondary"
                        className="px-6 py-2 text-[10px] uppercase font-bold tracking-widest hidden sm:flex"
                    >
                        Log in
                    </Button>
                </div>
            </header>

            <main className="relative z-10 pt-32">
                {/* Hero Section */}
                <section id="founding-circle" className="container mx-auto px-6 py-20 flex flex-col items-center text-center scroll-mt-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 text-[10px] font-bold uppercase tracking-widest text-osia-teal-500 mb-4">
                            <span>Only 150 Founding Members</span>
                            <span className="w-1 h-1 bg-osia-teal-500 rounded-full" />
                            <span>Early Access</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-glow">
                            See your patterns.<br />
                            <span className="text-osia-teal-500">Improve your conversations.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-osia-neutral-400 max-w-2xl mx-auto leading-relaxed">
                            OSIA turns the signals you choose to share into a layered map of how you think, work, and relate — then offers small experiments you can use immediately.
                        </p>

                        <ul className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-osia-neutral-500">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-osia-teal-500 rounded-full" />
                                Calm Snapshot
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-osia-teal-500 rounded-full" />
                                Relational Themes
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-osia-teal-500 rounded-full" />
                                Practical Prompts
                            </li>
                        </ul>

                        <div className="pt-10 flex flex-col items-center gap-6">
                            {!joined ? (
                                <form onSubmit={handleJoin} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-black/40 border-white/10 py-6 text-lg"
                                    />
                                    <Button type="submit" variant="primary" className="px-8 py-6 text-lg whitespace-nowrap">
                                        Join Founding Circle
                                    </Button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-osia-teal-500/10 border border-osia-teal-500/20 text-osia-teal-500 font-bold"
                                >
                                    You're in. We'll email you when your window opens.
                                </motion.div>
                            )}
                            <div className="text-[10px] text-osia-neutral-600 font-bold uppercase tracking-widest flex items-center gap-4">
                                <span>Consent-first</span>
                                <span>No scraping</span>
                                <span>Delete anytime</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Living Map Preview */}
                <section id="how-it-works" className="py-32 bg-black/40 border-y border-white/5 scroll-mt-32">
                    <div className="container mx-auto px-6 text-center space-y-16">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Living Map Preview</h2>
                            <p className="text-osia-neutral-500 max-w-xl mx-auto italic leading-relaxed">
                                A "living map" updates when evidence stabilises — not when the latest moment feels loud.
                            </p>
                        </div>

                        <div className="relative max-w-2xl mx-auto aspect-square flex items-center justify-center">
                            <div className="absolute inset-0 bg-osia-teal-500/5 rounded-full blur-[120px]" />
                            <Card className="p-8 border-white/5 bg-[#0a1128]/40 backdrop-blur-3xl shadow-2xl relative z-10 space-y-8 w-full max-w-lg">
                                <div className="text-left space-y-6">
                                    {[
                                        { label: 'Coherence', status: 'Emerging', color: 'osia-purple' },
                                        { label: 'Energy Pattern', status: 'Stable', color: 'osia-teal' },
                                        { label: 'Relational Theme', status: 'Developing', color: 'white' },
                                        { label: 'Growth Edge', status: 'Not yet determined', color: 'osia-neutral-600' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-osia-neutral-400">{item.label}</span>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 ${item.color.startsWith('OSIA') ? `text-${item.color}-500` : `text-${item.color}`}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-osia-neutral-600 font-bold uppercase tracking-widest tracking-[0.2em] pt-4">
                                    Preview of the shape of the experience — not a claim about you.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Built for Depth Section */}
                <section id="ethics" className="py-32 container mx-auto px-6 scroll-mt-32">
                    <div className="grid md:grid-cols-2 gap-20">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-bold tracking-tight">Built for depth.<br />Not judgement.</h2>
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest mb-6">What OSIA is</h3>
                                    <ul className="space-y-4 text-osia-neutral-400 text-sm list-disc list-inside marker:text-osia-teal-500">
                                        <li>A layered map of patterns you can use</li>
                                        <li>A reflection tool that supports real conversations</li>
                                        <li>A system that improves through your feedback and consent</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8 flex flex-col justify-end">
                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-6">What it isn't</h3>
                                    <ul className="space-y-4 text-osia-neutral-400 text-sm list-disc list-inside marker:text-red-500">
                                        <li>A diagnostic or therapeutic substitute</li>
                                        <li>A personality label that defines you</li>
                                        <li>A tool for screening or evaluating people</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-20 pt-10 border-t border-white/5 text-center">
                        <p className="text-lg font-medium text-white italic">"OSIA is a mirror you can adjust — not a verdict."</p>
                    </div>
                </section>

                {/* Data & Ethics Panel */}
                <section className="py-32 bg-osia-teal-500/5 border-y border-white/5">
                    <div className="container mx-auto px-6 max-w-4xl space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Data & Ethics</h2>
                            <p className="text-osia-neutral-400">Trust isn't a feature. It's the foundation.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-10">
                            {[
                                { title: 'Consent-first', text: 'You choose what domains you participate in (personal, relational, team).' },
                                { title: 'Data-minimal', text: "We collect only what's needed to generate the experience you asked for." },
                                { title: 'No scraping', text: "We don't pull in your private data from other platforms behind the scenes." },
                                { title: 'Transparent', text: "Insights are framed as hypotheses with confidence labels." },
                                { title: 'Control', text: 'You can view, export, or delete your data from your dashboard.' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">{item.title}</h4>
                                    <p className="text-sm text-osia-neutral-400 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Privacy & Terms */}
                <section id="privacy" className="py-32 container mx-auto px-6 border-t border-white/5">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Privacy Policy</h2>
                            <p className="text-osia-neutral-400">Last updated: January 2026</p>
                        </div>
                        <div className="prose prose-invert max-w-none text-osia-neutral-400 space-y-6">
                            <p>OSIA is designed with privacy as its first principle. We do not sell your data, we do not use your private reflections to train models for other users, and we only collect what is necessary to power the "Digital Twin" experience you requested.</p>
                            <p>All signal data is encrypted, and relational shared views require mutual, revocable consent.</p>
                        </div>
                    </div>
                </section>

                <section id="terms" className="py-32 bg-black/40 border-y border-white/5">
                    <div className="container mx-auto px-6 max-w-4xl space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Terms of Service</h2>
                        </div>
                        <div className="text-osia-neutral-400 space-y-6">
                            <p>By using OSIA, you agree to engage in experiments that are reflective in nature. OSIA is not a diagnostic tool or a substitute for professional therapy.</p>
                            <p>As a Founding Member, you agree to provide feedback to help shape the future of consensus-driven AI.</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-20 border-t border-white/5 text-center space-y-8">
                    <img src="/logo.png" alt="OSIA" className="h-5 w-auto mx-auto opacity-40" />
                    <nav className="flex justify-center gap-10 text-[10px] font-bold uppercase tracking-widest text-osia-neutral-600">
                        <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#terms" className="hover:text-white transition-colors">Terms</a>
                        <a href="#ethics" className="hover:text-white transition-colors">Data & Ethics</a>
                    </nav>
                    <p className="text-[9px] text-osia-neutral-700 font-bold uppercase tracking-[0.2em]">
                        © OSIA. Built for clarity, consent, and better conversations.
                    </p>
                </footer>
            </main>
        </div>
    );
}
