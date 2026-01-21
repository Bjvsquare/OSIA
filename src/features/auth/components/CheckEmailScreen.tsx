import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface CheckEmailScreenProps {
    email: string;
    onResend: () => void;
    onBack: () => void;
}

export const CheckEmailScreen: React.FC<CheckEmailScreenProps> = ({ email, onResend, onBack }) => {
    return (
        <Card className="p-10 border-white/5 bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-8 relative min-h-[480px] flex flex-col justify-center overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">Check your email</h1>
                <p className="text-sm text-osia-neutral-400 leading-relaxed px-4">
                    We sent a secure sign-in link to <span className="text-white font-medium">{email}</span>. Open it on this device to continue.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Button variant="primary" onClick={onResend} className="w-full">
                    Resend link
                </Button>
                <button
                    onClick={onBack}
                    className="text-xs font-bold text-osia-teal-500 hover:text-osia-teal-400 underline underline-offset-8 decoration-osia-teal-500/30 transition-all uppercase tracking-widest"
                >
                    Use a different email
                </button>
            </div>

            <div className="space-y-4 pt-6 mt-4 border-t border-white/5">
                {[
                    { text: "If you don't see it, check Spam or Promotions.", icon: "💡" },
                    { text: "It can take up to a minute to arrive.", icon: "⏱️" },
                    { text: "The link expires for your security.", icon: "🛡️" }
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-2">
                        <span className="text-xs">{item.icon}</span>
                        <div className="flex-1 flex justify-between items-center group cursor-pointer">
                            <p className="text-[11px] text-osia-neutral-400 font-medium">{item.text}</p>
                            <svg className="w-3 h-3 text-osia-neutral-600 group-hover:text-osia-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center pt-4">
                <p className="text-[10px] text-osia-neutral-600 font-bold uppercase tracking-widest italic">
                    This link is private. Don't forward it.
                </p>
            </div>
        </Card>
    );
};
