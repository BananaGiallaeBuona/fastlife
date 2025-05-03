import React, { useEffect, useState } from 'react';

export default function ActivityCard({ activity, activeSession, onStart, onStop, onTogglePin }) {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(!!activeSession);

    useEffect(() => {
        if (!activeSession || !activeSession.start_time) {
            setIsRunning(false);
            return;
        }

        setIsRunning(true);
        const start = new Date(activeSession.start_time);

        const tick = () => {
            const now = Date.now();
            const diff = Math.floor((now - start.getTime()) / 1000);
            setElapsed(diff);
        };

        tick(); // calcolo iniziale
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    const handleStop = async () => {
        if (activeSession && activeSession.id) {
            await onStop();
            setIsRunning(false);
        }
    };

    const formatTime = seconds => {
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold">{activity.name}</h2>

            <div className="flex items-center gap-2 mt-2">
                {isRunning ? (
                    <button onClick={handleStop}>
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