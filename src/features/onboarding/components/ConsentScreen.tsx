import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { Shield, Check, Info } from 'lucide-react';

interface ConsentScreenProps {
    onContinue: (consents: Record<string, boolean>) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onContinue }) => {
    const { showToast, ToastComponent } = useToast();
    const [allConsented, setAllConsented] = useState(false);

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

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Visual Side */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 text-[10px] font-black text-osia-teal-500 uppercase tracking-widest">
                            <Shield className="w-3 h-3" />
                            Data Sovereign Protocol v1.1
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
                            </section> Section 5: Data Rights. You have the right to be forgotten. You have the right to port your data. You have the right to human intervention in any synthesis process.
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
                        <button className="hover:text-osia-teal-500 transition-colors">T&CS</button>
                        <button className="hover:text-osia-teal-500 transition-colors">PRIVACY</button>
                        <button className="hover:text-osia-teal-500 transition-colors">ETHICS</button>
                    </div>
                </Card>
            </div>

            <div className="mt-12 flex items-center justify-center gap-3 text-osia-neutral-600">
                <Info className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Last Updated: Jan 2026 • Policy Version 1.1</p>
            </div>

            <ToastComponent />
        </div>
    );
};
