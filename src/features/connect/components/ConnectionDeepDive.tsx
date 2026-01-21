import { motion } from 'framer-motion';
import { X, Activity, Percent, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { LayerComparisonChart } from './LayerComparisonChart';
import { SynergyFrictionCards } from './SynergyFrictionCards';
import { ImprovementRecommendations } from './ImprovementRecommendations';

interface Connection {
    userId: string;
    username: string;
    name?: string;
    avatarUrl?: string;
}

interface DeepDiveData {
    layerComparison: Array<{
        layerId: number;
        layerName: string;
        user1Score: number;
        user2Score: number;
        alignment: number;
        synergy: boolean;
        gap: number;
        insight: string;
    }>;
    synergyZones: Array<{
        area: string;
        strength: number;
        description: string;
        layers: number[];
    }>;
    frictionZones: Array<{
        area: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        layers: number[];
        improvementTip: string;
    }>;
    recommendations: Array<{
        id: string;
        title: string;
        description: string;
        category: 'communication' | 'understanding' | 'growth' | 'balance';
        priority: number;
        affectedLayers: number[];
        shareable: boolean;
    }>;
    overallAlignment: number;
}

interface SynastryData {
    score: number;
    summary: string;
    deepDive?: DeepDiveData;
}

interface ConnectionDeepDiveProps {
    connection: Connection;
    synastryData: SynastryData;
    onClose: () => void;
    currentUserName?: string;
}

export function ConnectionDeepDive({ connection, synastryData, onClose, currentUserName = 'You' }: ConnectionDeepDiveProps) {
    const targetName = connection.name || connection.username;
    const deepDive = synastryData.deepDive;

    const getAlignmentTrend = (alignment: number) => {
        if (alignment >= 0.7) return { icon: <ArrowUp className="w-4 h-4" />, color: 'text-emerald-400', label: 'Strong' };
        if (alignment >= 0.5) return { icon: <ArrowUp className="w-4 h-4" />, color: 'text-yellow-400', label: 'Moderate' };
        return { icon: <ArrowDown className="w-4 h-4" />, color: 'text-orange-400', label: 'Building' };
    };

    const trend = deepDive ? getAlignmentTrend(deepDive.overallAlignment) : null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
        >
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0f172a] to-osia-neutral-950 border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {/* Avatars */}
                        <div className="flex -space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-osia-teal-500/20 to-osia-teal-500/5 border-2 border-osia-teal-500/30 flex items-center justify-center text-white font-bold">
                                {currentUserName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden">
                                {connection.avatarUrl ? (
                                    <img src={connection.avatarUrl} alt={targetName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold">{targetName.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Connection Deep Dive
                            </h2>
                            <p className="text-sm text-osia-neutral-400">
                                You & {targetName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Overall alignment score */}
                        {deepDive && (
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <Percent className="w-5 h-5 text-osia-teal-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {Math.round(deepDive.overallAlignment * 100)}%
                                    </div>
                                    <div className={`text-[10px] uppercase tracking-wider flex items-center gap-1 ${trend?.color}`}>
                                        {trend?.icon}
                                        {trend?.label} Alignment
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-osia-neutral-400" />
                        </button>
                    </div>
                </div>

                {!deepDive ? (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-osia-neutral-500 mx-auto mb-4" />
                        <p className="text-osia-neutral-400">Deep dive data is being calculated...</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Summary Quote */}
                        <div className="relative p-6 rounded-xl bg-white/5 border border-white/5">
                            <div className="absolute top-0 left-0 w-1 h-full bg-osia-teal-500 rounded-full" />
                            <p className="text-lg text-osia-neutral-200 italic font-light pl-4">
                                "{synastryData.summary}"
                            </p>
                        </div>

                        {/* Layer Comparison Chart */}
                        <section>
                            <LayerComparisonChart
                                layers={deepDive.layerComparison}
                                user1Name={currentUserName}
                                user2Name={targetName}
                            />
                        </section>

                        {/* Synergy & Friction Cards */}
                        <section>
                            <SynergyFrictionCards
                                synergyZones={deepDive.synergyZones}
                                frictionZones={deepDive.frictionZones}
                            />
                        </section>

                        {/* Improvement Recommendations */}
                        <section>
                            <ImprovementRecommendations
                                recommendations={deepDive.recommendations}
                                targetUserId={connection.userId}
                                targetName={targetName}
                            />
                        </section>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-osia-teal-500 shadow-[0_0_8px_#2dd4bf]" />
                                <span className="text-[9px] text-osia-neutral-500 uppercase tracking-widest">
                                    Deep Field Active
                                </span>
                            </div>
                            <span className="text-[9px] text-osia-neutral-600 uppercase tracking-widest">
                                Relational Intelligence v2.0
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
