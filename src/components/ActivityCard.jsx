import { useEffect, useState } from 'react';

export default function ActivityCard({
    activity,
    activeSession,
    onStart,
    onStop,
    onTogglePin,
}) {
    const [elapsed, setElapsed] = useState(0);

    // aggiorna il contatore ogni secondo se la sessione è attiva
    useEffect(() => {
        if (!activeSession) return setElapsed(0);

        const tick = () => {
            const diff = Date.now() - new Date(activeSession.started_at).getTime();
            setElapsed(Math.floor(diff / 1000));
        };
        tick(); // immediato
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    // helper per hh:mm:ss
    const pretty = (sec) =>
        new Date(sec * 1000).toISOString().substring(11, 19);

    return (
        <div>
            <h2 className="text-xl font-bold">{activity.name}</h2>

            {activeSession && (
                <div className="text-sm text-gray-600 mb-1">
                    ⏱ {pretty(elapsed)}
                </div>
            )}

            <button
                onClick={activeSession ? () => onStop() : onStart}
                className="border px-4 py-1 mr-2"
            >
                {activeSession ? 'Stop' : 'Start'}
            </button>

            <button onClick={onTogglePin} className="border px-2">
                {activity.pinned ? '📌' : '📍'}
            </button>
        </div>
    );
}