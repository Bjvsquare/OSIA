import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';

/* ═══════════════════════════════════════════════════════════
   ScoreTrajectory — Premium SVG area chart

   • Smooth Bézier curves with animated path draw
   • Interactive hover tooltips showing score + date
   • Crosshair line on hover
   • Domain pills with ring highlight
   • Animated gradient fill
   • Empty state with encouraging CTA
   ═══════════════════════════════════════════════════════════ */

const DOMAIN_COLORS: Record<string, string> = {
    spiritual: '#a78bfa',
    physical_health: '#22c55e',
    personal: '#f59e0b',
    relationships: '#ec4899',
    career: '#3b82f6',
    business: '#6366f1',
    finances: '#14b8a6',
};

const DOMAIN_LABELS: Record<string, string> = {
    spiritual: 'Spiritual',
    physical_health: 'Physical',
    personal: 'Personal',
    relationships: 'Relations',
    career: 'Career',
    business: 'Business',
    finances: 'Finances',
};

const DOMAIN_ICONS: Record<string, string> = {
    spiritual: '🕯️',
    physical_health: '💪',
    personal: '🪞',
    relationships: '❤️',
    career: '📈',
    business: '🏢',
    finances: '💰',
};

interface ScoreTrajectoryProps {
    scoreTrendByArea: Record<string, { date: string; score: number }[]>;
}

