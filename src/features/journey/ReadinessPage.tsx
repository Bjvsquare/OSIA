import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { ArrowUpRight } from 'lucide-react';

export function ReadinessPage() {

    const sections = [
        {
            id: 'now',
            label: 'Now',
            color: 'osia-teal-500',
            description: 'These areas have enough signal to explore meaningfully right now.',
            items: [
                { title: 'Decision Patterns', status: 'Developing', sub: 'Early patterns are forming. Feedback here has a strong effect.' },
                { title: 'Energy & Recovery', status: 'Emerging', sub: 'Signals are light but responsive. Small check-ins help clarify.' }
            ]
        },
        {
            id: 'next',
            label: 'Next',
            color: 'white',
            description: 'These areas are close to becoming clear, but need a bit more context.',
            items: [
                { title: 'Relational Dynamics', status: 'Gathering signals', sub: 'This layer will benefit from one or two more real-world interactions.' }
            ]
        },
        {
            id: 'later',
            label: 'Later',
            color: 'osia-neutral-600',
            description: "These areas aren't ready yet — and that's okay.",
            items: [
                { title: 'Growth Edge', status: 'Not ready', sub: 'This layer emerges only after others stabilise.' },
                { title: 'Long-term Patterns', status: 'Not ready', sub: 'OSIA needs time across different contexts to see these clearly.' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Where things stand.</h1>
                        <p className="text-osia-neutral-500 text-sm italic">Some areas are active now. Others need time or context.</p>
                    </div>

                    <div className="space-y-20">
                        {sections.map((section) => (
                            <section key={section.id} className="space-y-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-2xl font-black uppercase tracking-[0.2em] text-${section.color}`}>{section.label}</h2>
                                        <div className={`flex-1 h-px bg-white/5`} />
                                    </div>
                                    <p className="text-osia-neutral-500 text-sm leading-relaxed">{section.description}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {section.items.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={section.id === 'now' ? { scale: 1.01 } : {}}
                                            className={section.id === 'later' ? 'opacity-50 grayscale' : ''}
                                        >
                                            <Card className={`p-6 border-white/5 bg-[#0a1128]/40 h-full flex flex-col justify-between group ${section.id === 'now' ? 'hover:border-osia-teal-500/20' : ''}`}>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-lg group-hover:text-osia-teal-500 transition-colors">{item.title}</h3>
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-osia-neutral-500">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-osia-neutral-400 leading-relaxed">
                                                        {item.sub}
                                                    </p>
                                                </div>
                                                {section.id === 'now' && (
                                                    <div className="pt-6 flex justify-end">
                                                        <button onClick={() => alert(`Deep-dive into ${item.title} initiated.`)} className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                                            Explore <ArrowUpRight size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Readiness Info */}
                    <div className="pt-16 border-t border-white/5 text-center space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">How OSIA decides what's ready?</h4>
                            <p className="text-xs text-osia-neutral-500 max-w-xl mx-auto leading-relaxed">
                                OSIA looks for repetition across time and context. When a pattern appears consistently — and you confirm or refine it — related areas become meaningful to explore.
                            </p>
                        </div>
                        <p className="text-sm font-bold text-osia-teal-500 italic">
                            You can't fall behind here. If life is quiet, your map stays steady.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
