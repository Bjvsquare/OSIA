import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function ConnectInvitePage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const connectionTypes = [
        { id: 'partner', label: 'Partner / Spouse', icon: '❤️' },
        { id: 'friend', label: 'Friend', icon: '🤝' },
        { id: 'colleague', label: 'Colleague', icon: '🏢' },
        { id: 'team', label: 'Team Member', icon: '👥' },
        { id: 'other', label: 'Other', icon: '🌀' }
    ];

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-2xl">
                {!sent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight">Invite someone to a shared reflection.</h1>
                            <p className="text-osia-neutral-500 text-sm italic">Relational Connect is mutual and limited by design.</p>
                        </div>

                        <Card className="p-8 border-osia-teal-500/20 bg-osia-teal-500/[0.02] space-y-6">
                            <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} />
                                What sharing means
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'No full personal map sharing',
                                    'Symmetrical shared view',
                                    'Always consensual & revocable',
                                    'No tracking or logging outside session'
                                ].map((item, i) => (
                                    <li key={i} className="text-xs text-osia-neutral-400 flex gap-2">
                                        <span className="text-osia-teal-500">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Who is this with?</div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {connectionTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => alert(`Connection type set to: ${type.label}. OSIA will use this to calibrate the shared prompt.`)}
                                            className="text-left group"
                                        >
                                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] group-hover:border-osia-teal-500/30 transition-all">
                                                <div className="text-2xl mb-2">{type.icon}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 group-hover:text-white">{type.label}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Invite details</div>
                                    <Input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-black/40 border-white/10"
                                    />
                                    <textarea
                                        placeholder="Add a personal note (optional)"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-osia-teal-500 transition-colors h-24"
                                    />
                                </div>
                                <Button type="submit" variant="primary" className="w-full py-6 text-lg">
                                    Send invite
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 py-20"
                    >
                        <div className="w-20 h-20 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 flex items-center justify-center mx-auto mb-8">
                            <ShieldCheck size={32} className="text-osia-teal-500" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Invite sent.</h2>
                        <p className="text-osia-neutral-400 max-w-md mx-auto leading-relaxed">
                            We've sent a secure invite to {email}. They won't see anything until they accept and agree to the shared consent.
                        </p>
                        <Button onClick={() => navigate('/home')} variant="secondary" className="px-12 py-4">
                            Back to My OSIA
                        </Button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
