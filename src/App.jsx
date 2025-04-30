import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    /* ──────────────────────────────────
       CARICAMENTO INIZIALE + REALTIME
    ─────────────────────────────────── */
    useEffect(() => {
        fetchActivities();
        fetchSessions();

        const channel = supabase
            .channel('public:activity_session')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                fetchSessions            // richiama direttamente la funzione
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    /* ──────────────────────────
       QUERY ATTIVITÀ  (pinned in cima)
    ─────────────────────────── */
    async function fetchActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('pinned', { ascending: false });

        if (!error) setActivities(data);
    }

    /* ──────────────────────────
       QUERY SESSIONI  (tutte)
    ─────────────────────────── */
    async function fetchSessions() {
        const { data, error } = await supabase
            .from('activity_session')
            .select('*')
            .order('started_at', { ascending: true });

        if (!error) setSessions(data);
    }

    /* ─────────────
       HANDLER
    ────────────── */
    const startSession = (activity_id) =>
        supabase.from('activity_session').insert({ activity_id });

    const stopSession = (session_id) =>
        supabase.from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', session_id);

    const togglePin = (id, pinned) =>
        supabase.from('activities').update({ pinned }).eq('id', id)
            .then(fetchActivities);

    /* ─────────────
       RENDER
    ────────────── */
    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">FastLife 🚀</h1>

            <AddActivity onAdd={fetchActivities} />

            <div className="space-y-4">
                {activities.map((act) => {
                    const active = sessions.find(
                        (s) => s.activity_id === act.id && !s.ended_at
                    );
                    return (
                        <ActivityCard
                            key={act.id}
                            activity={act}
                            activeSession={active}
                            onStart={() => startSession(act.id)}
                            onStop={active ? () => stopSession(active.id) : null}
                            onTogglePin={() => togglePin(act.id, !act.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}