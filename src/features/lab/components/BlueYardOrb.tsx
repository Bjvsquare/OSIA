import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SYNAPSE_VERTEX_SHADER = `
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SYNAPSE_FRAGMENT_SHADER = `
uniform float uTime;
varying vec3 vPosition;

// Simplex 3D Noise 
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 p1 = vec3(b1.xy,h.y);
  vec4 p2 = vec3(b1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p1,p1), dot(p2,p2), dot(p1,p1), dot(p2,p2)));
  p1 *= norm.x;
  p2 *= norm.y;
  return 130.0 * dot(p1, x1);
}

void main() {
  float t = uTime * 0.3;
  vec3 pos = vPosition * 0.15; 
  
  // Layered noise for "Granulation" surface effect
  float n1 = snoise(pos + vec3(t, t*0.2, 0.0));
  float n2 = snoise(pos * 2.0 - vec3(0.0, t, t*0.5));
  float n3 = snoise(pos * 4.0 + vec3(t, 0.0, -t));
  
  float flares = pow(abs(n1 * n2), 1.5);
  float detail = pow(abs(n2 * n3), 2.0);
  
  float structure = flares + detail;

  // Solar Palette (Red -> Orange -> Yellow -> White)
  vec3 colDark = vec3(0.4, 0.05, 0.0);   // Dark Red/Brown
  vec3 colMid = vec3(1.0, 0.3, 0.0);    // Bright Orange
  vec3 colHot = vec3(1.0, 0.8, 0.2);    // Golden Yellow
  vec3 colCenter = vec3(1.0, 1.0, 1.0); // White spots
  
  vec3 finalColor = mix(colDark, colMid, n1 * 0.5 + 0.5);
  finalColor += colHot * structure * 2.5;
  finalColor += colCenter * pow(structure, 4.0) * 3.0;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const ORB_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ORB_FRAGMENT_SHADER = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
  
  // Warm Fresnel (Golden Glow)
  vec3 rimColor = vec3(1.0, 0.7, 0.3);
  vec3 finalColor = mix(vec3(0.05, 0.0, 0.0), rimColor, fresnel);
  
  gl_FragColor = vec4(finalColor, 0.15 + fresnel * 0.85);
}
`;

export function BlueYardOrb() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) meshRef.current.rotation.y = t * 0.05;
    if (innerRef.current && innerRef.current.material instanceof THREE.ShaderMaterial) {
      innerRef.current.material.uniforms.uTime.value = t;
      innerRef.current.rotation.y = -t * 0.1;
    }
  });

  return (
    <group>
      {/* Render Core first (renderOrder 1) */}
      <mesh ref={innerRef} scale={1.0} renderOrder={1}>
        <sphereGeometry args={[13.2, 64, 64]} />
        <shaderMaterial
          vertexShader={SYNAPSE_VERTEX_SHADER}
          fragmentShader={SYNAPSE_FRAGMENT_SHADER}
          uniforms={{ uTime: { value: 0 } }}
          side={THREE.DoubleSide}
          depthTest={true}
          depthWrite={true}
        />
      </mesh>

      {/* Render Rim second (renderOrder 2) */}
      <mesh ref={meshRef} renderOrder={2}>
        <sphereGeometry args={[14, 64, 64]} />
        <shaderMaterial
          vertexShader={ORB_VERTEX_SHADER}
          fragmentShader={ORB_FRAGMENT_SHADER}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
