import { ParticleOrb } from './ParticleOrb';

/* ────────────────────────────────────────────
   CentralCore — Larger, more intense particle
   orb at the center of the constellation
   ──────────────────────────────────────────── */

interface CentralCoreProps {
  position?: [number, number, number];
  size?: number;
  color1?: string;
  color2?: string;
}

export function CentralCore({
  position = [0, 0, 0],
  size = 2.5,
  color1 = '#4A9EFF',
}: CentralCoreProps) {
  return (
    <ParticleOrb
      position={position}
      color={color1}
      orbSize={size}
      particleCount={400}
      speed={0.8}
      opacity={0.7}
      pointSize={2}
      minDistance={0.5}
      maxConnections={8}
    />
  );
}
