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
        const active = sessions.find(s => !s.end_time);
        if (active) {
            alert("Hai già un'attività in corso. Fermala prima di iniziarne un'altra.");
            return;
        }
        await supabase.from('activity_session').insert({ activity_id: id });
    };

    const stop = sid =>
        supabase.from('activity_session')
            .update({ end_time: new Date().toISOString() })
            .eq('id', sid);

    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>

            {/* TIMER ATTIVO IN TESTA */}
            {(() => {
                const active = sessions.find(s => !s.end_time);
                const activity = activities.find(a => a.id === active?.activity_id);
                if (!active || !activity) return null;

                const start = new Date(active.start_time);
                const now = Date.now();
                const diffSec = Math.floor((now - start.getTime()) / 1000);
                const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
                const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
                const s = String(diffSec % 60).padStart(2, '0');

                return (
                    <div style={{ background: '#fef9c3', padding: '12px', marginBottom: '16px', fontWeight: 'bold' }}>
                        ⏱ Attività attiva: {activity.name} – {h}:{m}:{s}
                    </div>
                );
            })()}

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
                            onStop={() => active && stop(active.id)}
                            onTogglePin={() => togglePin(a.id, !a.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}