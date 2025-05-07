import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddActivity({ onAdd }) {
    const [name, setName] = useState('');
    const [weeklyGoal, setWeeklyGoal] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { error } = await supabase
            .from('activities')
            .insert({
                name,
                weekly_goal: parseFloat(weeklyGoal),
                spentTime: 0,
                pinned: false
            });

        if (error) {
            console.error('Errore Supabase:', error.message);
            alert('Errore durante il salvataggio. Controlla i dati e riprova.');
            return;
        }

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
                required
            />
            <input
                type="number"
                className="border p-2 w-24"
                placeholder="Ore sett."
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                required
                min="0"
            />
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
            >
                Aggiungi
            </button>
        </form>
    );
}