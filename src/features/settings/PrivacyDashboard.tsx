import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Shield, Eye, Download, Trash2, Lock } from 'lucide-react';

export function PrivacyDashboard() {

    const dataItems = [
        { label: 'Personal Insights', status: 'Active', icon: Eye },
        { label: 'Reflections', status: '8 Stored', icon: Shield },
        { label: 'Connect Sessions', status: 'None Active', icon: Lock }
    ];

    const consents = [
        { id: 'personal', title: 'Personal Insights & Living Map', status: 'Active (Required)' },
        { id: 'relational', title: 'Relational Connect', status: 'Paused' },
        { id: 'research', title: 'Product Improvement & Research', status: 'Inactive' }
    ];

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Your data. Your choice.</h1>
                        <p className="text-osia-neutral-500 text-sm italic">Trust isn’t a feature. It’s the foundation.</p>
                    </div>

                    {/* Data Overview */}
                    <section className="space-y-8">
                        <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Your data at a glance</h3>
                        <div className="grid sm:grid-cols-3 gap-6">
                            {dataItems.map((item, i) => (
                                <Card key={i} className="p-6 border-white/5 bg-[#0a1128]/40 space-y-4">
                                    <item.icon className="text-osia-teal-500" size={20} />
                                    <div>
                                        <div className="text-[10px] font-bold text-osia-neutral-400 uppercase tracking-widest">{item.label}</div>
                                        <div className="text-xl font-bold text-white">{item.status}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Permissions */}
                    <section className="space-y-8">
                        <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Permissions</h3>
                        <div className="space-y-4">
                            {consents.map((consent, i) => (
                                <Card key={i} className="p-6 border-white/5 bg-[#0a1128]/40 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-white">{consent.title}</div>
                                        <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">Status: {consent.status}</div>
                                    </div>
                                    <Button onClick={() => alert('Consent state updated.')} variant="secondary" className="px-6 py-2 text-[10px] uppercase font-bold tracking-widest">
                                        Change
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="space-y-8">
                        <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Your choices</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button onClick={() => alert('Data export initiated. Your ZIP will be ready shortly.')} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all text-left group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-osia-teal-500/10 flex items-center justify-center text-osia-teal-500">
                                        <Download size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-osia-teal-500">Export my data</div>
                                        <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">JSON format</div>
                                    </div>
                                </div>
                            </button>
                            <button onClick={() => confirm('Are you sure you want to delete your account? This is immediate and permanent.') && alert('Account scheduled for deletion.')} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-red-500/5 transition-all text-left group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Trash2 size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-red-500">Delete account</div>
                                        <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">Permanent recovery</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-osia-neutral-700 italic pt-8">
                            OSIA does not sell, scrape, or infer beyond what you share.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
