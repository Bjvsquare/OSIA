import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '../stores/visualizationStore';
import type { OrbData } from '../types';

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

function MetadataTag({ label }: { label: string }) {
    return <span className="osia-tag">{label}</span>;
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
                        <h2 className="osia-detail-title">{orb.label}</h2>
                        {orb.category && <span className="osia-detail-category">{orb.category}</span>}
                    </div>

                    <p className="osia-detail-description">{orb.description}</p>

                    <IntensityBar value={orb.intensity} label="Intensity" />

                    {orb.subTraits && orb.subTraits.length > 0 && (
                        <div className="osia-detail-section">
                            <h3 className="osia-detail-section-title">Sub-traits</h3>
                            <div className="osia-detail-subtraits">
                                {orb.subTraits.map(st => (
                                    <span key={st} className="osia-subtrait-badge">{st}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {orb.metadata?.strengths && (
                        <div className="osia-detail-section">
                            <h3 className="osia-detail-section-title">Strengths</h3>
                            <div className="osia-tag-group">
                                {orb.metadata.strengths.map((s: string) => <MetadataTag key={s} label={s} />)}
                            </div>
                        </div>
                    )}

                    {orb.metadata?.growthAreas && (
                        <div className="osia-detail-section">
                            <h3 className="osia-detail-section-title">Growth Areas</h3>
                            <div className="osia-tag-group">
                                {orb.metadata.growthAreas.map((s: string) => <MetadataTag key={s} label={s} />)}
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
        core: 'Central Core',
        synergy: 'Synergy',
        trait: 'Personality Trait',
        subtrait: 'Sub-Trait',
        'sub-trait': 'Sub-Trait',
        sharedVision: 'Shared Vision',
        complementary: 'Complement',
        collectiveIntelligence: 'Collective Intelligence',
        expression: 'Expression',
    };
    return map[type] || type;
}
