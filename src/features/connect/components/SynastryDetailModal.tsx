import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Zap } from 'lucide-react';

interface SynastryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    targetName: string;
}

export function SynastryDetailModal({ isOpen, onClose, data, targetName }: SynastryDetailModalProps) {
    const [selectedDetail, setSelectedDetail] = React.useState<any | null>(null);

    if (!isOpen) return null;

    const getCoords = (lon: number, radius: number = 80) => {
        const rad = (lon - 90) * (Math.PI / 180); // Offset by -90 to start Aries at Top
        return {
            x: 100 + radius * Math.cos(rad),
            y: 100 + radius * Math.sin(rad)
        };
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-osia-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] h-full"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-osia-neutral-950/80 backdrop-blur-md">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-osia-teal-500/10 rounded-lg border border-osia-teal-500/20">
                                    <Activity className="w-5 h-5 text-osia-teal-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    Relational Dynamic
                                </h2>
                            </div>
                            <p className="text-osia-neutral-400 text-xs uppercase tracking-[0.2em]">Inter-Field Synthesis • {targetName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90">
                            <X className="w-6 h-6 text-osia-neutral-400" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-8 space-y-12 bg-osia-neutral-950/95">
                        {/* Overall Field Narrative */}
                        <section className="relative p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-osia-teal-500 shadow-[0_0_10px_#2dd4bf]" />
                            <div className="absolute inset-0 bg-gradient-to-br from-osia-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <h3 className="text-[10px] font-bold text-osia-teal-400 uppercase tracking-widest mb-3">Field Narrative</h3>
                            <p className="text-lg text-osia-neutral-200 leading-relaxed font-light italic">
                                "{data?.summary || 'Reconstructing the dynamic interface...'}"
                            </p>
                        </section>

                        {/* Neural Synergy Mesh */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-osia-teal-400" />
                                    Neural Synergy Mesh
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-osia-teal-500" />
                                        <span className="text-[10px] text-osia-neutral-400 uppercase">You</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span className="text-[10px] text-osia-neutral-400 uppercase">{targetName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative aspect-square w-full max-w-[500px] mx-auto bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden flex items-center justify-center p-8 group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.03),transparent_70%)]" />

                                <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <defs>
                                        <radialGradient id="meshGrad" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                                        </radialGradient>
                                        <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="2" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>

                                    {/* Interaction Threads (Aspects) */}
                                    {data?.aspects?.map((aspect: any, i: number) => {
                                        const p1Data = data.planets.user1.find((p: any) => p.name === aspect.p1);
                                        const p2Data = data.planets.user2.find((p: any) => p.name === aspect.p2);
                                        if (!p1Data || !p2Data) return null;

                                        const c1 = getCoords(p1Data.longitude);
                                        const c2 = getCoords(p2Data.longitude);
                                        const isFriction = aspect.psychologicalFocus === 'friction' || aspect.psychologicalFocus === 'polarity';

                                        return (
                                            <g key={`aspect-mesh-${i}`} className="group/thread cursor-pointer" onClick={() => setSelectedDetail(aspect)}>
                                                {/* Hit area */}
                                                <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="transparent" strokeWidth="8" />

                                                {/* Main line */}
                                                <motion.line
                                                    x1={c1.x} y1={c1.y}
                                                    x2={c2.x} y2={c2.y}
                                                    stroke={isFriction ? '#ef4444' : '#2dd4bf'}
                                                    strokeWidth={aspect.orb < 2 ? 1.5 : 0.75}
                                                    strokeOpacity={Math.max(0.1, 1 - aspect.orb / 10)}
                                                    strokeDasharray={isFriction ? "3 3" : "none"}
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ delay: 1, duration: 1.5 }}
                                                    className="group-hover/thread:stroke-white transition-all duration-300"
                                                />

                                                {/* Energy Pulses */}
                                                <motion.circle
                                                    r="1"
                                                    fill={isFriction ? '#ef4444' : '#2dd4bf'}
                                                    initial={{ offsetDistance: "0%" }}
                                                    animate={{ offsetDistance: "100%" }}
                                                    transition={{
                                                        duration: isFriction ? 1.5 : 3,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                        delay: i * 0.2
                                                    }}
                                                    style={{ offsetPath: `path('M ${c1.x} ${c1.y} L ${c2.x} ${c2.y}')` }}
                                                />
                                            </g>
                                        );
                                    })}

                                    {/* Background Web Structure */}
                                    <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="1 4" />
                                    <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="1 4" />

                                    {/* Planet Nodes - User 1 (Teal) */}
                                    {data?.planets?.user1?.map((p: any) => {
                                        const { x, y } = getCoords(p.longitude);
                                        const role = data.aspects.find((a: any) => a.p1 === p.name)?.role1 || p.name;
                                        return (
                                            <g key={`u1-node-${p.name}`} className="group/node cursor-pointer" onClick={() => setSelectedDetail({
                                                role1: "Personal Pulse",
                                                role2: role,
                                                substance: {
                                                    potential: `Your core ${p.name.toLowerCase()} driver is fully active in this dynamic.`,
                                                    shadow: `Watch for over-projection of ${p.name.toLowerCase()} patterns onto the other.`,
                                                    protocol: `Integration Check: Observe where your ${role} creates either flow or resistance.`
                                                }
                                            })}>
                                                <motion.circle
                                                    cx={x} cy={y} r="6"
                                                    fill="url(#meshGrad)"
                                                    animate={{ r: [6, 8, 6], opacity: [0.3, 0.1, 0.3] }}
                                                    transition={{ duration: 4, repeat: Infinity }}
                                                />
                                                <circle cx={x} cy={y} r="2.5" fill="#2dd4bf" filter="url(#nodeGlow)" />
                                                <text x={x} y={y - 8} textAnchor="middle" className="text-[5px] fill-osia-teal-400 font-bold uppercase tracking-tighter opacity-0 group-hover/node:opacity-100 transition-opacity">
                                                    {role}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Planet Nodes - User 2 (Purple) */}
                                    {data?.planets?.user2?.map((p: any) => {
                                        const { x, y } = getCoords(p.longitude);
                                        const role = data.aspects.find((a: any) => a.p2 === p.name)?.role2 || p.name;
                                        return (
                                            <g key={`u2-node-${p.name}`} className="group/node cursor-pointer" onClick={() => setSelectedDetail({
                                                role1: `${targetName}'s Driver`,
                                                role2: role,
                                                substance: {
                                                    potential: `The other's ${p.name.toLowerCase()} pulse is clear and distinct within the mesh.`,
                                                    shadow: `Risk of misinterpreting the other's ${p.name.toLowerCase()} frequency through your own filters.`,
                                                    protocol: `Mirror Protocol: Question which parts of their ${role} trigger a personal reaction.`
                                                }
                                            })}>
                                                <motion.circle
                                                    cx={x} cy={y} r="6"
                                                    fill="rgba(168, 85, 247, 0.1)"
                                                    animate={{ r: [6, 8, 6], opacity: [0.3, 0.1, 0.3] }}
                                                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                                                />
                                                <circle cx={x} cy={y} r="2.5" fill="#a855f7" filter="url(#nodeGlow)" />
                                                <text x={x} y={y + 12} textAnchor="middle" className="text-[5px] fill-purple-400 font-bold uppercase tracking-tighter opacity-0 group-hover/node:opacity-100 transition-opacity">
                                                    {role}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Instruction Fade */}
                                <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                    <p className="text-[9px] text-osia-neutral-500 uppercase tracking-widest">Select a node or thread for deep insight</p>
                                </div>
                            </div>
                        </section>

                        {/* Interactive Insight Panel */}
                        <AnimatePresence mode="wait">
                            {selectedDetail ? (
                                <motion.div
                                    key="detail-panel"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="p-8 rounded-3xl bg-osia-teal-500/5 border border-osia-teal-500/20 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <button onClick={() => setSelectedDetail(null)} className="text-osia-neutral-500 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-osia-teal-400 uppercase tracking-widest mb-2">Focused Dynamic</h4>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl font-bold text-white uppercase tracking-tight">{selectedDetail.role1}</span>
                                                    <div className="h-px w-8 bg-white/20" />
                                                    <span className="text-xl font-bold text-white uppercase tracking-tight">{selectedDetail.role2}</span>
                                                </div>
                                                {selectedDetail.type && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-[10px] bg-osia-teal-500/20 text-osia-teal-400 px-3 py-1 rounded-full border border-osia-teal-500/30 uppercase font-bold tracking-tighter">
                                                            {selectedDetail.type} Protocol
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <h5 className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Potential</h5>
                                                    <p className="text-sm text-osia-neutral-300 leading-relaxed">{selectedDetail.substance.potential}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h5 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Shadow (Blind Spot)</h5>
                                                    <p className="text-sm text-osia-neutral-300 leading-relaxed">{selectedDetail.substance.shadow}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h5 className="text-[10px] font-bold text-osia-teal-400 uppercase tracking-widest">Optimization Protocol</h5>
                                                    <p className="text-sm text-osia-neutral-200 leading-relaxed font-semibold italic">"{selectedDetail.substance.protocol}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="default-panel"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center"
                                >
                                    <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.3em] mb-4">Select a specific interaction to begin deep analysis</h3>
                                    <div className="flex justify-center gap-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-osia-teal-400">
                                                <Zap size={18} />
                                            </div>
                                            <span className="text-[10px] text-osia-neutral-400 uppercase tracking-tighter">Nodes = Drivers</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-purple-400">
                                                <Activity size={18} />
                                            </div>
                                            <span className="text-[10px] text-osia-neutral-400 uppercase tracking-tighter">Threads = Connections</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Full Pattern List (Substance) */}
                        <section>
                            <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-osia-teal-400" />
                                Dynamic Synchrony • Detailed Layers
                            </h3>
                            <div className="space-y-4">
                                {data?.aspects?.map((aspect: any, i: number) => (
                                    <motion.div
                                        key={`list-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-osia-teal-500/30 transition-all cursor-pointer"
                                        onClick={() => setSelectedDetail(aspect)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white uppercase tracking-wider">{aspect.role1}</span>
                                                    <span className="text-[8px] text-osia-neutral-500 uppercase tracking-tighter">Active Agent</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className={`text-[10px] font-bold px-3 py-1 rounded-md mb-1 uppercase ${aspect.psychologicalFocus === 'friction' ? 'text-red-400 bg-red-400/10' : 'text-osia-teal-400 bg-osia-teal-400/10'}`}>
                                                        {aspect.type}
                                                    </div>
                                                    <div className="h-px w-full bg-white/10" />
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-sm font-bold text-white uppercase tracking-wider">{aspect.role2}</span>
                                                    <span className="text-[8px] text-osia-neutral-500 uppercase tracking-tighter">Resonant Agent</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 md:ml-12">
                                                <p className="text-xs text-osia-neutral-300 line-clamp-2 md:line-clamp-1 italic">
                                                    {aspect.substance.potential}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-osia-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Analyze</span>
                                                <Zap size={14} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer / Meta */}
                    <div className="p-6 bg-osia-neutral-950 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-osia-teal-500 shadow-[0_0_8px_#2dd4bf]" />
                                <span className="text-[9px] text-osia-neutral-500 uppercase tracking-widest">Active Field</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <span className="text-[9px] text-osia-neutral-500 uppercase tracking-widest">Topology Engine v4.0</span>
                        </div>
                        <p className="text-[9px] text-osia-neutral-600 uppercase tracking-widest">Confidential Psychological Synthesis</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

