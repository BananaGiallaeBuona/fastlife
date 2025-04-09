import { useEffect, useRef, useState } from 'react';

function ActivityCard({ activity, onDelete }) {
    const [time, setTime] = useState(activity.spentTime || 0);
    const [running, setRunning] = useState(false);
    const interval = useRef(null);

    useEffect(() => {
        if (running) {
            interval.current = setInterval(() => {
                setTime((prev) => prev + 1);
            }, 60000); // 1 minuto
        } else {
            clearInterval(interval.current);
        }
        return () => clearInterval(interval.current);
    }, [running]);

    const handleReset = () => {
        setTime(0);
        setRunning(false);
    };

    const ore = Math.floor(time / 60);
    const minuti = time % 60;

    return (
        <div className="bg-white p-4 rounded shadow-md max-w-md mx-auto flex flex-col gap-2">
            <h2 className="text-xl font-bold">{activity.name}</h2>
            <p>🎯 Obiettivo settimanale: {Math.round(activity.weeklyGoal / 60)}h</p>
            <p>⏱️ Tempo speso: {ore}h {minuti}min</p>
            <div className="flex gap-2">
                <button
                    onClick={() => setRunning(!running)}
                    className={`px-4 py-1 rounded ${running ? 'bg-red-500' : 'bg-green-500'} text-white`}
                >
                    {running ? 'Stop' : 'Start'}
                </button>
                <button onClick={handleReset} className="px-4 py-1 rounded bg-gray-400 text-white">
                    Reset
                </button>
                <button onClick={onDelete} className="px-4 py-1 rounded bg-red-600 text-white">
                    Elimina
                </button>
            </div>
        </div>
    );
}

export default ActivityCard;