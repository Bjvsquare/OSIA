import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { OsiaScene } from './canvas/OsiaScene';
import { DetailPanel } from './ui/DetailPanel';
import { NavigationControls } from './ui/NavigationControls';
import { UserLabels } from './ui/UserLabels';
import { LoadingScreen } from './ui/LoadingScreen';
import { useVisualizationStore } from './stores/visualizationStore';
import './osia.css';

export function OsiaPage() {
    const { data, fetchData, isLoading, error } = useVisualizationStore();
    const viewMode = data?.viewMode || 'single';

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) {
        return (
            <div className="osia-error-container">
                <h2>Discovery Failed</h2>
                <p>{error}</p>
                <button onClick={() => fetchData()}>Retry Attunement</button>
            </div>
        );
    }

    return (
        <div className="osia-page">
            {/* Loading Screen managed by store/isLoading internally or as a separate component */}
            {(isLoading || !data) && <LoadingScreen />}

            {/* Title Bar */}
            <div className="osia-title-bar">
                <span className="osia-title-text">SENTARI VISION</span>
                <span className="osia-title-mode">{viewMode.toUpperCase()}</span>
            </div>

            {/* User Labels */}
            <UserLabels />

            {/* 3D Canvas */}
            <div className="osia-canvas">
                <Canvas
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                        logarithmicDepthBuffer: true,
                        preserveDrawingBuffer: true,
                        stencil: false,
                    }}
                    dpr={[1, 1.5]}
                    camera={{ position: [0, 0, 18], fov: 45, near: 0.1, far: 100 }}
                    flat
                >
                    <OsiaScene />
                    <Preload all />
                </Canvas>
            </div>

            {/* UI Overlays */}
            <DetailPanel />
            <NavigationControls />
        </div>
    );
}

// Named export for convenience
export default OsiaPage;
