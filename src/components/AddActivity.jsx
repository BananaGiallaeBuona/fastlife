import { useState } from 'react';

const AddActivity = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [weeklyGoal, setWeeklyGoal] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !weeklyGoal) return;

        const goalHours = parseFloat(weeklyGoal.replace(',', '.'));
        if (isNaN(goalHours)) return;

        const goalMinutes = Math.round(goalHours * 60);

        onAdd({ name, weeklyGoal: goalMinutes, spentTime: 0 });
        setName('');
        setWeeklyGoal('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">➕ Aggiungi Attività</h2>
            <input
                type="text"
                placeholder="Nome attività"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 rounded w-full mb-2"
            />
            <input
                type="text"
                placeholder="Obiettivo settimanale (ore)"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className="border p-2 rounded w-full mb-2"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Aggiungi</button>
        </form>
    );
};

export default AddActivity;