export function ScoreTrajectory({ scoreTrendByArea }: ScoreTrajectoryProps) {
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; score: number; date: string; screenX: number; screenY: number } | null>(null);
    const domains = Object.keys(scoreTrendByArea);

    const { points, dates, maxScore } = useMemo(() => {
        if (selectedDomain && scoreTrendByArea[selectedDomain]) {
            const trend = scoreTrendByArea[selectedDomain].slice(-30);
            return {
                points: trend.map(p => p.score),
                dates: trend.map(p => p.date),
                maxScore: 10,
            };
        }

        const dateMap: Record<string, number[]> = {};
        for (const domain of domains) {
            for (const point of scoreTrendByArea[domain] || []) {
                (dateMap[point.date] ||= []).push(point.score);
            }
        }

        const sorted = Object.entries(dateMap)
            .map(([date, scores]) => ({
                date,
                score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

        return {
            points: sorted.map(p => p.score),
            dates: sorted.map(p => p.date),
            maxScore: 10,
        };
    }, [scoreTrendByArea, selectedDomain, domains]);

    // SVG dimensions
    const W = 600;
    const H = 200;
    const padX = 5;
    const padY = 15;
    const padRight = 25;
    const chartW = W - padX - padRight;
    const chartH = H - padY * 2;

    const activeColor = selectedDomain
        ? DOMAIN_COLORS[selectedDomain] || '#14b8a6'
        : '#14b8a6';

    const coords = useMemo(() => {
        return points.map((v, i) => ({
            x: padX + (i / Math.max(points.length - 1, 1)) * chartW,
            y: padY + chartH - (v / maxScore) * chartH,
            score: v,
            date: dates[i],
        }));
    }, [points, dates, chartW, chartH, maxScore, padX, padY]);

    const pathD = useMemo(() => {
        if (coords.length < 2) return '';
        let d = `M ${coords[0].x},${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1];
            const curr = coords[i];
            const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
            const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
            d += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
        }
        return d;
    }, [coords]);

    const areaD = useMemo(() => {
        if (!pathD || coords.length < 2) return '';
        const lastX = coords[coords.length - 1].x;
        const firstX = coords[0].x;
        const bottom = padY + chartH;
        return `${pathD} L ${lastX},${bottom} L ${firstX},${bottom} Z`;
    }, [pathD, coords, chartH, padY]);

    const hasData = points.length >= 2;

    // Date labels
    const dateLabels = useMemo(() => {
        if (dates.length === 0) return [];
        const step = Math.max(1, Math.floor(dates.length / 5));
        return dates
            .filter((_, i) => i % step === 0 || i === dates.length - 1)
            .map(d => {
                const dt = new Date(d);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return {
                    label: `${monthNames[dt.getMonth()]} ${dt.getDate()}`,
                    x: padX + (dates.indexOf(d) / Math.max(dates.length - 1, 1)) * chartW,
                };
            });
    }, [dates, chartW, padX]);

    // Score change indicator
    const scoreChange = useMemo(() => {
        if (points.length < 2) return null;
        const first = points[0];
        const last = points[points.length - 1];
        const diff = Math.round((last - first) * 10) / 10;
        return diff;
    }, [points]);

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (coords.length < 2) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * W;

        // Find closest point
        let closest = coords[0];
        let minDist = Infinity;
        for (const coord of coords) {
            const dist = Math.abs(coord.x - mouseX);
            if (dist < minDist) {
                minDist = dist;
                closest = coord;
            }
        }

        setHoveredPoint({
            x: closest.x,
            y: closest.y,
            score: closest.score,
            date: closest.date,
            screenX: e.clientX,
            screenY: e.clientY,
        });
    }, [coords]);

    const formatTooltipDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    return (
        <Card className="p-5 border-white/[0.06] bg-[#0a1128]/60 backdrop-blur-xl overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                        Score Trajectory
                    </h2>
                    {scoreChange !== null && (
                        <span className={`text-[9px] font-bold ${scoreChange > 0 ? 'text-emerald-400' : scoreChange < 0 ? 'text-rose-400' : 'text-white/20'
                            }`}>
                            {scoreChange > 0 ? '↑' : scoreChange < 0 ? '↓' : '—'} {Math.abs(scoreChange)} pts in period
                        </span>
                    )}
                </div>
            </div>

            {/* Domain pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                <button
                    onClick={() => setSelectedDomain(null)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${!selectedDomain
                        ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                        : 'bg-white/5 text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.08]'
                        }`}
                >
                    All
                </button>
                {domains.map(domain => (
                    <button
                        key={domain}
                        onClick={() => setSelectedDomain(domain === selectedDomain ? null : domain)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${selectedDomain === domain
                            ? 'border shadow-sm'
                            : 'bg-white/5 text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.08]'
                            }`}
                        style={selectedDomain === domain ? {
                            backgroundColor: `${DOMAIN_COLORS[domain]}15`,
                            color: DOMAIN_COLORS[domain],
                            borderColor: `${DOMAIN_COLORS[domain]}40`,
                            boxShadow: `0 0 8px ${DOMAIN_COLORS[domain]}20`,
                        } : {}}
                    >
                        <span className="mr-1">{DOMAIN_ICONS[domain]}</span>
                        {DOMAIN_LABELS[domain] || domain}
                    </button>
                ))}
            </div>

            {/* Chart */}
            {hasData ? (
                <motion.div
                    key={selectedDomain || 'all'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative"
                >
                    <svg
                        viewBox={`0 0 ${W} ${H + 24}`}
                        className="w-full cursor-crosshair"
                        preserveAspectRatio="xMidYMid meet"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredPoint(null)}
                    >
                        <defs>
                            <linearGradient id={`traj-fill-${activeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={activeColor} stopOpacity={0.2} />
                                <stop offset="60%" stopColor={activeColor} stopOpacity={0.05} />
                                <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
                            </linearGradient>
                            <filter id="point-glow">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Grid lines */}
                        {[2, 4, 6, 8, 10].map(v => {
                            const y = padY + chartH - (v / maxScore) * chartH;
                            return (
                                <g key={v}>
                                    <line
                                        x1={padX}
                                        y1={y}
                                        x2={padX + chartW}
                                        y2={y}
                                        stroke="white"
                                        strokeOpacity={0.04}
                                        strokeWidth={1}
                                        strokeDasharray="4 6"
                                    />
                                    <text
                                        x={padX + chartW + 8}
                                        y={y + 3}
                                        fill="white"
                                        fillOpacity={0.12}
                                        fontSize="9"
                                        fontWeight="700"
                                    >
                                        {v}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Area fill */}
                        <path
                            d={areaD}
                            fill={`url(#traj-fill-${activeColor.replace('#', '')})`}
                            opacity={1}
                        />

                        {/* Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke={activeColor}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Hover crosshair */}
                        {hoveredPoint && (
                            <>
                                <line
                                    x1={hoveredPoint.x}
                                    y1={padY}
                                    x2={hoveredPoint.x}
                                    y2={padY + chartH}
                                    stroke={activeColor}
                                    strokeOpacity={0.3}
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                                <circle
                                    cx={hoveredPoint.x}
                                    cy={hoveredPoint.y}
                                    r={5}
                                    fill={activeColor}
                                    stroke="white"
                                    strokeWidth={2}
                                    filter="url(#point-glow)"
                                />
                            </>
                        )}

                        {/* Data points (subtle) */}
                        {coords.map((coord, i) => (
                            <circle
                                key={i}
                                cx={coord.x}
                                cy={coord.y}
                                r={i === coords.length - 1 ? 3 : 1.5}
                                fill={activeColor}
                                opacity={i === coords.length - 1 ? 0.9 : 0.3}
                            />
                        ))}

                        {/* Date labels */}
                        {dateLabels.map((dl, i) => (
                            <text
                                key={i}
                                x={dl.x}
                                y={H + 16}
                                fill="white"
                                fillOpacity={0.12}
                                fontSize="8"
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {dl.label}
                            </text>
                        ))}
                    </svg>

                    {/* Floating tooltip */}
                    <AnimatePresence>
                        {hoveredPoint && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute pointer-events-none z-10"
                                style={{
                                    left: `${(hoveredPoint.x / W) * 100}%`,
                                    top: `${((hoveredPoint.y - 40) / (H + 24)) * 100}%`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <div className="bg-[#0d1a3a] border border-white/10 rounded-lg px-3 py-1.5 shadow-xl backdrop-blur-xl">
                                    <div className="text-xs font-black text-white">
                                        {hoveredPoint.score}<span className="text-white/30 font-bold">/10</span>
                                    </div>
                                    <div className="text-[8px] font-bold text-white/25">
                                        {formatTooltipDate(hoveredPoint.date)}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[200px] gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-xs text-white/20 font-bold text-center">
                        Update your life area scores to see trends
                    </p>
                    <p className="text-[10px] text-white/10 font-medium">
                        Scores are tracked each time you update them
                    </p>
                </div>
            )}
        </Card>
    );
}
