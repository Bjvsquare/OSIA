import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Clock, MessageSquare } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   PracticeLog — Daily timeline of practice completions

   Shows completions grouped by date with optional reflections.
   ═══════════════════════════════════════════════════════════ */

interface LogEntry {
    id: string;
    nudgeId: string;
    nudgeTitle: string;
    valueName: string;
    date: string;
    reflection?: string;
    timestamp: string;
}

interface PracticeLogProps {
    entries: LogEntry[];
    totalCompletions: number;
    activeDays: number;
}

export function PracticeLog({ entries, totalCompletions, activeDays }: PracticeLogProps) {
    // Group by date
    const grouped: Record<string, LogEntry[]> = {};
    for (const entry of entries) {
        const dateKey = entry.date;
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(entry);
    }

    const dateKeys = Object.keys(grouped);

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 border-white/5 bg-white/[0.02]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Completions</p>
                    <p className="text-xl font-black text-osia-teal-500">{totalCompletions}</p>
                </Card>
                <Card className="p-4 border-white/5 bg-white/[0.02]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Active Days</p>
                    <p className="text-xl font-black text-osia-teal-500">{activeDays}</p>
                </Card>
            </div>

            {/* Timeline */}
            {dateKeys.length === 0 ? (
                <Card className="p-6 border-white/5 bg-white/[0.02] text-center">
                    <p className="text-sm text-white/20">No practice completions yet. Start by completing a nudge!</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {dateKeys.map((dateKey, di) => (
                        <motion.div
                            key={dateKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: di * 0.05 }}
                        >
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <Clock className="w-3 h-3 text-white/15" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/25">
                                    {formatDate(dateKey)}
                                </span>
                                <span className="text-[9px] font-bold text-white/10">
                                    {grouped[dateKey].length} practice{grouped[dateKey].length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-2 border-l border-white/5 ml-1.5 pl-4">
                                {grouped[dateKey].map((entry) => (
                                    <div key={entry.id} className="relative">
                                        <div className="absolute -left-[20px] top-2 w-2 h-2 rounded-full bg-osia-teal-500/30" />
                                        <Card className="p-3 border-white/5 bg-white/[0.015]">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-white/60">{entry.nudgeTitle}</span>
                                                <span className="text-[8px] font-bold text-white/15 capitalize">{entry.valueName}</span>
                                            </div>
                                            {entry.reflection && (
                                                <div className="flex items-start gap-1.5 mt-1.5">
                                                    <MessageSquare className="w-3 h-3 text-white/10 mt-0.5 flex-shrink-0" />
                                                    <p className="text-[10px] text-white/25 italic leading-relaxed">
                                                        "{entry.reflection}"
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatDate(dateStr: string): string {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}
