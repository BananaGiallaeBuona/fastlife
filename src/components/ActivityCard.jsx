import { useEffect, useState } from 'react';

const ActivityCard = ({ activity, index, updateActivity, resetActivity }) => {
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                updateActivity(index, 1); // +1 minuto ogni 60 secondi
            }, 60000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const hours = Math.floor(activity.spentTime / 60);
    const minutes = activity.spentTime % 60;

    return (
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{activity.name}</h3>
            <p>🎯 Obiettivo settimanale: {Math.floor(activity.weeklyGoal / 60)}h {activity.weeklyGoal % 60}min</p>
            <p>⏱️ Tempo speso: {hours}h {minutes}min</p>

            <div className="mt-2 flex gap-2">
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-4 py-2 rounded text-white ${isRunning ? 'bg-red-500' : 'bg-green-500'
                        }`}
                >
                    {isRunning ? 'Stop' : 'Start'}
                </button>

                <button
                    onClick={() => resetActivity(index)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default ActivityCard;
