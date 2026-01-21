import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '../stores/visualizationStore';

function IntensityBar({ value, label }: { value: number; label: string }) {
    return (
        <div className="osia-intensity-bar">
            <div className="osia-intensity-label">
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </div>
            <div className="osia-intensity-track">
                <motion.div
                    className="osia-intensity-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

export function DetailPanel() {
    const isOpen = useVisualizationStore(s => s.isDetailPanelOpen);
    const orb = useVisualizationStore(s => s.detailPanelOrb);
    const closePanel = useVisualizationStore(s => s.closeDetailPanel);

    return (
        <AnimatePresence>
            {isOpen && orb && (
                <motion.div
                    className="osia-detail-panel"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <button className="osia-detail-close" onClick={closePanel}>✕</button>

                    <div className="osia-detail-header">
                        <div className="osia-detail-type">{formatType(orb.type)}</div>
                        <h2 className="osia-detail-title">{orb.name}</h2>
                        {orb.layerIndex && <span className="osia-detail-category">Layer {orb.layerIndex}</span>}
                    </div>

                    <p className="osia-detail-description">{orb.description}</p>

                    <IntensityBar value={orb.intensity} label="Confidence / Stability" />

                    {orb.metadata?.patterns && orb.metadata.patterns.length > 0 && (
                        <div className="osia-detail-section">
                            <h3 className="osia-detail-section-title">Active Dynamics</h3>
                            <div className="osia-detail-patterns">
                                {orb.metadata.patterns.map((p: any) => (
                                    <div key={p.patternId} className="osia-pattern-card">
                                        <span className="osia-pattern-name">{p.name}</span>
                                        <p className="osia-pattern-desc">{p.oneLiner}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {orb.metadata?.growthEdges && (
                        <div className="osia-detail-section">
                            <h3 className="osia-detail-section-title">Growth Edges</h3>
                            <div className="osia-tag-group">
                                {orb.metadata.growthEdges.map((s: string) => (
                                    <span key={s} className="osia-tag">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function formatType(type: string): string {
    const map: Record<string, string> = {
        core: 'Central Intelligence',
        cluster: 'Intelligence Cluster',
        layer: 'Operating Layer',
        synergy: 'Synergy Node',
        trait: 'Personality Trait',
        subtrait: 'Functional Detail',
        sharedVision: 'Shared Vision',
        complementary: 'Complementary Node',
        collectiveIntelligence: 'Collective Intelligence',
        expression: 'Linguistic Expression',
    };
    return map[type] || type;
}
