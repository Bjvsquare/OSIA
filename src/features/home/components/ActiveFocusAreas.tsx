import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Target, Calendar, TrendingUp, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   ActiveFocusAreas — Shows domains user is currently working on

   Displays 1-3 active focus areas with goal, days active,
   and progress indicators. Links to activity logging.
   ═══════════════════════════════════════════════════════════ */

interface FocusArea {
    domain: string;
    currentGoal?: string;
    activeSince?: string;
    healthScore: number;
}

interface ActiveFocusAreasProps {
    areas: FocusArea[];
    onRemoveFocus: (domain: string) => void;
    onAddFocus: () => void;
}

const DOMAIN_META: Record<string, { label: string; icon: string; gradient: string }> = {
    spiritual: { label: 'Spiritual Life', icon: '🕯️', gradient: 'from-violet-500/20 to-violet-600/5' },
    physical_health: { label: 'Physical Health', icon: '💪', gradient: 'from-emerald-500/20 to-emerald-600/5' },
    personal: { label: 'Personal Life', icon: '🪞', gradient: 'from-sky-500/20 to-sky-600/5' },
    relationships: { label: 'Key Relationships', icon: '❤️', gradient: 'from-rose-500/20 to-rose-600/5' },
    career: { label: 'Career/Job', icon: '📈', gradient: 'from-amber-500/20 to-amber-600/5' },
    business: { label: 'Business', icon: '🏢', gradient: 'from-blue-500/20 to-blue-600/5' },
    finances: { label: 'Finances', icon: '💰', gradient: 'from-yellow-500/20 to-yellow-600/5' },
};

export function ActiveFocusAreas({ areas, onRemoveFocus, onAddFocus }: ActiveFocusAreasProps) {
    const getDaysActive = (since?: string) => {
        if (!since) return 0;
        return Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24));
    };

    if (areas.length === 0) {
        return (
            <Card className="p-6 border-white/5 bg-white/[0.02]">
                <div className="text-center py-4">
                    <Target className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30 font-medium mb-3">No active focus areas</p>
                    <button
                        onClick={onAddFocus}
                        className="px-4 py-2 rounded-xl bg-osia-teal-500/10 text-osia-teal-500 text-[10px] font-black uppercase tracking-widest hover:bg-osia-teal-500/20 transition-colors"
                    >
                        Set Focus
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {areas.map((area, i) => {
                const meta = DOMAIN_META[area.domain] || { label: area.domain, icon: '📊', gradient: 'from-white/10 to-white/5' };
                const daysActive = getDaysActive(area.activeSince);

                return (
                    <motion.div
                        key={area.domain}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-4 border-white/5 bg-white/[0.02] overflow-hidden relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r ${meta.gradient} opacity-50`} />
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <span className="text-xl mt-0.5">{meta.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-white truncate">{meta.label}</h4>
                                            <span className="text-[8px] font-bold bg-osia-teal-500/15 text-osia-teal-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Active
                                            </span>
                                        </div>
                                        {area.currentGoal && (
                                            <p className="text-[11px] text-white/40 leading-relaxed truncate mb-1">
                                                🎯 {area.currentGoal}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-[9px] text-white/25">
                                            {daysActive > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {daysActive}d active
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" /> Score: {area.healthScore}/10
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveFocus(area.domain)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                                    title="Remove focus"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
            {areas.length < 3 && (
                <button
                    onClick={onAddFocus}
                    className="w-full p-3 rounded-2xl border border-dashed border-white/10 text-white/20 text-[10px] font-bold uppercase tracking-widest hover:border-osia-teal-500/30 hover:text-osia-teal-500/50 transition-all"
                >
                    + Add Focus Area
                </button>
            )}
        </div>
    );
}
