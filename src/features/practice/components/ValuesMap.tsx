import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Star, Hash, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   ValuesMap — Visual display of user's discovered values

   Shows each value as a card with name, self-rating,
   source (admired vs anti-flip), and linked nudge count.
   ═══════════════════════════════════════════════════════════ */

interface Value {
    id: string;
    name: string;
    definition: string;
    source: 'admired' | 'anti_flip' | 'direct';
    selfRating: number;
    timeSpentRating: string;
    tomorrowAction?: string;
}

interface ValuesMapProps {
    values: Value[];
    nudgeCounts: Record<string, number>;
    onValueClick?: (valueId: string) => void;
}

const sourceColors: Record<string, string> = {
    admired: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    anti_flip: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    direct: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
};

const sourceLabels: Record<string, string> = {
    admired: 'Admired',
    anti_flip: 'Discovered',
    direct: 'Direct',
};

export function ValuesMap({ values, nudgeCounts, onValueClick }: ValuesMapProps) {
    if (values.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 px-1">
                <Sparkles className="w-4 h-4 text-osia-teal-500/70" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                    Your Values
                </h3>
                <span className="text-[9px] font-bold text-white/15 ml-auto">
                    {values.length} discovered
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {values.map((value, i) => (
                    <motion.div
                        key={value.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card
                            className={`p-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${onValueClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onValueClick?.(value.id)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-bold text-white capitalize">{value.name}</h4>
                                <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${sourceColors[value.source]}`}>
                                    {sourceLabels[value.source]}
                                </span>
                            </div>

                            {/* Self-rating bar */}
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-3 h-3 text-white/20" />
                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${value.selfRating >= 7 ? 'bg-green-400' :
                                                value.selfRating >= 4 ? 'bg-amber-400' : 'bg-red-400'
                                            }`}
                                        style={{ width: `${(value.selfRating / 10) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-white/30">{value.selfRating}/10</span>
                            </div>

                            {/* Nudge count */}
                            <div className="flex items-center gap-1.5 text-[9px] text-white/20">
                                <Hash className="w-3 h-3" />
                                <span>{nudgeCounts[value.id] || 0} practice{(nudgeCounts[value.id] || 0) !== 1 ? 's' : ''}</span>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
