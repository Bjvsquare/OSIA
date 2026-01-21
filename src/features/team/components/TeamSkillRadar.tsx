import { motion } from 'framer-motion';
import { useState } from 'react';

interface LayerStats {
    layerId: number;
    name: string;
    mean: number;
    min: number;
    max: number;
    diversity: number;
    status: 'strength' | 'developing' | 'gap';
}

interface TeamSkillRadarProps {
    skillInventory: LayerStats[];
    size?: number;
}

const STATUS_COLORS = {
    strength: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10B981' },
    developing: { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#F59E0B' },
    gap: { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444' }
};

export function TeamSkillRadar({ skillInventory, size = 400 }: TeamSkillRadarProps) {
    const [hoveredLayer, setHoveredLayer] = useState<LayerStats | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    if (!skillInventory || skillInventory.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-osia-neutral-500">
                No skill data available
            </div>
        );
    }

    const center = size / 2;
    const radius = size * 0.38;
    const layers = skillInventory.slice(0, 15); // Ensure max 15
    const angleStep = (Math.PI * 2) / layers.length;

    // Calculate polygon points based on mean scores
    const points = layers.map((l, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * l.mean;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y, layer: l, angle };
    });

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Concentric circles for scale
    const levels = [0.25, 0.5, 0.75, 1.0];

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div className="relative">
            <svg
                width={size}
                height={size}
                className="overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredLayer(null)}
            >
                {/* Gradient definitions */}
                <defs>
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(20, 184, 166, 0.3)" />
                        <stop offset="100%" stopColor="rgba(20, 184, 166, 0.05)" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circles */}
                {levels.map((level) => (
                    <circle
                        key={level}
                        cx={center}
                        cy={center}
                        r={radius * level}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                        strokeDasharray={level === 0.5 ? "4 4" : undefined}
                    />
                ))}

                {/* Axis lines with glow on hover */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={center + radius * Math.cos(p.angle)}
                        y2={center + radius * Math.sin(p.angle)}
                        stroke={hoveredLayer?.layerId === p.layer.layerId
                            ? STATUS_COLORS[p.layer.status].stroke
                            : 'rgba(255,255,255,0.08)'}
                        strokeWidth={hoveredLayer?.layerId === p.layer.layerId ? 2 : 1}
                        className="transition-all duration-200"
                    />
                ))}

                {/* Main polygon with animation */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    points={polygonPoints}
                    fill="url(#radarGradient)"
                    stroke="rgba(20, 184, 166, 0.9)"
                    strokeWidth="2"
                    filter="url(#glow)"
                />

                {/* Data points with status colors */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        initial={{ r: 0 }}
                        animate={{ r: 6 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        cx={p.x}
                        cy={p.y}
                        fill={STATUS_COLORS[p.layer.status].stroke}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredLayer(p.layer)}
                        style={{ filter: hoveredLayer?.layerId === p.layer.layerId ? 'drop-shadow(0 0 8px currentColor)' : undefined }}
                    />
                ))}

                {/* Labels */}
                {points.map((p, i) => {
                    const labelRadius = radius + 30;
                    const x = center + labelRadius * Math.cos(p.angle);
                    const y = center + labelRadius * Math.sin(p.angle);
                    const isLeft = x < center;

                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor={isLeft ? "end" : "start"}
                            dominantBaseline="middle"
                            className={`text-[9px] uppercase tracking-wider font-semibold transition-all duration-200 ${hoveredLayer?.layerId === p.layer.layerId
                                    ? 'fill-white'
                                    : 'fill-osia-neutral-500'
                                }`}
                            onMouseEnter={() => setHoveredLayer(p.layer)}
                            style={{ cursor: 'pointer' }}
                        >
                            {p.layer.name.length > 12 ? p.layer.name.slice(0, 10) + '...' : p.layer.name}
                        </text>
                    );
                })}

                {/* Center score */}
                <text
                    x={center}
                    y={center - 8}
                    textAnchor="middle"
                    className="text-3xl font-black fill-white"
                >
                    {Math.round(layers.reduce((a, b) => a + b.mean, 0) / layers.length * 100)}
                </text>
                <text
                    x={center}
                    y={center + 14}
                    textAnchor="middle"
                    className="text-[8px] uppercase tracking-widest fill-osia-teal-500 font-bold"
                >
                    Team Index
                </text>
            </svg>

            {/* Tooltip */}
            {hoveredLayer && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 pointer-events-none"
                    style={{
                        left: Math.min(mousePos.x + 15, size - 180),
                        top: Math.min(mousePos.y + 15, size - 100)
                    }}
                >
                    <div className="bg-osia-neutral-900/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl min-w-[160px]">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[hoveredLayer.status].stroke }}
                            />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                                {hoveredLayer.name}
                            </span>
                        </div>
                        <div className="space-y-1 text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-osia-neutral-500">Mean Score</span>
                                <span className="font-bold text-white">{Math.round(hoveredLayer.mean * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-osia-neutral-500">Range</span>
                                <span className="font-mono text-osia-neutral-300">
                                    {Math.round(hoveredLayer.min * 100)}–{Math.round(hoveredLayer.max * 100)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-osia-neutral-500">Diversity</span>
                                <span className={`font-bold ${hoveredLayer.diversity > 0.2 ? 'text-amber-500' : 'text-osia-teal-500'
                                    }`}>
                                    {hoveredLayer.diversity > 0.2 ? 'High' : hoveredLayer.diversity > 0.1 ? 'Moderate' : 'Aligned'}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <span className={`text-[9px] uppercase tracking-wider font-bold ${hoveredLayer.status === 'strength' ? 'text-emerald-500' :
                                    hoveredLayer.status === 'developing' ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                {hoveredLayer.status === 'strength' ? '✓ Team Strength' :
                                    hoveredLayer.status === 'developing' ? '◐ Developing' : '⚠ Gap Area'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
