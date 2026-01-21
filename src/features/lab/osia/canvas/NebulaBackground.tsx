import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BG_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BG_FRAGMENT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  // Smooth radial gradient
  float dist = length(vUv - 0.5);
  vec3 deepCore = vec3(0.015, 0.02, 0.05);
  vec3 deepEdge = vec3(0.005, 0.005, 0.015);
  vec3 bg = mix(deepCore, deepEdge, smoothstep(0.0, 0.7, dist));

  // Star field — circular dots using distance from cell center
  vec2 grid1 = vUv * 300.0;
  vec2 cell1 = floor(grid1);
  vec2 frac1 = fract(grid1) - 0.5;
  float h1 = hash21(cell1);
  // Offset star position within cell for randomness
  vec2 starOffset = vec2(hash21(cell1 + 10.0), hash21(cell1 + 20.0)) - 0.5;
  float d1 = length(frac1 - starOffset * 0.4);
  float star1 = smoothstep(0.08, 0.02, d1) * step(0.993, h1);
  float twinkle1 = 0.6 + 0.4 * sin(uTime * (0.4 + h1 * 1.5) + h1 * 80.0);
  bg += vec3(star1 * twinkle1 * 0.8);

  // Second dimmer star layer
  vec2 grid2 = vUv * 150.0 + 50.0;
  vec2 cell2 = floor(grid2);
  vec2 frac2 = fract(grid2) - 0.5;
  float h2 = hash21(cell2);
  vec2 starOffset2 = vec2(hash21(cell2 + 30.0), hash21(cell2 + 40.0)) - 0.5;
  float d2 = length(frac2 - starOffset2 * 0.4);
  float star2 = smoothstep(0.06, 0.01, d2) * step(0.99, h2);
  float twinkle2 = 0.5 + 0.5 * sin(uTime * 0.3 + h2 * 50.0);
  bg += vec3(star2 * twinkle2 * 0.3);

  gl_FragColor = vec4(bg, 1.0);
}`;

export function NebulaBackground() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[50, 32, 32]} />
      <shaderMaterial
        vertexShader={BG_VERTEX}
        fragmentShader={BG_FRAGMENT}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
