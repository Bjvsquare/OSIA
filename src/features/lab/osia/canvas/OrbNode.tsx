import { useCallback, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { OrbData } from '../types';
import { getOrbColor } from '../utils/colorUtils';
import { useVisualizationStore } from '../stores/visualizationStore';
import { ParticleOrb } from './ParticleOrb';

/* ────────────────────────────────────────────
   OrbNode — Wrapper around ParticleOrb for
   trait and sub-trait orbs, with interaction.
   ──────────────────────────────────────────── */

interface OrbNodeProps {
  orb: OrbData;
  position: [number, number, number];
}

export function OrbNode({ orb, position }: OrbNodeProps) {
  const selectOrb = useVisualizationStore(s => s.selectOrb);
  const hoverOrb = useVisualizationStore(s => s.hoverOrb);
  const mode = useVisualizationStore(s => s.viewState.mode);

  const color = useMemo(() => getOrbColor(orb.type, orb.colorHue), [orb.type, orb.colorHue]);
  const colorHex = useMemo(() => '#' + color.getHexString(), [color]);

  // Sub-traits are smaller with fewer particles
  const isSub = orb.type === 'sub-trait';
  const particleCount = isSub ? 4096 : 12288;
  const pointSize = isSub ? 0.8 : 1.2;
  const curlFreq = isSub ? 0.3 : 0.25;

  const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (mode === 'overview') selectOrb(orb.id);
  }, [mode, selectOrb, orb.id]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverOrb(orb.id);
    document.body.style.cursor = 'pointer';
  }, [hoverOrb, orb.id]);

  const handlePointerOut = useCallback(() => {
    hoverOrb(null);
    document.body.style.cursor = 'auto';
  }, [hoverOrb]);

  return (
    <ParticleOrb
      position={position}
      color={colorHex}
      orbSize={orb.size}
      particleCount={particleCount}
      pointSize={pointSize}
      speed={0.3 + orb.intensity * 0.3}
      curlFreq={curlFreq}
      opacity={0.3 + orb.intensity * 0.15}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}
