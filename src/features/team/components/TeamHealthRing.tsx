import { motion } from 'framer-motion';

interface TeamHealthRingProps {
    healthIndex: number; // 0-100
    size?: number;
}

export function TeamHealthRing({ healthIndex, size = 200 }: TeamHealthRingProps) {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (healthIndex / 100) * circumference;
    const center = size / 2;

    // Color based on health score
    const getColor = () => {
        if (healthIndex >= 80) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', label: 'Thriving' };
        if (healthIndex >= 65) return { stroke: '#14B8A6', glow: 'rgba(20, 184, 166, 0.4)', label: 'Healthy' };
        if (healthIndex >= 50) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)', label: 'Developing' };
        if (healthIndex >= 35) return { stroke: '#F97316', glow: 'rgba(249, 115, 22, 0.3)', label: 'Needs Attention' };
        return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.3)', label: 'Critical' };
    };

    const color = getColor();

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />

                {/* Progress ring with gradient */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        filter: `drop-shadow(0 0 8px ${color.glow})`,
                    }}
                />

                {/* Glow effect circle */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference, opacity: 0 }}
                    animate={{ strokeDashoffset: circumference - progress, opacity: 0.3 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        filter: `blur(4px)`,
                    }}
                />
            </svg>

            {/* Center content */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ width: size, height: size }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-center"
                >
                    <div className="text-5xl font-black text-white tracking-tight">
                        {healthIndex}
                    </div>
                    <div
                        className="text-xs font-bold uppercase tracking-widest mt-1"
                        style={{ color: color.stroke }}
                    >
                        {color.label}
                    </div>
                </motion.div>
            </div>

            {/* Label below */}
            <div className="mt-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-osia-neutral-500">
                    Team Health Index
                </div>
            </div>
        </div>
    );
}
