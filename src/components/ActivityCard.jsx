import React, { useEffect, useState } from 'react';

export default function ActivityCard({
    activity,
    activeSession,
    onStart,
    onStop,
    onTogglePin
}) {
    const [elapsed, setElapsed] = useState(0);

    // Calcola e aggiorna l'orologio live
    useEffect(() => {
        if (!activeSession) {
            setElapsed(0);
            return;
        }
        const start = new Date(activeSession.created_at).getTime();
        function tick() {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [activeSession]);

    // formattazione mm:ss
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');

    return (
        <div className="border p-4 rounded shadow">
            <h2 className="text-xl font-bold">{activity.name}</h2>
            <div className="mt-2">
                {activeSession
                    ? <button onClick={onStop} className="px-3 py-1 bg-red-500 text-white rounded">
                        Stop ({mm}:{ss})
                    </button>
                    : <button onClick={onStart} className="px-3 py-1 bg-green-500 text-white rounded">
                        Start
                    </button>
                }
                <button onClick={onTogglePin} className="ml-2">📌</button>
            </div>
        </div>
    );
}