import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Target, TrendingUp, ArrowUp, ArrowDown, Minus, Dna, ListChecks } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

/* ═══════════════════════════════════════════════════════════
   ActivityPulse — Premium 4-card sparkline stat strip

   • Animated rolling counters
   • ↑↓ change deltas vs last week
   • Pulsing glow on last sparkline point
   • Gradient card accents
   • Staggered entrance animations
   ═══════════════════════════════════════════════════════════ */

interface SparklineData {
    date: string;
    count?: number;
    score?: number;
}

interface ActivityPulseProps {
    practiceStreak: number;
    weeklyCompletions: number;
    weeklyRefinements: number;
    overallScore: number;
    completionSparkline: SparklineData[];
    refinementSparkline: SparklineData[];
    scoreSparkline: SparklineData[];
    completionDelta?: number;
    refinementDelta?: number;
    scoreDelta?: number;
    protocolsActive?: number;
    blueprintDepth?: number;
}

/* ── Animated Counter ──────────────────────────────────── */
function AnimatedCounter({ value, suffix = '', decimals = false }: { value: number; suffix?: string; decimals?: boolean }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const duration = 800;
        const steps = 30;
        const stepTime = duration / steps;
        const start = display;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (value - start) * eased;
            setDisplay(current);

            if (step >= steps) {
                clearInterval(timer);
                setDisplay(value);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    const formatted = decimals
        ? (Math.round(display * 10) / 10).toFixed(1)
        : Math.round(display).toString();

    return (
        <span className="text-2xl font-black text-white tracking-tight tabular-nums">
            {formatted}
            {suffix && <span className="text-sm font-bold text-white/40 ml-0.5">{suffix}</span>}
        </span>
    );
}

/* ── Delta Badge ────────────────────────────────────────── */
function DeltaBadge({ delta }: { delta: number }) {
    if (delta === 0) {
        return (
            <span className="flex items-center gap-0.5 text-[8px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full">
                <Minus className="w-2.5 h-2.5" /> 0%
            </span>
        );
    }
    const isPositive = delta > 0;
    return (
        <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isPositive
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-rose-400 bg-rose-500/10'
            }`}>
            {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {Math.abs(delta)}%
        </span>
    );
}

/* ── Premium Sparkline ──────────────────────────────────── */
function Sparkline({
    data,
    valueKey = 'count',
    color = '#14b8a6',
    width = 80,
    height = 32,
}: {
    data: SparklineData[];
    valueKey?: 'count' | 'score';
    color?: string;
    width?: number;
    height?: number;
}) {
    if (!data || data.length < 2) return null;

    const values = data.map((d) => (valueKey === 'score' ? (d.score ?? 0) : (d.count ?? 0)));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const coords = values.map((v, i) => ({
        x: (i / (values.length - 1)) * width,
        y: height - ((v - min) / range) * (height - 6) - 3,
    }));

    // Smooth Bézier path
    let linePath = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
        const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
        linePath += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    const lastCoord = coords[coords.length - 1];
    const uniqueId = `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`;

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={`${uniqueId}-fill`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <filter id={`${uniqueId}-glow`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${uniqueId}-fill)`} />

            {/* Line */}
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Pulsing glow dot on last point */}
            <circle cx={lastCoord.x} cy={lastCoord.y} r={6} fill={color} opacity={0.15} filter={`url(#${uniqueId}-glow)`}>
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastCoord.x} cy={lastCoord.y} r={2.5} fill={color} />
        </svg>
    );
}

/* ── Main Component ─────────────────────────────────────── */
export function ActivityPulse({
    practiceStreak,
    weeklyCompletions,
    weeklyRefinements,
    overallScore,
    completionSparkline,
    refinementSparkline,
    scoreSparkline,
    completionDelta = 0,
    refinementDelta = 0,
    scoreDelta = 0,
    protocolsActive = 0,
    blueprintDepth = 0,
}: ActivityPulseProps) {
    const cards = [
        {
            label: 'Streak',
            value: practiceStreak,
            suffix: 'd',
            icon: Flame,
            color: '#f97316',
            accentGlow: 'from-orange-500/10 via-transparent to-transparent',
            sparkData: completionSparkline,
            sparkKey: 'count' as const,
            delta: null as number | null,
            decimals: false,
        },
        {
            label: 'This Week',
            value: weeklyCompletions,
            suffix: '',
            icon: CheckCircle2,
            color: '#14b8a6',
            accentGlow: 'from-teal-500/10 via-transparent to-transparent',
            sparkData: completionSparkline,
            sparkKey: 'count' as const,
            delta: completionDelta,
            decimals: false,
        },
        {
            label: 'Refinements',
            value: weeklyRefinements,
            suffix: '',
            icon: Target,
            color: '#a78bfa',
            accentGlow: 'from-violet-500/10 via-transparent to-transparent',
            sparkData: refinementSparkline,
            sparkKey: 'count' as const,
            delta: refinementDelta,
            decimals: false,
        },
        {
            label: 'Score',
            value: overallScore,
            suffix: '/10',
            icon: TrendingUp,
            color: '#22d3ee',
            accentGlow: 'from-cyan-500/10 via-transparent to-transparent',
            sparkData: scoreSparkline,
            sparkKey: 'score' as const,
            delta: scoreDelta,
            decimals: true,
        },
        {
            label: 'Protocols',
            value: protocolsActive,
            suffix: '',
            icon: ListChecks,
            color: '#f59e0b',
            accentGlow: 'from-amber-500/10 via-transparent to-transparent',
            sparkData: [],
            sparkKey: 'count' as const,
            delta: null as number | null,
            decimals: false,
        },
        {
            label: 'Blueprint',
            value: blueprintDepth,
            suffix: '%',
            icon: Dna,
            color: '#c084fc',
            accentGlow: 'from-purple-500/10 via-transparent to-transparent',
            sparkData: [],
            sparkKey: 'count' as const,
            delta: null as number | null,
            decimals: false,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.07, type: 'spring', stiffness: 200, damping: 25 }}
                >
                    <Card className="relative overflow-hidden p-4 border-white/[0.06] bg-[#0a1128]/60 backdrop-blur-xl hover:border-white/10 transition-all duration-500 group">
                        {/* Accent glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.accentGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative">
                            {/* Header: icon + label + delta */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-5 h-5 rounded-md flex items-center justify-center"
                                        style={{ backgroundColor: `${card.color}15` }}
                                    >
                                        <card.icon
                                            className="w-3 h-3"
                                            style={{ color: card.color }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                                        {card.label}
                                    </span>
                                </div>
                                {card.delta !== null && <DeltaBadge delta={card.delta} />}
                            </div>

                            {/* Value + sparkline */}
                            <div className="flex items-end justify-between gap-2">
                                <AnimatedCounter
                                    value={card.value}
                                    suffix={card.suffix}
                                    decimals={card.decimals}
                                />
                                <Sparkline
                                    data={card.sparkData}
                                    valueKey={card.sparkKey}
                                    color={card.color}
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
