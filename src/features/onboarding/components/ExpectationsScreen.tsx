import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { X, Shield, Eye, Trash2, Lock } from 'lucide-react';

interface ExpectationsScreenProps {
    onContinue: () => void;
}

export const ExpectationsScreen: React.FC<ExpectationsScreenProps> = ({ onContinue }) => {
    const { ToastComponent } = useToast();
    const [showReadMore, setShowReadMore] = useState(false);

    return (
        <div className="max-w-2xl mx-auto space-y-12 py-12 px-6 animate-in fade-in duration-1000">
            {/* Header */}
            <header className="text-center space-y-6">
                <img src="/logo.png" alt="OSIA" className="h-6 w-auto mx-auto opacity-80" />
                <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Before we begin, let's<br />set expectations<span className="text-osia-teal-500">.</span>
                </h1>
                <p className="text-osia-neutral-400 text-sm font-medium">
                    OSIA is designed to help you see patterns —<br />
                    not define you, label you, or decide for you.
                </p>
                <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest font-bold">
                    This will take less than a minute.
                </div>
            </header>

            {/* Sections */}
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">What OSIA is</h3>
                    <Card className="p-6 bg-osia-teal-500/[0.03] border-osia-teal-500/20">
                        <ul className="space-y-3">
                            {[
                                "A way to map patterns across how you think, decide, and relate",
                                "A tool for better conversations — with yourself and others",
                                "A system that offers hypotheses, not answers",
                                "An experience that improves through your feedback"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-osia-neutral-300">
                                    <span className="text-osia-teal-500 mt-1">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <p className="text-[10px] text-osia-neutral-500 italic">
                        You'll see insights marked as emerging, developing, or stable. You're always invited to agree, disagree, or refine what's shown.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">What OSIA is not</h3>
                    <ul className="space-y-2 px-1">
                        {[
                            "Not a diagnosis or mental health service",
                            "Not a personality test or fixed profile",
                            "Not a prediction engine",
                            "Not a tool for ranking, judging, or evaluating people",
                            "Not something others can see without your consent"
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-xs text-osia-neutral-400">
                                <span className="text-white/20 mt-1.5">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[10px] text-osia-neutral-500 font-bold uppercase tracking-tighter">
                        If something doesn't fit, that's useful information — not a failure.
                    </p>
                </section>

                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">How insights work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { step: "1", title: "You share small signals", body: "A few words, choices, and reflections — only what you're comfortable sharing." },
                            { step: "2", title: "OSIA looks for patterns", body: "Signals only become insights only when they repeat. Early signals stay tentative." },
                            { step: "3", title: "You test in real life", body: "You'll get small prompts to try. Your feedback reshapes what OSIA shows next." }
                        ].map((s, i) => (
                            <Card key={i} className="p-4 bg-white/[0.02] space-y-3 text-center md:text-left">
                                <div className="text-[10px] font-black text-osia-teal-500 uppercase tracking-widest">
                                    {s.step} — {s.title}
                                </div>
                                <p className="text-[11px] text-osia-neutral-400 leading-relaxed">
                                    {s.body}
                                </p>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 pt-4 border-t border-white/5">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Your role matters</h3>
                        <p className="text-xs text-osia-neutral-400 leading-relaxed">
                            OSIA doesn't improve by watching you quietly. It improves when you participate — by agreeing, disagreeing, and noticing what changes in real life.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">You're always in control</h3>
                        <ul className="space-y-1">
                            {[
                                "You choose what to share",
                                "You choose who you share with",
                                "You can revoke consent at any time",
                                "You can delete your data completely"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-2 text-xs text-osia-neutral-400">
                                    <span className="text-osia-teal-500/30 font-bold">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setShowReadMore(true)}
                            className="text-[10px] font-bold text-osia-teal-500 hover:text-osia-teal-400 underline underline-offset-4 decoration-osia-teal-500/30 uppercase tracking-widest"
                        >
                            See how data and consent work →
                        </button>
                    </div>
                </section>
            </div>

            {/* Footer Action */}
            <footer className="pt-8 text-center space-y-6">
                <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest font-bold">
                    Next, you'll choose what you're comfortable participating in.
                </div>
                <div className="flex flex-col items-center gap-4">
                    <Button variant="primary" size="lg" onClick={onContinue} className="w-full md:w-auto px-16">
                        Continue
                    </Button>
                    <button
                        onClick={() => setShowReadMore(true)}
                        className="text-xs font-bold text-osia-neutral-400 hover:text-white underline underline-offset-8 decoration-white/10 transition-all"
                    >
                        I want to read more first
                    </button>
                </div>
                <div className="text-[9px] text-osia-neutral-600 font-bold uppercase tracking-widest">
                    OSIA is built to support clarity, not certainty.
                </div>
                <ToastComponent />
            </footer>

            {/* Read More Modal */}
            {showReadMore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-osia-deep-900 border border-white/10 rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-osia-deep-900/95 backdrop-blur-xl p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">How OSIA Handles Your Data</h2>
                            <button
                                onClick={() => setShowReadMore(false)}
                                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5 text-osia-neutral-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Data Philosophy */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-osia-teal-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Data Philosophy</h3>
                                </div>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                    OSIA is built on the principle of <span className="text-white font-medium">data sovereignty</span> — you own your data, you control who sees it, and you can delete it entirely at any time.
                                </p>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                    We store <span className="text-white font-medium">patterns and insights</span>, not raw personal information. Your birth data is used to generate foundational patterns, then the raw data is encrypted. What remains is a numerical model — not identifiable information.
                                </p>
                            </section>

                            {/* What We Collect */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-osia-teal-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">What We Collect</h3>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { label: "Foundational data", desc: "Date, time, and location of birth — used once to generate your origin pattern" },
                                        { label: "Signal responses", desc: "Your word choices and reflections during calibration" },
                                        { label: "Feedback", desc: "When you agree, disagree, or refine an insight" },
                                        { label: "Usage patterns", desc: "How often you engage, to improve your experience" }
                                    ].map((item, i) => (
                                        <div key={i} className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                            <div className="text-xs font-bold text-white">{item.label}</div>
                                            <div className="text-[11px] text-osia-neutral-500 mt-1">{item.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Consent Model */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-osia-teal-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Consent Model</h3>
                                </div>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                    OSIA uses <span className="text-white font-medium">granular, revocable consent</span>. You'll be asked to opt-in to each feature domain separately:
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        "Personal Identity View — core self-awareness insights",
                                        "Relational Connections — how you relate to others (optional)",
                                        "Team Context — workplace dynamics (optional)",
                                        "Research Participation — anonymous data for improving OSIA (optional)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-osia-neutral-400">
                                            <span className="text-osia-teal-500 mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-osia-neutral-500 italic">
                                    You can change your consent preferences at any time from your settings. Revoking consent will stop data collection for that domain immediately.
                                </p>
                            </section>

                            {/* Data Deletion */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Data Deletion</h3>
                                </div>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed">
                                    You can request complete data deletion at any time. This is <span className="text-white font-medium">permanent and irreversible</span> — all your patterns, insights, and personal data will be removed from our systems.
                                </p>
                            </section>
                        </div>

                        <div className="sticky bottom-0 p-6 pt-4 bg-osia-deep-900/95 backdrop-blur-xl border-t border-white/5">
                            <Button
                                variant="primary"
                                onClick={() => setShowReadMore(false)}
                                className="w-full"
                            >
                                Got it — close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
