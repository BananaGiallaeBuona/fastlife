import React, { useEffect, useState } from 'react';

export default function ActivityCard({
    activity,
    activeSession,
    onStart,
    onStop,
    onTogglePin,
}) {
    /* live timer ─────────────────── */
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!activeSession) {
            setElapsed(0);
            return;
        }

        function tick() {
            const start = new Date(activeSession.started_at).getTime();
            setElapsed(Math.floor((Date.now() - start) / 60000)); // minuti interi
        }

        tick();                       // primo calcolo immediato
        const id = setInterval(tick, 60000);

        return () => clearInterval(id);
    }, [activeSession]);

    /* helpers ────────────────────── */
    const minutesLabel = elapsed === 1 ? 'minuto' : 'minuti';

    /* UI ─────────────────────────── */
    return (
        <div className="border p-4 rounded shadow-sm flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold">{activity.name}</h2>
                {activeSession && (
                    <p className="text-sm text-gray-600 mt-1">
                        {elapsed} {minutesLabel}
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                {activeSession ? (
                    <button
                        onClick={onStop}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                        Start
                    </button>
                )}

                <button
                    onClick={onTogglePin}
                    className={`px-2 py-1 border rounded ${activity.pinned ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                >
                    📌
                </button>
            </div>
        </div>
    );
}