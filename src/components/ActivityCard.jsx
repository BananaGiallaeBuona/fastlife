import React, { useEffect, useState } from 'react';

export default function ActivityCard({ activity, activeSession, onStart, onStop, onTogglePin }) {
    const [elapsed, setElapsed] = useState(0);

    // Calcolo tempo passato
    useEffect(() => {
        if (!activeSession || !activeSession.start_time) return;

        const start = new Date(activeSession.start_time);

        const tick = () => {
            const now = Date.now();
            const diff = Math.floor((now - start.getTime()) / 1000); // in secondi
            setElapsed(diff);
        };

        tick(); // primo calcolo immediato
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [activeSession]);

    // Format mm:ss
    const formatTime = seconds => {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold">{activity.name}</h2>

            <div className="flex items-center gap-2 mt-2">
                {activeSession ? (
                    <button onClick={onStop}>
                        Stop ({formatTime(elapsed)})
                    </button>
                ) : (
                    <button onClick={onStart}>
                        Start
                    </button>
                )}

                <button onClick={onTogglePin}>
                    {activity.pinned ? '📌' : '📍'}
                </button>
            </div>
        </div>
    );
}