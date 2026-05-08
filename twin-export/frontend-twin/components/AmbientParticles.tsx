// ═══════════════════════════════════════════════════════════
// AmbientParticles — Floating background atmosphere
// Tiny particles drifting around the portrait
// ═══════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AmbientParticlesProps {
  count?: number;
  radius?: number;
}

const ambientVertexShader = `
  uniform float uTime;
  varying float vAlpha;
  
  void main() {
    // Slow drift animation
    vec3 pos = position;
    pos.x += sin(uTime * 0.1 + position.z * 5.0) * 0.05;
    pos.y += cos(uTime * 0.08 + position.x * 4.0) * 0.04;
    pos.z += sin(uTime * 0.12 + position.y * 3.0) * 0.03;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Distance-based alpha
    float dist = length(position);
    vAlpha = smoothstep(8.0, 2.0, dist) * 0.15;
    
    gl_PointSize = 1.5 * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ambientFragmentShader = `
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * vAlpha;
    
    // Cyan-ish color for ambient particles
    vec3 color = vec3(0.22, 0.64, 0.65);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function AmbientParticles({ count = 200, radius = 6 }: AmbientParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute in a sphere around the portrait
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 1; // Offset down slightly
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, radius]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={ambientVertexShader}
        fragmentShader={ambientFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
