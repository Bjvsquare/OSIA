import { useState } from 'react';
import { VoiceInteraction } from './VoiceInteraction';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react';

export function VoiceTestPage() {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = (data: any) => {
        console.log('[VoiceTest] Completion Data:', data);
        setTestResult(data);
        setIsTesting(false);
        setError(null);
    };

    const handleCancel = (err?: string) => {
        console.log('[VoiceTest] Cancelled', err ? `due to error: ${err}` : '');
        if (err) setError(err);
        setIsTesting(false);
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="max-w-2xl w-full space-y-8 bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-osia-teal-500/20 mb-4">
                        <Mic className="w-10 h-10 text-osia-teal-500" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Voice Lab</h1>
                    <p className="text-osia-neutral-400 max-w-md mx-auto line-relaxed">
                        Test OpenAI Realtime Resonance and Signal Extraction in an isolated environment.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}

                {!isTesting && !testResult && (
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={() => setIsTesting(true)}
                            variant="primary"
                            size="lg"
                            className="rounded-full px-12 py-8 text-xl font-bold shadow-[0_0_40px_rgba(56,163,165,0.3)] hover:scale-105 transition-transform"
                        >
                            Initiate Testing
                        </Button>
                    </div>
                )}

                {testResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-osia-teal-500/10 border border-osia-teal-500/30 text-osia-teal-500">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-bold">Signals Captured Successfully</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(testResult.selectedWords).map(([bucket, words]: [string, any]) => (
                                <div key={bucket} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500">{bucket}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {words.length > 0 ? (
                                            words.map((w: string) => (
                                                <span key={w} className="text-xs text-osia-teal-500 bg-osia-teal-500/10 px-2 py-1 rounded-md border border-osia-teal-500/20">
                                                    {w}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-osia-neutral-600 italic">None detected</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {testResult.situation && (
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500">Extracted Situation</h3>
                                <p className="text-sm text-osia-neutral-300 italic">"{testResult.situation}"</p>
                            </div>
                        )}

                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={() => { setTestResult(null); setIsTesting(true); }}
                                variant="ghost"
                                className="text-osia-neutral-400 hover:text-white"
                            >
                                Reset & Retest
                            </Button>
                        </div>
                    </motion.div>
                )}

                <div className="pt-8 border-t border-white/5">
                    <div className="flex items-start gap-3 text-xs text-osia-neutral-500 max-w-sm mx-auto">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                            This page directly hits the `/api/realtime/session` endpoint. Ensure your server is running and the `OPENAI_API_KEY` is correctly configured in your environment.
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isTesting && (
                    <VoiceInteraction
                        onComplete={handleComplete}
                        onCancel={(err) => handleCancel(err)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
