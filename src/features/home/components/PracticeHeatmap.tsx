import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';

/* ═══════════════════════════════════════════════════════════
   PracticeHeatmap — Premium GitHub-style activity grid

   • Interactive cell hover with floating tooltip
   • Animated cell entrance with stagger
   • Gradient intensity with subtle glow on active days
   • Today highlight ring
   • Activity streak indicator
   • Total stats summary
   ═══════════════════════════════════════════════════════════ */

interface PracticeHeatmapProps {
    completionsByDay: { date: string; count: number }[];
    activeDaysThisWeek?: number;
    totalCompletions?: number;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensityStyle(count: number): { bg: string; glow?: string } {
    if (count === 0) return { bg: 'rgba(255,255,255,0.02)' };
    if (count === 1) return { bg: 'rgba(20,184,166,0.20)', glow: 'rgba(20,184,166,0.1)' };
    if (count === 2) return { bg: 'rgba(20,184,166,0.40)', glow: 'rgba(20,184,166,0.15)' };
    if (count === 3) return { bg: 'rgba(20,184,166,0.60)', glow: 'rgba(20,184,166,0.2)' };
    return { bg: 'rgba(20,184,166,0.80)', glow: 'rgba(20,184,166,0.25)' };
}

export function PracticeHeatmap({
    completionsByDay,
    activeDaysThisWeek = 0,
    totalCompletions = 0,
}: PracticeHeatmapProps) {
    const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    const { weeks, months, total, longestStreak, todayStr } = useMemo(() => {
        const countMap: Record<string, number> = {};
        for (const entry of completionsByDay) {
            countMap[entry.date] = entry.count;
        }

        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const days: { date: string; count: number; dayOfWeek: number }[] = [];

        for (let i = 83; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                count: countMap[dateStr] || 0,
                dayOfWeek: d.getDay(),
            });
        }

        // Calculate longest streak
        let currentStreak = 0;
        let bestStreak = 0;
        for (const day of days) {
            if (day.count > 0) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        const weeksList: typeof days[] = [];
        let currentWeek: typeof days = [];
        for (const day of days) {
            currentWeek.push(day);
            if (day.dayOfWeek === 6) {
                weeksList.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) weeksList.push(currentWeek);

        const monthLabels: { label: string; weekIndex: number }[] = [];
        let lastMonth = -1;
        for (let wi = 0; wi < weeksList.length; wi++) {
            const firstDay = weeksList[wi][0];
            const dt = new Date(firstDay.date);
            const month = dt.getMonth();
            if (month !== lastMonth) {
                monthLabels.push({ label: MONTH_NAMES[month], weekIndex: wi });
                lastMonth = month;
            }
        }

        const totalCount = days.reduce((sum, d) => sum + d.count, 0);

        return { weeks: weeksList, months: monthLabels, total: totalCount, longestStreak: bestStreak, todayStr: todayString };
    }, [completionsByDay]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${dayNames[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    };

    return (
        <Card className="p-5 border-white/[0.06] bg-[#0a1128]/60 backdrop-blur-xl relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                        Practice Activity
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-bold text-white/25">
                            {total} total
                        </span>
                        <span className="text-[9px] font-bold text-white/25">•</span>
                        <span className="text-[9px] font-bold text-white/25">
                            {activeDaysThisWeek} active this week
                        </span>
                        {longestStreak > 0 && (
                            <>
                                <span className="text-[9px] font-bold text-white/25">•</span>
                                <span className="text-[9px] font-bold text-orange-400/50">
                                    🔥 {longestStreak}d best streak
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Heatmap grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="overflow-x-auto"
            >
                <div className="flex gap-[3px] min-w-fit">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] mr-1 pt-[18px]">
                        {DAY_LABELS.map((label, i) => (
                            <div key={i} className="h-[13px] flex items-center">
                                <span className="text-[7px] font-bold text-white/15 w-5 text-right">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Weeks */}
                    <div>
                        {/* Month labels */}
                        <div className="flex gap-[3px] mb-1 h-[14px]">
                            {weeks.map((_, wi) => {
                                const ml = months.find(m => m.weekIndex === wi);
                                return (
                                    <div key={wi} className="w-[13px] flex items-center justify-center">
                                        {ml && (
                                            <span className="text-[7px] font-bold text-white/20">
                                                {ml.label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day cells */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-[3px]">
                                    {wi === 0 && week[0]?.dayOfWeek > 0 && (
                                        Array.from({ length: week[0].dayOfWeek }).map((_, pi) => (
                                            <div key={`pad-${pi}`} className="w-[13px] h-[13px]" />
                                        ))
                                    )}
                                    {week.map((day) => {
                                        const style = getIntensityStyle(day.count);
                                        const isToday = day.date === todayStr;
                                        return (
                                            <motion.div
                                                key={day.date}
                                                className="w-[13px] h-[13px] rounded-[3px] cursor-pointer transition-transform hover:scale-125"
                                                style={{
                                                    backgroundColor: style.bg,
                                                    boxShadow: isToday
                                                        ? '0 0 0 1.5px rgba(20,184,166,0.5)'
                                                        : style.glow
                                                            ? `0 0 4px ${style.glow}`
                                                            : undefined,
                                                }}
                                                onMouseEnter={(e) => {
                                                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                                                    setTooltip({
                                                        date: day.date,
                                                        count: day.count,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top,
                                                    });
                                                }}
                                                onMouseLeave={() => setTooltip(null)}
                                                whileHover={{ scale: 1.3 }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[7px] font-bold text-white/15">Less</span>
                    {[0, 1, 2, 3, 4].map(level => (
                        <div
                            key={level}
                            className="w-[10px] h-[10px] rounded-[2px]"
                            style={{ backgroundColor: getIntensityStyle(level).bg }}
                        />
                    ))}
                    <span className="text-[7px] font-bold text-white/15">More</span>
                </div>
                <span className="text-[8px] font-bold text-white/10">
                    12 weeks
                </span>
            </div>

            {/* Floating tooltip */}
            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed z-50 pointer-events-none"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y - 8,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="bg-[#0d1a3a] border border-white/10 rounded-lg px-3 py-1.5 shadow-xl backdrop-blur-xl whitespace-nowrap">
                            <div className="text-[10px] font-black text-white">
                                {tooltip.count} completion{tooltip.count !== 1 ? 's' : ''}
                            </div>
                            <div className="text-[8px] font-bold text-white/25">
                                {formatDate(tooltip.date)}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
