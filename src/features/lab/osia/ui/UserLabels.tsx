import { useVisualizationStore } from '../stores/visualizationStore';

export function UserLabels() {
    const data = useVisualizationStore(s => s.data);
    const mode = useVisualizationStore(s => s.viewState.mode);

    if (mode === 'zoomed') return null;

    return (
        <div className="osia-user-labels">
            {data.users.map(user => (
                <div
                    key={user.id}
                    className="osia-user-label"
                    style={{
                        [user.position === 'left' ? 'left' : 'right']: '5%',
                        top: '12%',
                        borderColor: user.colorTheme,
                    }}
                >
                    <div className="osia-user-label-dot" style={{ background: user.colorTheme }} />
                    <div>
                        <div className="osia-user-label-name">{user.name}</div>
                        <div className="osia-user-label-type">{user.personalityType}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
