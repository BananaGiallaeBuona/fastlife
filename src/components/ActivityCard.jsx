import React, { useEffect, useState } from 'react';

export default function ActivityCard({
    activity,
    activeSession,
    onStart,
    onStop,
    onTogglePin,
}) {
    const [msElapsed, setMsElapsed] = useState(0);

    useEffect(() => {
        let intervalId;

        if (activeSession) {
            const startTs = new Date(activeSession.started_at).getTime();
            // inizializza contatore
            setMsElapsed(Date.now() - startTs);

            // aggiorna ogni secondo
            intervalId = setInterval(() => {
                setMsElapsed(Date.now() - startTs);
            }, 1000);
        } else {
            setMsElapsed(0);
        }

        return () => clearInterval(intervalId);
    }, [activeSession]);

    const formatTime = (ms) => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return [
            h > 0 ? `${h}h` : null,
            `${m}m`,
            `${s}s`
        ].filter(Boolean).join(' ');
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded shadow">
            <div>
                <h2 className="text-xl font-semibold">{activity.name}</h2>
                <p className="text-sm text-gray-600">
                    {activeSession
                        ? `⏱ ${formatTime(msElapsed)}`
                        : '⏸️'}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                {activeSession ? (
                    <button
                        onClick={() => onStop(activeSession.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                        Start
                    </button>
                )}
                <button onClick={onTogglePin} className="text-2xl">
                    {activity.pinned ? '📌' : '📍'}
                </button>
            </div>
        </div>
    );
}