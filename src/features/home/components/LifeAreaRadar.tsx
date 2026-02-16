import { useState } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   LifeAreaRadar — SVG Spider Chart for 7 Life Areas

   Renders a 7-axis radar chart with clickable axes
   to edit scores. Color-coded: green (7+), amber (4-6), red (1-3).
   ═══════════════════════════════════════════════════════════ */

interface LifeArea {
    domain: string;
    healthScore: number;
    label: string;
    icon: string;
}

interface LifeAreaRadarProps {
    areas: LifeArea[];
    onScoreEdit: (domain: string, currentScore: number) => void;
}

const DOMAIN_LABELS: Record<string, { label: string; icon: string }> = {
    spiritual: { label: 'Spiritual', icon: '🕯️' },
    physical_health: { label: 'Physical', icon: '💪' },
    personal: { label: 'Personal', icon: '🪞' },
    relationships: { label: 'Relationships', icon: '❤️' },
    career: { label: 'Career', icon: '📈' },
    business: { label: 'Business', icon: '🏢' },
    finances: { label: 'Finances', icon: '💰' },
};

export function LifeAreaRadar({ areas, onScoreEdit }: LifeAreaRadarProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const cx = 200;
    const cy = 200;
    const maxRadius = 140;
    const levels = 5;  // Grid rings at 2, 4, 6, 8, 10
    const n = areas.length;

    // Calculate point position on the radar
    const getPoint = (index: number, value: number): [number, number] => {
        const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
        const r = (value / 10) * maxRadius;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    // Build polygon path
    const polygonPoints = areas.map((area, i) => getPoint(i, area.healthScore));
    const polygonPath = polygonPoints.map(p => p.join(',')).join(' ');

    // Grid rings
    const gridRings = Array.from({ length: levels }, (_, i) => {
        const value = (i + 1) * 2;
        const r = (value / 10) * maxRadius;
        return r;
    });

    // Overall fill color based on average
    const avgScore = areas.reduce((sum, a) => sum + a.healthScore, 0) / areas.length;
    const fillColor = avgScore >= 7
        ? 'rgba(56, 163, 165, 0.15)'
        : avgScore >= 4
            ? 'rgba(245, 158, 11, 0.15)'
            : 'rgba(239, 68, 68, 0.15)';
    const strokeColor = avgScore >= 7
        ? 'rgba(56, 163, 165, 0.8)'
        : avgScore >= 4
            ? 'rgba(245, 158, 11, 0.8)'
            : 'rgba(239, 68, 68, 0.8)';

    // Score dot color per area
    const getDotColor = (score: number) => {
        if (score >= 7) return '#38a3a5';
        if (score >= 4) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="relative w-full aspect-square max-w-[420px] mx-auto">
            <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Grid rings */}
                {gridRings.map((r, i) => (
                    <polygon
                        key={i}
                        points={Array.from({ length: n }, (_, j) => {
                            const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                        }).join(' ')}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {areas.map((_, i) => {
                    const [ex, ey] = getPoint(i, 10);
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={ex}
                            y2={ey}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data polygon */}
                <motion.polygon
                    points={polygonPath}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                />

                {/* Score dots + labels */}
                {areas.map((area, i) => {
                    const [px, py] = getPoint(i, area.healthScore);
                    const [lx, ly] = getPoint(i, 12.5);
                    const meta = DOMAIN_LABELS[area.domain] || { label: area.domain, icon: '📊' };
                    const isHovered = hoveredIndex === i;

                    return (
                        <g
                            key={area.domain}
                            className="cursor-pointer"
                            onClick={() => onScoreEdit(area.domain, area.healthScore)}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Clickable hit area */}
                            <circle cx={px} cy={py} r="18" fill="transparent" />

                            {/* Score dot */}
                            <motion.circle
                                cx={px}
                                cy={py}
                                r={isHovered ? 7 : 5}
                                fill={getDotColor(area.healthScore)}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth="2"
                                initial={{ r: 0 }}
                                animate={{ r: isHovered ? 7 : 5 }}
                                transition={{ duration: 0.2 }}
                            />

                            {/* Glow on hover */}
                            {isHovered && (
                                <circle
                                    cx={px}
                                    cy={py}
                                    r="14"
                                    fill="none"
                                    stroke={getDotColor(area.healthScore)}
                                    strokeWidth="1.5"
                                    opacity={0.3}
                                />
                            )}

                            {/* Label */}
                            <text
                                x={lx}
                                y={ly - 6}
                                textAnchor="middle"
                                className="fill-white/40 text-[9px] font-bold uppercase"
                                style={{ fontSize: '9px', letterSpacing: '0.05em' }}
                            >
                                {meta.icon} {meta.label}
                            </text>
                            <text
                                x={lx}
                                y={ly + 8}
                                textAnchor="middle"
                                className="text-[11px] font-black"
                                style={{ fontSize: '11px', fill: getDotColor(area.healthScore) }}
                            >
                                {area.healthScore}/10
                            </text>
                        </g>
                    );
                })}

                {/* Center score */}
                <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    className="fill-white/80 font-black"
                    style={{ fontSize: '24px' }}
                >
                    {avgScore.toFixed(1)}
                </text>
                <text
                    x={cx}
                    y={cy + 12}
                    textAnchor="middle"
                    className="fill-white/30 font-bold uppercase"
                    style={{ fontSize: '8px', letterSpacing: '0.1em' }}
                >
                    Overall
                </text>
            </svg>
        </div>
    );
}
