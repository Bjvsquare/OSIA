import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../../auth/AuthContext';
import { Shield, Info, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
    const { state, dispatch } = useOnboarding();
    const { userProfile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [consents, setConsents] = useState({
        personal_twin: true,
        relational_connect: false,
        team_views: false,
        research_participation: false,
        product_analytics: true
    });

    const handleToggle = (key: keyof typeof consents) => {
        const newValue = !consents[key];
        setConsents(prev => ({ ...prev, [key]: newValue }));

        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'consent_toggle_changed',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'WELCOME',
                consent_snapshot: consents,
                properties: { consent_key: key, value: newValue }
            }
        });

        dispatch({
            type: 'UPDATE_CONSENT',
            payload: {
                entry_id: crypto.randomUUID(),
                user_id: userProfile?.id || 'anonymous',
                domains: { [key]: newValue },
                granted: newValue,
                policy: 'v1.1',
                occurred_at: new Date().toISOString()
            }
        });
    };

    const handleContinue = () => {
        dispatch({
            type: 'RECORD_EVENT',
            payload: {
                event_id: crypto.randomUUID(),
                event_name: 'welcome_continue_clicked',
                occurred_at: new Date().toISOString(),
                user_id: userProfile?.id || 'anonymous',
                session_id: state.sessionId,
                screen_id: 'WELCOME',
                consent_snapshot: consents,
                properties: {}
            }
        });
        onContinue();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
            {/* Brand Header */}
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-osia-teal-400 to-osia-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-osia-teal-500/20">
                    <Shield className="text-white w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">OSIA</h1>
                    <p className="text-xl text-osia-neutral-400">Your digital twin for growth and reflection.</p>
                </div>
            </div>

            {/* Three Bullets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white/5 border-white/10 space-y-2">
                    <div className="text-osia-teal-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} /> What it is
                    </div>
                    <p className="text-sm text-osia-neutral-400">A symbolic model of your patterns and growth edges.</p>
                </Card>
                <Card className="p-4 bg-white/5 border-white/10 space-y-2">
                    <div className="text-osia-purple-400 font-semibold flex items-center gap-2">
                        <XCircle size={16} /> What it is not
                    </div>
                    <p className="text-sm text-osia-neutral-400">A clinical diagnosis, a personality label, or a replica.</p>
                </Card>
                <Card className="p-4 bg-white/5 border-white/10 space-y-2">
                    <div className="text-osia-teal-400 font-semibold flex items-center gap-2">
                        <Shield size={16} /> What you control
                    </div>
                    <p className="text-sm text-osia-neutral-400">Every signal, every insight, and every permission.</p>
                </Card>
            </div>

            {/* Insight Preview */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-osia-neutral-500 uppercase tracking-wider">Insight Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-white/10 to-transparent border-white/10 opacity-60 grayscale">
                        <div className="h-4 w-24 bg-white/20 rounded mb-2" />
                        <div className="h-3 w-full bg-white/10 rounded mb-1" />
                        <div className="h-3 w-2/3 bg-white/10 rounded" />
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-white/10 to-transparent border-white/10 opacity-60 grayscale">
                        <div className="h-4 w-24 bg-white/20 rounded mb-2" />
                        <div className="h-3 w-full bg-white/10 rounded mb-1" />
                        <div className="h-3 w-2/3 bg-white/10 rounded" />
                    </Card>
                </div>
            </div>

            {/* Consent Block */}
            <Card className="p-6 border-white/10 bg-osia-deep-800/50 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">Data & Consent</h3>
                        <p className="text-sm text-osia-neutral-400">Granular control over your digital twin foundation.</p>
                    </div>
                    <Shield className="text-osia-teal-500" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">Personal Twin</span>
                                <span className="text-[10px] bg-osia-teal-500/20 text-osia-teal-400 px-1.5 py-0.5 rounded uppercase font-bold">Required</span>
                            </div>
                            <p className="text-xs text-osia-neutral-500">Enable core modeling of your patterns and insights.</p>
                        </div>
                        <div className="w-12 h-6 bg-osia-teal-600 rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                            <div className="w-4 h-4 bg-white rounded-full" />
                        </div>
                    </div>

                    {(['relational_connect', 'team_views', 'research_participation'] as const).map(key => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-white capitalize">{key.replace('_', ' ')}</span>
                                <p className="text-xs text-osia-neutral-500">
                                    {key === 'relational_connect' && 'Connect with others to see mutual patterns.'}
                                    {key === 'team_views' && 'Contribute to aggregate team climate insights.'}
                                    {key === 'research_participation' && 'Help us improve OSIA with anonymized data.'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle(key)}
                                className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${consents[key] ? 'bg-osia-teal-600 justify-end' : 'bg-white/10 justify-start'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-4 text-xs text-osia-neutral-500">
                    <button className="hover:text-white transition-colors">Data Policy</button>
                    <button className="hover:text-white transition-colors">Right to Deletion</button>
                </div>
            </Card>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={handleContinue}
                    variant="primary"
                    className="flex-1 py-6 text-lg group"
                >
                    Continue to Onboarding
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                    variant="secondary"
                    className="flex-1 py-6 text-lg"
                    onClick={() => setShowModal(true)}
                >
                    <Info className="mr-2" />
                    How this works
                </Button>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-osia-deep-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-lg w-full"
                        >
                            <Card className="p-8 border-white/10 bg-osia-deep-800 space-y-6">
                                <h2 className="text-2xl font-bold text-white">How OSIA Works</h2>
                                <div className="space-y-4 text-osia-neutral-400">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-osia-teal-500/20 flex items-center justify-center shrink-0 text-osia-teal-400 font-bold">1</div>
                                        <p><span className="text-white font-medium">Signals:</span> We capture short text and word lists you provide.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-osia-purple-500/20 flex items-center justify-center shrink-0 text-osia-purple-400 font-bold">2</div>
                                        <p><span className="text-white font-medium">Hypotheses:</span> Our engine maps signals to layers to form patterns.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-osia-teal-500/20 flex items-center justify-center shrink-0 text-osia-teal-400 font-bold">3</div>
                                        <p><span className="text-white font-medium">Calibration:</span> You review insights and tell us if they resonate or not.</p>
                                    </div>
                                </div>
                                <Button onClick={() => setShowModal(false)} className="w-full">Got it</Button>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
