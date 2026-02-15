import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { Shield, Check, X } from 'lucide-react';

interface ConsentScreenProps {
    onContinue: (consents: Record<string, boolean>) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onContinue }) => {
    const { showToast, ToastComponent } = useToast();
    const [allConsented, setAllConsented] = useState(false);
    const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'ethics' | null>(null);

    const handleContinue = () => {
        if (!allConsented) {
            showToast('Please accept the Terms of Service and Privacy Policy to proceed.', 'warning');
            return;
        }

        // Pass a unified consent object
        onContinue({
            core: true,
            relational: true,
            team: true,
            research: true
        });
    };

    const legalContent: Record<string, { title: string; content: React.ReactNode }> = {
        terms: {
            title: 'Terms & Conditions',
            content: (
                <div className="space-y-6 text-xs text-osia-neutral-400 leading-relaxed">
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">1. Acceptance of Terms</p>
                        By creating an account and using OSIA, you agree to these Terms & Conditions. OSIA is a pattern-recognition platform that generates hypotheses based on your inputs — it is not a diagnostic, therapeutic, or predictive tool.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">2. Account Responsibilities</p>
                        You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to create an account. Each account is personal and non-transferable.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">3. Intellectual Property</p>
                        OSIA's algorithms, interface, and methodology are proprietary. Insights generated for you are yours to keep, but the underlying models and frameworks remain the intellectual property of OSIA.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">4. Service Availability</p>
                        OSIA is provided "as is" and "as available." We strive for continuous availability but do not guarantee uninterrupted service. We may update features and functionality as the platform evolves.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">5. Limitation of Liability</p>
                        OSIA does not provide medical, psychological, or professional advice. Insights are generated patterns, not diagnoses. We are not liable for decisions made based on OSIA outputs.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">6. Termination</p>
                        You may delete your account at any time. We may suspend accounts that violate these terms or engage in abusive behaviour.
                    </section>
                </div>
            )
        },
        privacy: {
            title: 'Privacy Policy',
            content: (
                <div className="space-y-6 text-xs text-osia-neutral-400 leading-relaxed">
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">1. Data Collection</p>
                        We collect: account information (email), foundational data (birth date, time, location), signal responses (word choices, reflections), and usage patterns. We do not collect browsing data, location tracking, or third-party data.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">2. Data Processing</p>
                        Your foundational data is used once to generate origin patterns, then encrypted. We store derived patterns and insights — not raw personal information. All processing occurs within our secure infrastructure.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">3. Data Sharing</p>
                        We never sell, trade, or share your personal data with advertisers or third parties. Relational features only work with mutual, explicit consent from both parties.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">4. Your Rights</p>
                        You have the right to: access your data, export your data, correct inaccuracies, revoke consent at any time, and request complete deletion. These rights are exercisable through your account settings.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">5. Security</p>
                        We use encryption at rest and in transit. Access to user data is restricted and audited. We conduct regular security reviews.
                    </section>
                </div>
            )
        },
        ethics: {
            title: 'Ethics Framework',
            content: (
                <div className="space-y-6 text-xs text-osia-neutral-400 leading-relaxed">
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">1. Core Philosophy</p>
                        OSIA exists to support self-understanding, not to categorise, rank, or judge. Our models generate hypotheses — tentative patterns that you validate through experience.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">2. Consent & Autonomy</p>
                        Every data domain requires explicit, informed consent. Consent is granular (per-feature), revocable (at any time), and transparent (you can always see what you've consented to).
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">3. No Harm Principle</p>
                        OSIA will never expose individual data to employers without consent. All team-level insights are aggregated and anonymised. We will not create features that could be used for surveillance or coercion.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">4. Bias & Fairness</p>
                        We actively monitor our models for cultural, demographic, and cognitive biases. We use diverse datasets and regular audits to improve fairness. Users can flag biased outputs directly.
                    </section>
                    <section>
                        <p className="text-white font-bold mb-2 uppercase">5. Human Override</p>
                        You always have the right to disagree with OSIA's outputs. Your feedback directly reshapes the model. A human can always override any automated process.
                    </section>
                </div>
            )
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Visual Side */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 text-[10px] font-black text-osia-teal-500 uppercase tracking-widest">
                            <Shield className="w-3 h-3" />
                            Data Sovereign Protocol
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tighter text-white leading-[1.1]">
                            Control your <br />
                            <span className="text-osia-teal-500">cognitive footprint.</span>
                        </h1>
                        <p className="text-osia-neutral-400 text-lg leading-relaxed">
                            OSIA is built on the principle of radical transparency. You own your signals. We only process what you explicitly allow.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-osia-teal-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-6 h-6 text-osia-teal-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Full Data Ownership</h4>
                                <p className="text-xs text-osia-neutral-500">You can export or delete your entire history at any time with one click.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-osia-teal-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-6 h-6 text-osia-teal-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Zero Third-Party Sharing</h4>
                                <p className="text-xs text-osia-neutral-500">Your cognitive signals are never sold, traded, or shared with advertisers.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms Side */}
                <Card className="p-8 bg-osia-deep-900/60 border-white/5 shadow-2xl space-y-8 backdrop-blur-xl">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-osia-neutral-500 uppercase tracking-widest">Platform Agreement</h3>

                        <div className="h-64 overflow-y-auto pr-4 space-y-6 text-xs text-osia-neutral-400 font-mono leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                            <section>
                                <p className="text-white font-bold mb-2 uppercase">1. Core Participation</p>
                                By enabling OSIA, you grant permission for the engine to process your responses to create a Digital Twin. This processing is local to your session and encrypted.
                            </section>
                            <section>
                                <p className="text-white font-bold mb-2 uppercase">2. Relational Connectivity</p>
                                If you choose to connect with others, shared patterns are only visible if both parties grant explicit, mutual consent for that specific interaction.
                            </section>
                            <section>
                                <p className="text-white font-bold mb-2 uppercase">3. Organisational Ethics</p>
                                OSIA will never expose individual data to employers. All team-level insights are aggregated and anonymised to protect individual psychological safety.
                            </section>
                            <section>
                                <p className="text-white font-bold mb-2 uppercase">4. Research & Improvement</p>
                                We use anonymised telemetry to detect bias and improve model resonance. No personal identifiers are ever included in research datasets.
                            </section>
                            <section>
                                <p className="text-white font-bold mb-2 uppercase">5. Data Rights</p>
                                You have the right to be forgotten. You have the right to port your data. You have the right to human intervention in any synthesis process.
                            </section>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-6">
                        <div
                            className="group flex items-center gap-4 cursor-pointer"
                            onClick={() => setAllConsented(!allConsented)}
                        >
                            <div className={`relative w-14 h-8 rounded-full transition-all duration-500 ${allConsented ? 'bg-osia-teal-500 shadow-[0_0_20px_rgba(56,163,165,0.4)]' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-500 transform ${allConsented ? 'translate-x-6 scale-110' : 'translate-x-0'}`} />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-bold text-white cursor-pointer group-hover:text-osia-teal-400 transition-colors">
                                    I accept the OSIA Data & Ethics Policy
                                </label>
                                <p className="text-[10px] text-osia-neutral-600 font-medium">Agreement is required to initialize your Digital Twin</p>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleContinue}
                            disabled={!allConsented}
                            className={`w-full py-8 text-lg font-black tracking-tight rounded-2xl transition-all duration-500 ${allConsented ? 'opacity-100' : 'opacity-40 cursor-not-allowed grayscale'}`}
                        >
                            INITIALIZE OSIA
                        </Button>
                    </div>

                    <div className="flex justify-center gap-6 text-[9px] font-black text-osia-neutral-700 uppercase tracking-[0.2em]">
                        <button onClick={() => setLegalModal('terms')} className="hover:text-osia-teal-500 transition-colors">T&CS</button>
                        <button onClick={() => setLegalModal('privacy')} className="hover:text-osia-teal-500 transition-colors">PRIVACY</button>
                        <button onClick={() => setLegalModal('ethics')} className="hover:text-osia-teal-500 transition-colors">ETHICS</button>
                    </div>
                </Card>
            </div>

            <ToastComponent />

            {/* Legal Modal */}
            {legalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-osia-deep-900 border border-white/10 rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-osia-deep-900/95 backdrop-blur-xl p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">{legalContent[legalModal].title}</h2>
                            <button
                                onClick={() => setLegalModal(null)}
                                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5 text-osia-neutral-400" />
                            </button>
                        </div>
                        <div className="p-6">
                            {legalContent[legalModal].content}
                        </div>
                        <div className="sticky bottom-0 p-6 pt-4 bg-osia-deep-900/95 backdrop-blur-xl border-t border-white/5">
                            <Button variant="primary" onClick={() => setLegalModal(null)} className="w-full">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
