import { motion } from 'framer-motion';

interface LayerComparisonProps {
    layers: Array<{
        layerId: number;
        layerName: string;
        user1Score: number;
        user2Score: number;
        alignment: number;
        synergy: boolean;
        gap: number;
        insight: string;
    }>;
    user1Name: string;
    user2Name: string;
}

export function LayerComparisonChart({ layers, user1Name, user2Name }: LayerComparisonProps) {
    const getAlignmentColor = (alignment: number) => {
        if (alignment >= 0.75) return 'bg-emerald-500';
        if (alignment >= 0.5) return 'bg-yellow-500';
        return 'bg-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em]">
                    15-Layer Alignment Map
                </h3>
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-osia-teal-500" />
                        <span className="text-osia-neutral-400">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-osia-neutral-400">{user2Name}</span>
                    </div>
                </div>
            </div>

            {/* Layer bars */}
            <div className="space-y-3">
                {layers.map((layer, index) => (
                    <motion.div
                        key={layer.layerId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                    >
                        {/* Layer label */}
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-osia-neutral-300 w-40 truncate">
                                {layer.layerName}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAlignmentColor(layer.alignment)} bg-opacity-20 text-white`}>
                                {Math.round(layer.alignment * 100)}% aligned
                            </span>
                        </div>

                        {/* Dual bar container */}
                        <div className="relative h-6 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                            {/* User 1 bar (from center left) */}
                            <motion.div
                                className="absolute top-0 right-1/2 h-full bg-gradient-to-l from-osia-teal-500/80 to-osia-teal-500/40 rounded-l"
                                initial={{ width: 0 }}
                                animate={{ width: `${layer.user1Score * 50}%` }}
                                transition={{ duration: 0.8, delay: index * 0.05 }}
                            />

                            {/* User 2 bar (from center right) */}
                            <motion.div
                                className="absolute top-0 left-1/2 h-full bg-gradient-to-r from-purple-500/80 to-purple-500/40 rounded-r"
                                initial={{ width: 0 }}
                                animate={{ width: `${layer.user2Score * 50}%` }}
                                transition={{ duration: 0.8, delay: index * 0.05 }}
                            />

                            {/* Center line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />

                            {/* Score labels */}
                            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                                <span className="text-[10px] font-bold text-white/70">
                                    {Math.round(layer.user1Score * 100)}
                                </span>
                                <span className="text-[10px] font-bold text-white/70">
                                    {Math.round(layer.user2Score * 100)}
                                </span>
                            </div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute left-0 right-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-osia-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-osia-neutral-300 shadow-xl">
                                {layer.insight}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
