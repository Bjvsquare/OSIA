import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface ExpiredLinkScreenProps {
    onRetry: () => void;
    onBack: () => void;
}

export const ExpiredLinkScreen: React.FC<ExpiredLinkScreenProps> = ({ onRetry, onBack }) => {
    return (
        <Card className="p-10 border-white/5 bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-8 relative min-h-[480px] flex flex-col justify-center overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">That link has expired</h1>
                <p className="text-sm text-osia-neutral-400 leading-relaxed px-4">
                    For your security, sign-in links expire after a short time. Request a new one below.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Button variant="primary" onClick={onRetry} className="w-full">
                    Send a new sign-in link
                </Button>
                <button
                    onClick={onBack}
                    className="text-xs font-bold text-osia-teal-500 hover:text-osia-teal-400 underline underline-offset-8 decoration-osia-teal-500/30 transition-all uppercase tracking-widest"
                >
                    Use a different email
                </button>
            </div>

            <div className="space-y-4 pt-6 mt-4 border-t border-white/5 text-center">
                <div className="space-y-1">
                    <p className="text-[11px] text-osia-neutral-400 font-bold uppercase tracking-widest">
                        If already used:
                    </p>
                    <p className="text-[10px] text-osia-neutral-600 leading-relaxed">
                        This link has already been used.<br />
                        Please request a new one.
                    </p>
                </div>
            </div>
        </Card>
    );
};
