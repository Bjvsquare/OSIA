import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleOrb } from './ParticleOrb';

/* ────────────────────────────────────────────
   CentralCore — Larger, more intense particle
   orb at the center of the constellation.
   
   Supports an optional portraitUrl to render
   the user's verified profile picture as a
   circular billboard inside the particle sphere.
   ──────────────────────────────────────────── */

interface CentralCoreProps {
  position?: [number, number, number];
  size?: number;
  color1?: string;
  color2?: string;
  portraitUrl?: string;
}

/* Tight circular alpha mask — writes gradient into COLOR channels
   because Three.js alphaMap reads luminance, NOT the alpha channel */
let _circleMask: THREE.DataTexture | null = null;
function getCircleMask(): THREE.DataTexture {
  if (_circleMask) return _circleMask;
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;
  const radius = size / 2;
  // Tight 8% edge for a clean circle that fades gently at the boundary
  const edge = size * 0.08;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const t = Math.max(0, Math.min(1, (radius - dist) / edge));
      const alpha = t * t * (3 - 2 * t); // smoothstep
      const v = Math.round(alpha * 255);
      // Write to R, G, B (alphaMap reads luminance from these)
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255; // fully opaque texture
    }
  }
  _circleMask = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  _circleMask.needsUpdate = true;
  return _circleMask;
}

/* Portrait rendered as a Billboard behind particles */
function PortraitPlane({ url, orbSize }: { url: string; orbSize: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const circleMask = useMemo(() => getCircleMask(), []);
  // orbSize is radius; fill the sphere generously on the Vision page
  const planeSize = orbSize * 2.15;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Load via Image element (handles EXIF orientation) then center-crop to square
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const side = Math.min(w, h);
      const sx = (w - side) / 2;
      const sy = (h - side) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.onerror = (err) => {
      console.warn('[PortraitPlane] Failed to load image:', url, err);
    };
    img.src = url;
  }, [url]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Always face the camera
    meshRef.current.quaternion.copy(state.camera.quaternion);
    meshRef.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.02);
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} renderOrder={0}>
      <planeGeometry args={[planeSize, planeSize]} />
      <meshBasicMaterial
        map={texture}
        alphaMap={circleMask}
        transparent
        opacity={0.65}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function CentralCore({
  position = [0, 0, 0],
  size = 2.5,
  color1 = '#4A9EFF',
  portraitUrl,
}: CentralCoreProps) {
  return (
    <group position={position}>
      {/* Particle orb — renders with renderOrder=1 so particles appear over portrait */}
      <ParticleOrb
        position={[0, 0, 0]}
        color={color1}
        orbSize={size}
        particleCount={400}
        speed={0.8}
        opacity={portraitUrl ? 0.55 : 0.7}
        pointSize={2}
        minDistance={0.5}
        maxConnections={8}
      />

      {/* Portrait billboard inside the particle sphere */}
      {portraitUrl && (
        <PortraitPlane url={portraitUrl} orbSize={size} />
      )}
    </group>
  );
}
