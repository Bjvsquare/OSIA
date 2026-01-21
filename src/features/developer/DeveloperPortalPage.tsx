import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Terminal, Key, Shield, ExternalLink, Copy } from 'lucide-react';

export function DeveloperPortalPage() {

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-5xl">
                <div className="space-y-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight">Signal API.</h1>
                            <p className="text-osia-neutral-500 text-sm">Build interfaces on top of OSIA patterns.</p>
                        </div>
                        <Button onClick={() => alert('New API key generated: OSIA_live_XXXX_XXXX')} variant="primary" className="px-8 flex items-center gap-2">
                            <Key size={14} />
                            Generate Key
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* API Documentation / Quickstart */}
                        <div className="lg:col-span-8 space-y-12">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Quickstart</h3>
                                <Card className="bg-black/40 border-white/5 p-6 overflow-hidden">
                                    <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-osia-neutral-600">
                                        <Terminal size={14} />
                                        POST /v1/signals/entry
                                    </div>
                                    <pre className="text-xs font-mono text-osia-teal-500 bg-black/60 p-4 rounded-xl overflow-x-auto">
                                        {`{
  "context": "deep_work",
  "mood": "focused",
  "intensity": 0.8,
  "consent_token": "ct_92k8sh...",
  "reflection": "Early morning flow states are becoming more frequent."
}`}
                                    </pre>
                                </Card>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Available Domains</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Signals', desc: 'Push raw observational data.' },
                                        { label: 'Patterns', desc: 'Listen for stabilization events.' },
                                        { label: 'Connect', desc: 'Initiate shared reflection sessions.' },
                                        { label: 'Admin', desc: 'Manage workspace access (Enterprise).' }
                                    ].map((domain, i) => (
                                        <Card key={i} onClick={() => alert(`Viewing API documentation for ${domain.label}`)} className="p-6 border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-bold text-white group-hover:text-osia-teal-500">{domain.label}</div>
                                                <ExternalLink size={14} className="text-osia-neutral-800" />
                                            </div>
                                            <p className="text-[11px] text-osia-neutral-500 mt-2">{domain.desc}</p>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Data Ethics at the API</h3>
                                <Card className="p-8 border-osia-teal-500/20 bg-osia-teal-500/[0.03] space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <Shield size={20} className="text-osia-teal-500 shrink-0" />
                                            <p className="text-[11px] text-osia-neutral-400 leading-relaxed">
                                                All API calls require a valid <span className="text-white font-bold">Consent Token</span>. Tokens are per-user, per-domain, and can be revoked instantly.
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => alert('Downloading Security Whitepaper (PDF)')} className="text-[9px] font-bold text-osia-teal-500 hover:underline uppercase tracking-widest">
                                        Read Security Whitepaper →
                                    </button>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Your Tokens</h3>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group">
                                    <span className="text-[10px] font-mono text-osia-neutral-500">OSIA_live_92kd...</span>
                                    <Copy onClick={() => alert('API Key copied to clipboard.')} size={14} className="text-osia-neutral-700 cursor-pointer hover:text-white transition-colors" />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
