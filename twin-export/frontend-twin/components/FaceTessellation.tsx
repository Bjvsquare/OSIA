// ═══════════════════════════════════════════════════════════
// FaceTessellation — Wireframe connections between landmarks
// Creates the plexus/nexus network aesthetic
// ═══════════════════════════════════════════════════════════

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FaceMeshData } from '../types/TwinTypes';

interface FaceTessellationProps {
  faceMesh: FaceMeshData;
  opacity?: number;
}

const lineVertexShader = `
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vDepth;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const lineFragmentShader = `
  varying vec3 vColor;
  varying float vDepth;
  
  uniform float uOpacity;
  uniform float uTime;
  
  void main() {
    // Depth-based opacity: closer lines are more visible
    float depthFade = clamp(1.0 - (vDepth - 3.0) / 8.0, 0.1, 1.0);
    
    // Subtle pulse animation
    float pulse = 0.9 + sin(uTime * 0.5) * 0.1;
    
    float alpha = uOpacity * depthFade * pulse;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function FaceTessellation({ faceMesh, opacity = 0.15 }: FaceTessellationProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const tessellation = faceMesh.tessellation;
    const landmarks = faceMesh.landmarks;
    const faceColors = faceMesh.colors;

    // Build line segment positions from tessellation pairs
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < tessellation.length; i += 2) {
      const a = tessellation[i];
      const b = tessellation[i + 1];

      if (a >= landmarks.length || b >= landmarks.length) continue;

      const la = landmarks[a];
      const lb = landmarks[b];

      // Calculate edge length for opacity filtering
      const dx = la.x - lb.x;
      const dy = la.y - lb.y;
      const dz = la.z - lb.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Skip very long edges (artifacts)
      if (dist > 1.5) continue;

      positions.push(la.x, la.y, la.z);
      positions.push(lb.x, lb.y, lb.z);

      // Average colors of connected vertices, with warm tint
      const ra = faceColors[a * 3] || 0.8;
      const ga = faceColors[a * 3 + 1] || 0.65;
      const ba = faceColors[a * 3 + 2] || 0.5;
      const rb = faceColors[b * 3] || 0.8;
      const gb = faceColors[b * 3 + 1] || 0.65;
      const bb = faceColors[b * 3 + 2] || 0.5;

      // Slightly desaturate and warm for the line color
      const avgR = (ra + rb) / 2 * 0.8 + 0.15;
      const avgG = (ga + gb) / 2 * 0.7 + 0.1;
      const avgB = (ba + bb) / 2 * 0.6 + 0.05;

      colors.push(avgR, avgG, avgB);
      colors.push(avgR, avgG, avgB);
    }

    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    geo.setAttribute(
      'customColor',
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );

    return geo;
  }, [faceMesh]);

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    }),
    [opacity]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={lineVertexShader}
        fragmentShader={lineFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
