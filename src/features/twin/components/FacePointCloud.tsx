// ═══════════════════════════════════════════════════════════
// FacePointCloud — Three.js Points with custom shader
// Renders 478 face landmarks as glowing circular particles
// Supports mouth animation via mouthOpenness prop
// ═══════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FaceMeshData } from '../types/TwinTypes';
import { calculateMouthOffsets } from '../engine/MouthAnimator';

interface FacePointCloudProps {
  faceMesh: FaceMeshData;
  baseSize?: number;
  mouthOpenness?: number;
}

const vertexShader = `
  attribute vec3 customColor;
  attribute float isContour;
  
  varying vec3 vColor;
  varying float vIsContour;
  
  uniform float uTime;
  uniform float uPointSize;
  
  void main() {
    vColor = customColor;
    vIsContour = isContour;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    float breathe = 1.0 + sin(uTime * 0.8 + position.y * 2.0) * 0.08;
    float size = uPointSize * breathe;
    size *= (1.0 + isContour * 0.6);
    
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vIsContour;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    vec3 color = vColor + core * 0.1;
    
    alpha *= (1.0 + vIsContour * 0.4);
    color += vIsContour * vec3(0.1, 0.05, 0.0);
    
    gl_FragColor = vec4(color, alpha * 0.9);
  }
`;

export function FacePointCloud({ faceMesh, baseSize = 2.5, mouthOpenness = 0 }: FacePointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    const positions = new Float32Array(faceMesh.landmarks.length * 3);
    for (let i = 0; i < faceMesh.landmarks.length; i++) {
      positions[i * 3] = faceMesh.landmarks[i].x;
      positions[i * 3 + 1] = faceMesh.landmarks[i].y;
      positions[i * 3 + 2] = faceMesh.landmarks[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    basePositionsRef.current = new Float32Array(positions);

    const colors = new Float32Array(faceMesh.colors);
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

    const contours = new Set<number>();
    Object.values(faceMesh.contours).forEach((indices) => {
      indices.forEach((idx) => contours.add(idx));
    });

    const isContour = new Float32Array(faceMesh.landmarks.length);
    contours.forEach((idx) => {
      if (idx < isContour.length) isContour[idx] = 1.0;
    });
    geo.setAttribute('isContour', new THREE.BufferAttribute(isContour, 1));

    return { geometry: geo };
  }, [faceMesh]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }

    // Apply mouth animation
    if (mouthOpenness > 0.01 && basePositionsRef.current && geometry) {
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const offsets = calculateMouthOffsets(mouthOpenness, faceMesh);

      positions.set(basePositionsRef.current);
      offsets.forEach(({ dy }, idx) => {
        positions[idx * 3 + 1] += dy;
      });
      posAttr.needsUpdate = true;
    } else if (basePositionsRef.current && geometry) {
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      if (positions[0] !== basePositionsRef.current[0]) {
        positions.set(basePositionsRef.current);
        posAttr.needsUpdate = true;
      }
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointSize: { value: baseSize },
    }),
    [baseSize]
  );

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
