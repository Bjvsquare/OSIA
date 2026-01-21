import { useVisualizationStore } from '../stores/visualizationStore';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function AdaptivePostProcessing() {
    const mode = useVisualizationStore(s => s.viewState.mode);

    return (
        <EffectComposer>
            <Bloom
                intensity={1.2}
                luminanceThreshold={0.15}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
            <Vignette
                offset={0.3}
                darkness={mode === 'zoomed' ? 0.8 : 0.6}
            />
        </EffectComposer>
    );
}
