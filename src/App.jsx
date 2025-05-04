// FILE: src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchActivities();
        fetchSessions();

        const ch = supabase
            .channel('public:activity_session')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                fetchSessions)
            .subscribe();

        return () => supabase.removeChannel(ch);
    }, []);

    const fetchActivities = async () => {
        const { data } = await supabase.from('activities').select('*');
        setActivities(data.sort((a, b) => b.pinned - a.pinned));
    };

    const fetchSessions = async () => {
        const { data } = await supabase
            .from('activity_session')
            .select('id,activity_id,start_time,end_time')
            .order('start_time', { ascending: true });
        setSessions(data);
    };

    const start = async id => {
        const { data: running } = await supabase
            .from('activity_session')
            .select('*')
            .is('end_time', null);

        if (running.length > 0) {
            alert("Hai già un'attività in corso. Fermala prima.");
            return;
        }

        await supabase.from('activity_session').insert({
            activity_id: id,
            start_time: new Date().toISOString()
        });
    };

    const stop = async (session) => {
        if (!session) return;

        const endTime = new Date().toISOString();
        const startTime = new Date(session.start_time);
        const durationSec = Math.floor((new Date(endTime) - startTime) / 1000);

        // Aggiorna la sessione con end_time e durata
        await supabase
            .from('activity_session')
            .update({
                end_time: endTime,
                duration: durationSec
            })
            .eq('id', session.id);

        // Aggiorna il tempo speso in attività
        const activity = activities.find(a => a.id === session.activity_id);
        const newSpent = (activity?.spentTime || 0) + durationSec;

        await supabase
            .from('activities')
            .update({ spentTime: newSpent })
            .eq('id', session.activity_id);

        // Prompt per attività successiva
        const next = prompt("Quale attività vuoi avviare ora? Scrivi il nome esatto:");
        if (next) {
            const nextActivity = activities.find(a => a.name.toLowerCase() === next.toLowerCase());
            if (nextActivity) {
                await start(nextActivity.id);
            } else {
                alert("Attività non trovata.");
            }
        }
    };

    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>
            <AddActivity onAdd={fetchActivities} />
            <div className="space-y-3">
                {activities.map(a => {
                    const active = sessions.find(
                        s => s.activity_id === a.id && !s.end_time
                    );
                    return (
                        <ActivityCard
                            key={a.id}
                            activity={a}
                            activeSession={active}
                            onStart={() => start(a.id)}
                            onStop={() => stop(active)}
                            onTogglePin={() => togglePin(a.id, !a.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}