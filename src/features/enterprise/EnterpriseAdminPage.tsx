import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Shield, Users, CreditCard, ChevronRight, Activity } from 'lucide-react';

export function EnterpriseAdminPage() {

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-6xl">
                <div className="space-y-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight">Organization Control.</h1>
                            <p className="text-osia-neutral-500 text-sm">Governance, compliance, and workspace scale.</p>
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={() => alert('Viewing Governance Logs (read-only)')} variant="secondary" className="px-8">View Logs</Button>
                            <Button onClick={() => alert('Workspace settings are managed at the organization level.')} variant="primary" className="px-8">Workspace Settings</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Seats', count: '500', sub: '423 assigned', icon: Users },
                            { label: 'Usage / Month', count: '12.4k', sub: 'Signals processed', icon: Activity },
                            { label: 'Privacy Tier', count: 'Max', sub: 'Zero-knowledge active', icon: Shield },
                            { label: 'Subscription', count: 'Enterprise', sub: 'Renews March 2026', icon: CreditCard }
                        ].map((stat, i) => (
                            <Card key={i} className="p-6 border-white/5 bg-[#0a1128]/40 space-y-4">
                                <stat.icon size={20} className="text-osia-teal-500" />
                                <div>
                                    <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">{stat.label}</div>
                                    <div className="text-2xl font-bold">{stat.count}</div>
                                    <div className="text-[10px] text-osia-neutral-500 uppercase tracking-tighter mt-1">{stat.sub}</div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <section className="space-y-6">
                            <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Active Workspaces</h3>
                            <div className="space-y-3">
                                {['Product & Design', 'Marketing Core', 'Engineering Lab', 'Founders Circle'].map((ws) => (
                                    <Card key={ws} onClick={() => alert(`Switching to ${ws} management context.`)} className="p-6 border-white/5 bg-[#0a1128]/40 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group">
                                        <div className="text-sm font-bold text-white group-hover:text-osia-teal-500 transition-colors">{ws}</div>
                                        <ChevronRight size={16} className="text-osia-neutral-800 group-hover:text-white transition-colors" />
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Policy Enforcement</h3>
                            <Card className="p-10 border-osia-teal-500/20 bg-osia-teal-500/[0.03] space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold">Mandatory Consent Re-verification</div>
                                        <div className="w-10 h-5 bg-osia-teal-500 rounded-full p-1 flex justify-end">
                                            <div className="w-3 h-3 bg-white rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold">Auto-anonymize teams &lt; 5 members</div>
                                        <div className="w-10 h-5 bg-osia-teal-500 rounded-full p-1 flex justify-end">
                                            <div className="w-3 h-3 bg-white rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center opacity-50">
                                        <div className="text-xs font-bold">PII Leak Prevention (Active/Dev)</div>
                                        <div className="w-10 h-5 bg-white/10 rounded-full p-1">
                                            <div className="w-3 h-3 bg-white/20 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-osia-neutral-600 italic tracking-widest uppercase">Policies are enforced at the API layer for every request.</p>
                            </Card>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
