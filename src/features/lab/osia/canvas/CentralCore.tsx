import { ParticleOrb } from './ParticleOrb';

/* ────────────────────────────────────────────
   CentralCore — Larger, more intense particle
   orb at the center of the constellation.
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
      particleCount={32768}
      pointSize={1.4}
      speed={0.25}
      curlFreq={0.2}
      opacity={0.4}
    />
  );
}
