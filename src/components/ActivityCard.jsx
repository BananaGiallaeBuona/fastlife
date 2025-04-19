import React, { useEffect, useState } from 'react';

export default function ActivityCard({
    activity,
    activeSession,
    onStart,
    onStop,
    onTogglePin,
}) {
    const [elapsedSec, setElapsedSec] = useState(0);

    // aggiorna il timer in real time
    useEffect(() => {
        let interval;
        if (activeSession) {
            const start = new Date(activeSession.started_at).getTime();
            // setto subito
            setElapsedSec(Math.floor((Date.now() - start) / 1000));
            interval = setInterval(() => {
                setElapsedSec(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsedSec(0);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    // converti in minuti (arrotondati)
    const minutes = Math.floor(elapsedSec / 60);
    const displayTime = activeSession ? minutes : activity.spentTime;

    return (
        <div className="border p-4 rounded flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold">
                    {activity.name}{' '}
                    <button onClick={onTogglePin} className="ml-2">
                        {activity.pinned ? '📌' : '📍'}
                    </button>
                </h2>
                <p className="text-gray-600">
                    {displayTime} {displayTime === 1 ? 'minuto' : 'minuti'}
                </p>
            </div>
            <div>
                {activeSession ? (
                    <button
                        onClick={onStop}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Start
                    </button>
                )}
            </div>
        </div>
    );
}