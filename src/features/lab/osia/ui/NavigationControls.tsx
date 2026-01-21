import { useVisualizationStore } from '../stores/visualizationStore';

export function NavigationControls() {
    const mode = useVisualizationStore(s => s.viewState.mode);
    const navigateOrb = useVisualizationStore(s => s.navigateOrb);
    const resetView = useVisualizationStore(s => s.resetView);

    if (mode !== 'zoomed') return null;

    return (
        <div className="osia-nav-controls">
            <button className="osia-nav-btn" onClick={() => navigateOrb('prev')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Prev</span>
            </button>
            <button className="osia-nav-btn osia-nav-center" onClick={resetView}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                <span>Overview</span>
            </button>
            <button className="osia-nav-btn" onClick={() => navigateOrb('next')}>
                <span>Next</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    );
}
