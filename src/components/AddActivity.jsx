import { useState } from 'react';

function AddActivity({ onAdd }) {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !goal) return;

        const parsedGoal = parseFloat(goal.replace(',', '.'));
        const newActivity = {
            name,
            weeklyGoal: Math.round(parsedGoal * 60),
            spentTime: 0,
        };

        onAdd(newActivity);
        setName('');
        setGoal('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center justify-center flex-wrap">
            <input
                type="text"
                placeholder="Nome attività"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border px-2 py-1 rounded"
            />
            <input
                type="text"
                placeholder="Obiettivo settimanale (ore)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="border px-2 py-1 rounded w-48"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600">
                Aggiungi
            </button>
        </form>
    );
}

export default AddActivity;