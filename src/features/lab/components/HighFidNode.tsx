import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const NODE_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float uTime;
    uniform vec3 uMouse;
    uniform float uIntensity;

    void main() {
        vUv = uv;
        vNormal = normalMatrix * normal;
        
        vec3 pos = position;
        
        // Vertex-level cursor repulsion
        float dist = distance(pos, uMouse);
        float repulsion = smoothstep(10.0, 0.0, dist) * 0.5 * uIntensity;
        pos += repulsion * normalize(pos - uMouse);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        vPosition = pos;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const NODE_FRAGMENT_SHADER = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uHoverProgress;
    uniform vec3 uMouse;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

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
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Fresnel for glassy look
        float fresnel = pow(1.2 - dot(normal, viewDir), 2.5);
        
        // Web-like noise pattern
        float noise = snoise(vPosition * 1.5 + uTime * 0.2);
        float web = smoothstep(0.4, 0.45, noise) * 0.4;
        web += smoothstep(0.5, 0.55, snoise(vPosition * 4.0 - uTime * 0.1)) * 0.2;
        
        // Pulse animation
        float pulse = 0.95 + 0.05 * sin(uTime * 1.5);
        
        // Highlight logic
        float mouseDist = distance(vPosition, uMouse);
        float mouseHighlight = smoothstep(2.5, 0.0, mouseDist) * 0.4 * uIntensity;

        vec3 baseColor = uColor;
        vec3 glowColor = uColor * 1.2 + vec3(0.2, 0.2, 0.4); 
        
        vec3 finalColor = mix(baseColor, glowColor, web + uHoverProgress * 0.3);
        finalColor += mouseHighlight * vec3(0.6, 1.0, 1.0);
        
        float alpha = (fresnel * 0.5 + web * 0.4 + uHoverProgress * 0.2) * uIntensity * pulse;
        alpha = clamp(alpha, 0.0, 0.8);
        
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

interface HighFidNodeProps {
    position: THREE.Vector3;
    size: number;
    label: string;
    isMain?: boolean;
    onHover?: (hovered: boolean) => void;
    onClick?: () => void;
}

export function HighFidNode({ position, size, label, isMain, onHover, onClick }: HighFidNodeProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    const particleData = useMemo(() => {
        const count = isMain ? 200 : 50;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = (Math.random() ** 0.5) * size * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            randoms[i] = Math.random();
        }
        return { positions, randoms };
    }, [size, isMain]);

    const [isHovered, setIsHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.getElapsedTime();
            material.uniforms.uHoverProgress.value = THREE.MathUtils.lerp(
                material.uniforms.uHoverProgress.value,
                isHovered ? 1 : 0,
                0.1
            );

            // Map 2D mouse to 3D space
            const mouse3D = new THREE.Vector3(
                (state.mouse.x * state.viewport.width) / 2,
                (state.mouse.y * state.viewport.height) / 2,
                0
            );
            material.uniforms.uMouse.value.copy(mouse3D).sub(position);
        }
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
            particlesRef.current.rotation.z = state.clock.getElapsedTime() * 0.1;

            // Subtle pulse scale for particles
            const s = 1.0 + Math.sin(state.clock.getElapsedTime() * 2.0) * 0.05;
            particlesRef.current.scale.set(s, s, s);
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(isMain ? "#ffffff" : "#00ffff") },
        uIntensity: { value: isMain ? 1.0 : 0.6 }, // Lowered to prevent blowout
        uMouse: { value: new THREE.Vector3() },
        uHoverProgress: { value: 0 }
    }), [isMain]);

    return (
        <group position={position}>
            {/* The Glassy Shell */}
            <mesh
                ref={meshRef}
                onPointerOver={() => {
                    setIsHovered(true);
                    onHover?.(true);
                }}
                onPointerOut={() => {
                    setIsHovered(false);
                    onHover?.(false);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
            >
                <sphereGeometry args={[size, 48, 48]} />
                <shaderMaterial
                    vertexShader={NODE_VERTEX_SHADER}
                    fragmentShader={NODE_FRAGMENT_SHADER}
                    uniforms={uniforms}
                    transparent
                    blending={THREE.NormalBlending} // Changed from Additive to Normal to stop blowout
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Internal Core Glow Particles */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particleData.positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={isMain ? 0.1 : 0.05}
                    color={isMain ? "#ffffff" : "#00ddff"}
                    transparent
                    opacity={isMain ? 0.6 : 0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                />
            </points>

            {/* Label Overlay - ONLY on hover or if Main */}
            <AnimatePresence>
                {(isHovered || isMain) && (
                    <Html
                        distanceFactor={15}
                        position={[0, -size - 1.2, 0]}
                        center
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="whitespace-nowrap pointer-events-none select-none"
                        >
                            <div className="flex flex-col items-center">
                                <div className="h-4 w-[1px] bg-cyan-400/50 mb-2 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isMain ? 'text-osia-teal-400' : 'text-white'} text-shadow-sm`}>
                                    {label}
                                </span>
                            </div>
                        </motion.div>
                    </Html>
                )}
            </AnimatePresence>
        </group>
    );
}
