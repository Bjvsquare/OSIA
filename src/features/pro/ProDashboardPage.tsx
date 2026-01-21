import { Card } from '../../components/ui/Card';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { Users, FileText, Search, ChevronRight } from 'lucide-react';

export function ProDashboardPage() {

    const clients = [
        { id: 'client_1', name: 'Executive Team A', type: 'Team', activeProjects: 2, lastSignal: '2h ago' },
        { id: 'client_2', name: 'Sarah Chen', type: 'Individual', activeProjects: 1, lastSignal: '1d ago' },
        { id: 'client_3', name: 'Product Group X', type: 'Team', activeProjects: 4, lastSignal: '5m ago' }
    ];

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20">
                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Sidebar / Stats */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <section className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight">Manage Depth.</h1>
                            <p className="text-osia-neutral-500 text-sm">Professional tools for coaches and facilitators.</p>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-6 border-white/5 bg-[#0a1128]/40 space-y-2">
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Active Client Managed</div>
                            </Card>
                            <Card className="p-6 border-white/5 bg-[#0a1128]/40 space-y-2">
                                <div className="text-2xl font-bold">34</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Group Insights Synthesized</div>
                            </Card>
                        </div>

                        <Card className="p-8 border-osia-teal-500/20 bg-osia-teal-500/[0.03] space-y-6">
                            <h4 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">Ethics Reminder</h4>
                            <p className="text-xs text-osia-neutral-500 leading-relaxed">
                                As a practitioner, you have access to aggregated group trends. You can never view individual raw reflections without explicit, per-session mutual consent.
                            </p>
                        </Card>
                    </div>

                    {/* Client List */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Active Engagements</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-osia-neutral-600" size={14} />
                                <input type="text" placeholder="Search clients..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-6 py-2 text-xs focus:outline-none focus:border-osia-teal-500/50 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {clients.map((client) => (
                                <Card key={client.id} onClick={() => alert(`Opening workspace for ${client.name}`)} className="p-6 border-white/5 bg-[#0a1128]/40 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${client.type === 'Team' ? 'bg-osia-purple-500/10 text-osia-purple-500' : 'bg-osia-teal-500/10 text-osia-teal-500'}`}>
                                            {client.type === 'Team' ? <Users size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-osia-teal-500 transition-colors">{client.name}</div>
                                            <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest">{client.type} · {client.activeProjects} projects</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Last Activity</div>
                                            <div className="text-xs text-osia-neutral-400">{client.lastSignal}</div>
                                        </div>
                                        <ChevronRight size={18} className="text-osia-neutral-700 group-hover:text-white transition-colors" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
