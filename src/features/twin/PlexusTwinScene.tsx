// ═══════════════════════════════════════════════════════════
// PlexusTwinScene — Main Three.js scene for the 3D portrait
// Composes all renderer components into a complete scene
// ═══════════════════════════════════════════════════════════

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { TwinAvatarData } from './types/TwinTypes';
import { FacePointCloud } from './components/FacePointCloud';
import { FaceTessellation } from './components/FaceTessellation';
import { BustPointCloud } from './components/BustPointCloud';
import { AmbientParticles } from './components/AmbientParticles';

interface PlexusTwinSceneProps {
  avatarData: TwinAvatarData;
  mouthOpenness?: number;
  className?: string;
}

/** Inner component that handles auto-rotation */
function PortraitGroup({ avatarData, mouthOpenness = 0 }: { avatarData: TwinAvatarData; mouthOpenness?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      // Slow auto-rotation
      groupRef.current.rotation.y = t * avatarData.renderSettings.rotationSpeed;
      // Subtle vertical breathing
      groupRef.current.position.y =
        Math.sin(t * 0.5) * avatarData.renderSettings.breathingAmplitude;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Face Points — 478 landmarks with photo colors */}
      <FacePointCloud
        faceMesh={avatarData.faceMesh}
        baseSize={avatarData.renderSettings.pointSize}
        mouthOpenness={mouthOpenness}
      />

      {/* Face Tessellation — wireframe connections */}
      <FaceTessellation
        faceMesh={avatarData.faceMesh}
        opacity={avatarData.renderSettings.connectionOpacity}
      />

      {/* Bust — neck, shoulders, chest */}
      {avatarData.bustMesh.positions.length > 0 && (
        <BustPointCloud
          bustMesh={avatarData.bustMesh}
          pointSize={avatarData.renderSettings.pointSize * 0.8}
          lineOpacity={avatarData.renderSettings.connectionOpacity * 0.5}
        />
      )}
    </group>
  );
}

export function PlexusTwinScene({ avatarData, mouthOpenness = 0, className = '' }: PlexusTwinSceneProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ background: '#000000' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        {/* Pure black background */}
        <color attach="background" args={['#000000']} />

        {/* Subtle ambient lighting for depth */}
        <ambientLight intensity={0.1} />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#D4A373" />
        <pointLight position={[-5, 3, -5]} intensity={0.2} color="#38A3A5" />

        {/* The 3D portrait */}
        <PortraitGroup avatarData={avatarData} mouthOpenness={mouthOpenness} />

        {/* Floating atmosphere particles */}
        <AmbientParticles count={250} radius={7} />

        {/* User controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          dampingFactor={0.05}
          enableDamping
        />

        {/* Post-processing glow */}
        <EffectComposer>
          <Bloom
            intensity={avatarData.renderSettings.bloomStrength}
            luminanceThreshold={avatarData.renderSettings.bloomThreshold}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
