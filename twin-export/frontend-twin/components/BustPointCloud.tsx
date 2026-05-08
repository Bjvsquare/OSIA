// ═══════════════════════════════════════════════════════════
// BustPointCloud — Procedural neck/shoulders/chest renderer
// Points + connection lines for the bust region
// ═══════════════════════════════════════════════════════════

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BustMeshData } from '../types/TwinTypes';

interface BustPointCloudProps {
  bustMesh: BustMeshData;
  pointSize?: number;
  lineOpacity?: number;
}

// Shared point shader (similar to face but with different sizing)
const bustPointVertex = `
  attribute vec3 customColor;
  varying vec3 vColor;
  
  uniform float uTime;
  uniform float uPointSize;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    float breathe = 1.0 + sin(uTime * 0.6 + position.x * 3.0) * 0.06;
    float size = uPointSize * breathe;
    
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const bustPointFragment = `
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.15, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.1, dist);
    vec3 color = vColor + core * 0.2;
    
    gl_FragColor = vec4(color, alpha * 0.75);
  }
`;

// Line shader for bust connections
const bustLineVertex = `
  attribute vec3 customColor;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bustLineFragment = `
  varying vec3 vColor;
  uniform float uOpacity;
  
  void main() {
    gl_FragColor = vec4(vColor, uOpacity);
  }
`;

export function BustPointCloud({
  bustMesh,
  pointSize = 2.0,
  lineOpacity = 0.08,
}: BustPointCloudProps) {
  const pointMatRef = useRef<THREE.ShaderMaterial>(null);

  // Points geometry
  const pointsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(bustMesh.positions), 3)
    );
    geo.setAttribute(
      'customColor',
      new THREE.BufferAttribute(new Float32Array(bustMesh.colors), 3)
    );
    return geo;
  }, [bustMesh]);

  // Lines geometry
  const linesGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const totalPoints = bustMesh.positions.length / 3;

    for (let i = 0; i < bustMesh.connections.length; i += 2) {
      const a = bustMesh.connections[i];
      const b = bustMesh.connections[i + 1];

      if (a >= totalPoints || b >= totalPoints) continue;

      positions.push(
        bustMesh.positions[a * 3],
        bustMesh.positions[a * 3 + 1],
        bustMesh.positions[a * 3 + 2]
      );
      positions.push(
        bustMesh.positions[b * 3],
        bustMesh.positions[b * 3 + 1],
        bustMesh.positions[b * 3 + 2]
      );

      // Average colors
      const ra = bustMesh.colors[a * 3] || 0.3;
      const ga = bustMesh.colors[a * 3 + 1] || 0.5;
      const ba = bustMesh.colors[a * 3 + 2] || 0.5;
      const rb = bustMesh.colors[b * 3] || 0.3;
      const gb = bustMesh.colors[b * 3 + 1] || 0.5;
      const bb = bustMesh.colors[b * 3 + 2] || 0.5;

      const avgR = (ra + rb) / 2;
      const avgG = (ga + gb) / 2;
      const avgB = (ba + bb) / 2;

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
  }, [bustMesh]);

  const pointUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointSize: { value: pointSize },
    }),
    [pointSize]
  );

  const lineUniforms = useMemo(
    () => ({
      uOpacity: { value: lineOpacity },
    }),
    [lineOpacity]
  );

  useFrame(({ clock }) => {
    if (pointMatRef.current) {
      pointMatRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      {/* Bust Points */}
      <points geometry={pointsGeo}>
        <shaderMaterial
          ref={pointMatRef}
          vertexShader={bustPointVertex}
          fragmentShader={bustPointFragment}
          uniforms={pointUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bust Connection Lines */}
      <lineSegments geometry={linesGeo}>
        <shaderMaterial
          vertexShader={bustLineVertex}
          fragmentShader={bustLineFragment}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
