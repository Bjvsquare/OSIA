import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { Clock, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';

interface Trait {
    layerId: number;
    traitId: string;
    score: number;
    confidence: number;
    description?: string;
}

interface BlueprintSnapshot {
    id: string;
    timestamp: string;
    source: string;
    traits: Trait[];
}

interface HistoryItem {
    id: string;
    timestamp: string;
    source: string;
}

interface UserBlueprintDetailProps {
    userId: string;
}

const LAYERS = [
    { id: 1, cluster: "Cluster A – Core Being", name: "Core Disposition", description: "Baseline temperament and inner climate." },
    { id: 2, cluster: "Cluster A – Core Being", name: "Energy Orientation", description: "How energy is gained, lost, and paced." },
    { id: 3, cluster: "Cluster A – Core Being", name: "Perception & Information Processing", description: "How information is taken in and structured." },
    { id: 4, cluster: "Cluster B – Cognitive & Motivational", name: "Decision Logic", description: "How conclusions are reached and trade-offs made." },
    { id: 5, cluster: "Cluster B – Cognitive & Motivational", name: "Motivational Drivers", description: "What deeply motivates and sustains effort." },
    { id: 6, cluster: "Cluster B – Cognitive & Motivational", name: "Stress & Pressure Patterns", description: "How pressure is experienced and responded to." },
    { id: 7, cluster: "Cluster C – Emotional & Behavioural", name: "Emotional Regulation & Expression", description: "How emotions are processed and shared." },
    { id: 8, cluster: "Cluster C – Emotional & Behavioural", name: "Behavioural Rhythm & Execution", description: "Work style, pacing, and follow-through." },
    { id: 9, cluster: "Cluster C – Emotional & Behavioural", name: "Communication Mode", description: "Preferred ways of expressing and receiving meaning." },
    { id: 10, cluster: "Cluster D – Relational & Social", name: "Relational Energy & Boundaries", description: "How connection, distance, and closeness are managed." },
    { id: 11, cluster: "Cluster D – Relational & Social", name: "Relational Patterning", description: "Repeating patterns in key relationships." },
    { id: 12, cluster: "Cluster D – Relational & Social", name: "Social Role & Influence Expression", description: "How a person shows up in groups and power structures." },
    { id: 13, cluster: "Cluster E – Trajectory & Development", name: "Identity Coherence & Maturity", description: "How integrated and grounded the sense of self is." },
    { id: 14, cluster: "Cluster E – Trajectory & Development", name: "Growth Arc & Learning Orientation", description: "Long-term developmental direction and learning style." },
    { id: 15, cluster: "Cluster E – Trajectory & Development", name: "Life Navigation & Current Edge", description: "How major decisions are made and where growth pressure sits now." }
];

export function UserBlueprintDetail({ userId }: UserBlueprintDetailProps) {
    const { auth } = useAuth();
    const { showToast } = useToast();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<BlueprintSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [focusedLayer, setFocusedLayer] = useState<number | null>(null);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/admin/blueprint/${userId}/history`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setHistory(data);
            if (data.length > 0 && !selectedSnapshotId) {
                setSelectedSnapshotId(data[0].id);
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSnapshotDetail = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/blueprint/snapshot/${id}`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch snapshot details');
            const data = await response.json();
            setSnapshot(data);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setHistory([]);
        setSelectedSnapshotId(null);
        setSnapshot(null);
        setIsLoading(true);
        fetchHistory();
    }, [userId]);

    useEffect(() => {
        if (selectedSnapshotId) {
            fetchSnapshotDetail(selectedSnapshotId);
        }
    }, [selectedSnapshotId]);

    const activeFocusedLayer = focusedLayer ? LAYERS.find(l => l.id === focusedLayer) : null;
    const activeFocusedTraits = focusedLayer ? snapshot?.traits.filter(t => t.layerId === focusedLayer) : [];

    if (isLoading && !snapshot) {
        return <div className="text-osia-neutral-500 text-center py-20 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Intelligence Streams...</div>;
    }

    return (
        <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* History Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-500 mb-2 px-2">Snapshot Timeline</div>
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedSnapshotId(item.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all group ${selectedSnapshotId === item.id
                                ? 'bg-osia-teal-500/10 border-osia-teal-500/30'
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Clock size={14} className={selectedSnapshotId === item.id ? 'text-osia-teal-500' : 'text-osia-neutral-600'} />
                                <div className="space-y-1">
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${selectedSnapshotId === item.id ? 'text-white' : 'text-osia-neutral-400'}`}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-[9px] text-osia-neutral-600 font-bold uppercase tracking-tighter group-hover:text-osia-neutral-400 transition-colors">
                                        {item.source.replace(/_/g, ' ')}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content: 15 Layers grouped by Cluster */}
                <div className="lg:col-span-3 space-y-12">
                    {/* Persona Thesis Overview (Module 1 Synthesis) */}
                    {snapshot && (
                        <section className="bg-osia-teal-500/5 border border-osia-teal-500/10 rounded-2xl p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-osia-teal-500/20 flex items-center justify-center">
                                    <Info className="text-osia-teal-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-osia-teal-500 uppercase tracking-[0.2em]">Foundation Synthesis</h3>
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Persona Thesis Blueprint</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-osia-neutral-500 uppercase tracking-widest border-b border-white/5 pb-2">Foundational Overview</div>
                                    <p className="text-xs text-osia-neutral-300 font-bold leading-relaxed">
                                        {snapshot.traits.find(t => t.layerId === 1)?.description || "Synthesizing foundational signals..."}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-osia-neutral-500 uppercase tracking-widest border-b border-white/5 pb-2">Cognitive & Emotional Blueprint</div>
                                    <p className="text-xs text-osia-neutral-300 font-bold leading-relaxed">
                                        {snapshot.traits.find(t => t.layerId === 3)?.description || "Awaiting cognitive mapping..."}
                                        {" "}
                                        {snapshot.traits.find(t => t.layerId === 7)?.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center text-[9px] font-black text-osia-neutral-600 uppercase tracking-tighter">
                                <span>Intelligence Standard: Professional Interpretation</span>
                                <span>Engine: Deep Persona Synthesis v1.0</span>
                            </div>
                        </section>
                    )}

                    {[
                        "Cluster A – Core Being",
                        "Cluster B – Cognitive & Motivational",
                        "Cluster C – Emotional & Behavioural",
                        "Cluster D – Relational & Social",
                        "Cluster E – Trajectory & Development"
                    ].map((clusterName) => (
                        <div key={clusterName} className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-osia-teal-500">{clusterName}</h3>
                                <div className="h-px flex-1 bg-osia-teal-500/10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {LAYERS.filter(l => l.cluster === clusterName).map((layer) => {
                                    const traits = snapshot?.traits.filter(t => t.layerId === layer.id) || [];
                                    const hasData = traits.length > 0;

                                    return (
                                        <Card
                                            key={layer.id}
                                            onClick={() => hasData && setFocusedLayer(layer.id)}
                                            className={`p-5 transition-all bg-[#0a1128]/40 border-white/5 ${!hasData ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-osia-teal-500/30 cursor-pointer group/card active:scale-[0.98]'}`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${hasData ? 'bg-osia-teal-500/20 text-osia-teal-500' : 'bg-white/5 text-osia-neutral-600'}`}>
                                                        {layer.id}
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white">{layer.name}</div>
                                                </div>
                                                {hasData ? (
                                                    <Info size={14} className="text-osia-teal-500 group-hover/card:scale-110 transition-transform" />
                                                ) : (
                                                    <AlertCircle size={14} className="text-osia-neutral-700" />
                                                )}
                                            </div>

                                            <div className="min-h-[60px]">
                                                {hasData ? (
                                                    <p className="text-[10px] text-osia-neutral-300 font-bold leading-relaxed line-clamp-3">
                                                        {traits[0].description || "Signal processing complete. Awaiting narrative synthesis."}
                                                    </p>
                                                ) : (
                                                    <p className="text-[9px] text-osia-neutral-600 font-bold leading-relaxed italic">
                                                        {layer.description}
                                                    </p>
                                                )}
                                            </div>

                                            {hasData && (
                                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                                    <div className="text-[8px] font-black text-osia-teal-500 uppercase tracking-widest">
                                                        Deep Detail Available
                                                    </div>
                                                    <div className="text-[8px] font-black text-osia-neutral-500 uppercase">
                                                        {(traits[0].confidence * 100).toFixed(0)}% Conf
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Qualitative Detail Modal */}
            <AnimatePresence>
                {focusedLayer && activeFocusedLayer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFocusedLayer(null)}
                            className="absolute inset-0 bg-[#02050f]/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a1128] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-osia-teal-500/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-osia-teal-500/20 flex items-center justify-center text-xs font-black text-osia-teal-500 border border-osia-teal-500/20">
                                        {activeFocusedLayer.id}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-osia-teal-500 uppercase tracking-[0.2em] mb-1">{activeFocusedLayer.cluster}</div>
                                        <h2 className="text-base font-black text-white uppercase tracking-widest">{activeFocusedLayer.name}</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFocusedLayer(null)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-osia-neutral-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                <section className="space-y-4">
                                    <div className="text-[10px] font-black text-osia-neutral-500 uppercase tracking-widest flex items-center gap-3">
                                        Evidence & Foundational Insight
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    {activeFocusedTraits.map((t, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="p-5 rounded-xl bg-white/5 border border-white/5 leading-relaxed text-osia-neutral-200 font-bold text-sm">
                                                {t.description || "Synthesizing qualitative evidence streams..."}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="text-[9px] font-black text-osia-neutral-600 uppercase tracking-widest mb-1">Signal Protocol</div>
                                                    <div className="text-[10px] font-black text-white uppercase tracking-tighter">{t.traitId}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="text-[9px] font-black text-osia-neutral-600 uppercase tracking-widest mb-1">Confidence Rating</div>
                                                    <div className="text-[10px] font-black text-white uppercase tracking-tighter">{(t.confidence * 100).toFixed(0)}% Certainty</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </section>

                                <section className="space-y-4">
                                    <div className="text-[10px] font-black text-osia-neutral-500 uppercase tracking-widest flex items-center gap-3">
                                        Layer Definition
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <p className="text-xs text-osia-neutral-400 font-bold leading-loose">
                                        {activeFocusedLayer.description} This layer operates as a core anchor within the digital twin model,
                                        providing the baseline orientation for the user's {activeFocusedLayer.name.toLowerCase()}.
                                        In the current development phase, this data is used to establish the deterministic foundation of the intelligence profile.
                                    </p>
                                </section>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => setFocusedLayer(null)}
                                    className="px-6 py-2 rounded-xl bg-osia-teal-500 text-[#02050f] font-black text-[10px] uppercase tracking-widest hover:bg-osia-teal-400 transition-colors shadow-[0_0_20px_rgba(56,163,165,0.3)]"
                                >
                                    Dismiss Analysis
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
