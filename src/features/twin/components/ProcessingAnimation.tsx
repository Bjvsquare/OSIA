import { motion } from 'framer-motion';
import type { ProcessingStage } from '../types/TwinTypes';

interface ProcessingAnimationProps {
  stage: ProcessingStage;
}

const STAGE_LABELS: Record<ProcessingStage, string> = {
  initializing: 'Initializing neural mapper...',
  detecting: 'Scanning facial geometry...',
  sampling: 'Sampling color signatures...',
  building_bust: 'Constructing portrait mesh...',
  rendering: 'Assembling plexus portrait...',
  complete: 'Twin genesis complete',
};

const STAGE_PROGRESS: Record<ProcessingStage, number> = {
  initializing: 10, detecting: 30, sampling: 55,
  building_bust: 75, rendering: 90, complete: 100,
};

export function ProcessingAnimation({ stage }: ProcessingAnimationProps) {
  const progress = STAGE_PROGRESS[stage];
  const label = STAGE_LABELS[stage];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-4">
      {/* Animated plexus formation */}
      <div className="relative w-64 h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <radialGradient id="procGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38A3A5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38A3A5" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#procGlow)" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const r = 40 + Math.sin(i * 1.5) * 20;
            const visible = progress > (i / 24) * 100;
            return (
              <motion.circle key={i}
                cx={100 + Math.cos(angle) * r} cy={100 + Math.sin(angle) * r} r={2} fill="#38A3A5"
                initial={{ opacity: 0, scale: 0 }}
                animate={visible ? { opacity: [0.3, 0.8, 0.3], scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ opacity: { duration: 2, repeat: Infinity, delay: i * 0.08 }, scale: { duration: 0.5, delay: i * 0.08 } }}
              />
            );
          })}
          {Array.from({ length: 20 }).map((_, i) => {
            const a = i, b = (i + 3) % 24;
            const aA = (a / 24) * Math.PI * 2, aB = (b / 24) * Math.PI * 2;
            const rA = 40 + Math.sin(a * 1.5) * 20, rB = 40 + Math.sin(b * 1.5) * 20;
            const visible = progress > (i / 20) * 100;
            return (
              <motion.line key={`l${i}`}
                x1={100 + Math.cos(aA) * rA} y1={100 + Math.sin(aA) * rA}
                x2={100 + Math.cos(aB) * rB} y2={100 + Math.sin(aB) * rB}
                stroke="#38A3A5" strokeWidth={0.5}
                initial={{ opacity: 0 }}
                animate={visible ? { opacity: [0.05, 0.2, 0.05] } : { opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
              />
            );
          })}
          <motion.circle cx="100" cy="100" r="4" fill="#38A3A5"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>
      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-3">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
            initial={{ width: '0%' }} animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <motion.p key={stage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs font-mono tracking-wider text-cyan-400/70">
          {label}
        </motion.p>
      </div>
    </div>
  );
}
