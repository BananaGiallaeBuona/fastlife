import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddActivity({ onAdd }) {
    const [name, setName] = useState('');
    const [weeklyGoal, setWeeklyGoal] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await supabase
            .from('activities')
            .insert({ name, weeklyGoal: parseFloat(weeklyGoal), spentTime: 0 });
        setName('');
        setWeeklyGoal('');
        onAdd();
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 flex space-x-2">
            <input
                className="border p-2 flex-1"
                placeholder="Nome attività"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                className="border p-2 w-24"
                placeholder="Obiettivo sett."
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
            />
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 rounded"
            >
                Aggiungi
            </button>
        </form>
    );
}