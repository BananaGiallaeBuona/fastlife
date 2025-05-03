import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(i);
    }, []);

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
            .select('id, activity_id, start_time, end_time')
            .order('start_time', { ascending: false }); // prendi la più recente

        setSessions(data);
    };

    const start = async id => {
        const active = sessions.find(s => !s.end_time);
        if (active) {
            alert("Hai già un'attività in corso. Fermala prima.");
            return;
        }
        await supabase.from('activity_session').insert({ activity_id: id });
        await fetchSessions(); // aggiorna subito
    };

    const stop = async sid => {
        await supabase
            .from('activity_session')
            .update({ end_time: new Date().toISOString() })
            .eq('id', sid);
        await fetchSessions(); // aggiorna subito
    };

    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    // trova sessione attiva globale
    const active = sessions.find(s => !s.end_time);
    const activeActivity = activities.find(a => a.id === active?.activity_id);

    const formatHMS = sec => {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    let header = null;
    if (active && activeActivity) {
        const diff = Math.floor((now - new Date(active.start_time)) / 1000);
        header = (
            <div className="bg-yellow-100 p-4 mb-4 font-bold rounded">
                ⏰ Attività attiva: {activeActivity.name} – {formatHMS(diff)}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>

            {header}
            <AddActivity onAdd={fetchActivities} />

            <div className="space-y-3">
                {activities.map(a => {
                    // trova la sessione attiva specifica per questa attività
                    const session = sessions.find(s => s.activity_id === a.id && !s.end_time);
                    return (
                        <ActivityCard
                            key={a.id}
                            activity={a}
                            activeSession={session}
                            onStart={() => start(a.id)}
                            onStop={() => session && stop(session.id)}
                            onTogglePin={() => togglePin(a.id, !a.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}