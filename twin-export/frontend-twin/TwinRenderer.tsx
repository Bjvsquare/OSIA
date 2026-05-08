import { motion } from 'framer-motion';
import type { Profile } from '../../core/models';

interface TwinRendererProps {
    profile: Profile;
    size?: number;
}

export function TwinRenderer({ profile, size = 400 }: TwinRendererProps) {
    // Sort layers by ID to ensure consistent rendering order
    const layers = Object.values(profile.layers).sort((a, b) => a.id - b.id);
    const center = size / 2;

    // Calculate radii for concentric rings based on layer values
    // We'll group them into clusters for visual coherence
    // Cluster A (1-3): Core
    // Cluster B (4-6): Cognitive
    // Cluster C (7-9): Emotional
    // Cluster D (10-12): Relational
    // Cluster E (13-15): Trajectory

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                <defs>
                    <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#0A1128" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#1C2F64" stopOpacity="0.0" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Field */}
                <circle cx={center} cy={center} r={size * 0.45} fill="url(#coreGradient)" opacity="0.5" />

                {/* Render Layers as Rings/Shapes */}
                {layers.map((layer, index) => {
                    const radius = (index + 1) * (size * 0.45 / 15);
                    const value = layer.value;

                    // Color mapping based on clusters (simplified)
                    let color = '#757575'; // Neutral
                    if (layer.id <= 3) color = '#1C2F64'; // Deep Blue (Core)
                    else if (layer.id <= 6) color = '#38A3A5'; // Teal (Cognitive)
                    else if (layer.id <= 9) color = '#6B4C9A'; // Purple (Emotional)
                    else if (layer.id <= 12) color = '#D4A373'; // Amber (Relational)
                    else color = '#80CED7'; // Light Teal (Trajectory)

                    return (
                        <motion.circle
                            key={layer.id}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth={2 + (value * 4)} // Thickness based on value
                            strokeOpacity={0.4 + (value * 0.6)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 1, ease: "easeOut" }}
                            filter="url(#glow)"
                        />
                    );
                })}

                {/* Pulsing Core */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={size * 0.05}
                    fill="#FEFAE0"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>

            {/* Overlay Text (Optional) */}
            <div className="absolute bottom-4 text-xs text-osia-neutral-500 font-mono">
                OSIA TWIN v1.0
            </div>
        </div>
    );
}
