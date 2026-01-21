import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useVisualizationStore } from '../stores/visualizationStore';

export function CameraController() {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    const isFirstRender = useRef(true);

    const viewState = useVisualizationStore(s => s.viewState);
    const mode = viewState.mode;
    const cameraTarget = viewState.cameraTarget;
    const cameraPosition = viewState.cameraPosition;

    // Camera transitions via GSAP — skip animation on first render
    useEffect(() => {
        if (isFirstRender.current) {
            // Set position instantly on mount (no animation = no flicker)
            camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
            if (controlsRef.current) {
                controlsRef.current.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
                controlsRef.current.update();
            }
            isFirstRender.current = false;
            return;
        }

        // Animate on subsequent changes (zoom in/out)
        gsap.to(camera.position, {
            x: cameraPosition[0],
            y: cameraPosition[1],
            z: cameraPosition[2],
            duration: 1.5,
            ease: 'power2.inOut',
        });

        if (controlsRef.current) {
            gsap.to(controlsRef.current.target, {
                x: cameraTarget[0],
                y: cameraTarget[1],
                z: cameraTarget[2],
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: () => controlsRef.current?.update(),
            });
        }
    }, [cameraTarget, cameraPosition, camera]);

    return (
        <OrbitControls
            ref={controlsRef}
            enableZoom={mode === 'overview'}
            enablePan={false}
            enableRotate={mode === 'overview'}
            touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
            minDistance={8}
            maxDistance={35}
            enableDamping
            dampingFactor={0.05}
            autoRotate={mode === 'overview'}
            autoRotateSpeed={0.3}
            makeDefault
        />
    );
}
