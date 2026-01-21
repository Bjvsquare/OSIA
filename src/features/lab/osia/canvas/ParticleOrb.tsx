import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   ParticleOrb — GPU Particle Sphere with Curl Noise
   
   Uses <primitive> to bypass R3F declarative system issues.
   Three.js Points object built imperatively with full control.
   ═══════════════════════════════════════════════════════════ */

const VERT = `
uniform float uTime;
uniform float uSpeed;
uniform float uOrbSize;
varying float vAlpha;

void main() {
  float t = uTime * 0.15 * uSpeed;
  vec3 pos = position;
  
  // Simple animated displacement
  float dx = sin(pos.y * 3.0 + t * 2.0) * 0.15;
  float dy = sin(pos.z * 3.0 + t * 1.7) * 0.15;
  float dz = sin(pos.x * 3.0 + t * 2.3) * 0.15;
  pos += vec3(dx, dy, dz);
  
  pos *= uOrbSize;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 2.0 * (300.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.0);
  
  vAlpha = smoothstep(0.0, 0.3, length(position));
}
`;

const FRAG = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * 0.4 * vAlpha;
  gl_FragColor = vec4(uColor * 1.5, a);
}
`;

function makeSpherePositions(count: number): Float32Array {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random());
        const sinPhi = Math.sin(phi);
        const i3 = i * 3;
        data[i3] = r * sinPhi * Math.cos(theta);
        data[i3 + 1] = r * sinPhi * Math.sin(theta);
        data[i3 + 2] = r * Math.cos(phi);
    }
    return data;
}

interface ParticleOrbProps {
    position: [number, number, number];
    color: string;
    orbSize?: number;
    particleCount?: number;
    speed?: number;
    onClick?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOut?: () => void;
}

export function ParticleOrb({
    position,
    color,
    orbSize = 1.0,
    particleCount = 8192,
    speed = 0.3,
    onClick,
    onPointerOver,
    onPointerOut,
}: ParticleOrbProps) {
    const groupRef = useRef<THREE.Group>(null!);

    // Build complete Three.js Points object imperatively
    const { points, shaderMat } = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const posData = makeSpherePositions(particleCount);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(posData, 3));
        geo.computeBoundingSphere();

        const mat = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: speed },
                uOrbSize: { value: orbSize },
                uColor: { value: new THREE.Color(color) },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;

        return { points: pts, shaderMat: mat };
    }, [particleCount, speed, orbSize, color]);

    useFrame((state) => {
        shaderMat.uniforms.uTime.value = state.clock.getElapsedTime();
    });

    const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onClick?.(e);
    }, [onClick]);

    const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onPointerOver?.(e);
    }, [onPointerOver]);

    const handleOut = useCallback(() => {
        onPointerOut?.();
    }, [onPointerOut]);

    return (
        <group ref={groupRef} position={position}>
            {/* Points via primitive — bypasses R3F declarative issues */}
            <primitive object={points} />

            {/* Invisible hitbox for interaction */}
            <mesh
                visible={false}
                onPointerDown={handleClick}
                onPointerOver={handleOver}
                onPointerOut={handleOut}
            >
                <sphereGeometry args={[orbSize * 1.1, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}
