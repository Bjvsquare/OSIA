import { useCallback, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

import type { OrbData } from '../types';
import { getOrbColor } from '../utils/colorUtils';
import { useVisualizationStore } from '../stores/visualizationStore';
import { ParticleOrb } from './ParticleOrb';

/* ────────────────────────────────────────────
   OrbNode — Wrapper around ParticleOrb for
   cluster and layer orbs, with interaction.
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

  // Layers are smaller with fewer particles
  const isLayer = orb.type === 'layer';
  const particleCount = isLayer ? 120 : 250;

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
      speed={0.6 + orb.intensity * 0.4}
      opacity={0.5 + orb.intensity * 0.2}
      pointSize={isLayer ? 1.5 : 2}
      minDistance={isLayer ? 0.25 : 0.35}
      maxConnections={isLayer ? 4 : 6}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}
