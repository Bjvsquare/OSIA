import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { OsiaScene } from './canvas/OsiaScene';
import { DetailPanel } from './ui/DetailPanel';
import { NavigationControls } from './ui/NavigationControls';
import { UserLabels } from './ui/UserLabels';
import { LoadingScreen } from './ui/LoadingScreen';
import { useVisualizationStore } from './stores/visualizationStore';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import './osia.css';

export function OsiaPage() {
    const { data, fetchData, isLoading, error } = useVisualizationStore();
    const viewMode = data?.viewMode || 'single';
    const { auth } = useAuth();

    // Fetch user's avatar/portrait URL for core orb
    const { data: profileData } = useQuery({
        queryKey: ['user-profile-portrait'],
        queryFn: async () => {
            const res = await axios.get('/api/users/profile', {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            return res.data;
        },
        enabled: !!auth.token,
        staleTime: 60000,
    });

    const portraitUrl = profileData?.avatarUrl || null;

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
                <span className="osia-title-text">OSIA VISION</span>
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
                    <OsiaScene portraitUrl={portraitUrl} />
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
