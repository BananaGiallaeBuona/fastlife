import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        fetchAll();

        const ch = supabase
            .channel('public:activity_session')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                fetchAll)
            .subscribe();

        return () => supabase.removeChannel(ch);
    }, []);

    const fetchAll = async () => {
        const act = await supabase.from('activities').select('*');
        setActivities(act.data.sort((a, b) => b.pinned - a.pinned));

        const sess = await supabase
            .from('activity_session')
            .select('id, activity_id, start_time, end_time')
            .order('start_time', { ascending: false });

        // Prende solo la sessione attiva più recente (senza end_time)
        const latestActive = sess.data.find(s => s.end_time === null);
        setActiveSession(latestActive);
    };

    const start = async id => {
        if (activeSession) {
            alert("Hai già un'attività in corso. Fermala prima.");
            return;
        }
        await supabase.from('activity_session').insert({ activity_id: id });
        await fetchAll();
    };

    const stop = async () => {
        if (!activeSession) return;
        await supabase
            .from('activity_session')
            .update({ end_time: new Date().toISOString() })
            .eq('id', activeSession.id);
        await fetchAll();
    };

    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    const formatHMS = sec => {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    let header = null;
    const activeActivity = activities.find(a => a.id === activeSession?.activity_id);
    if (activeSession && activeActivity) {
        const elapsed = Math.floor((now - new Date(activeSession.start_time)) / 1000);
        header = (
            <div className="bg-yellow-100 p-4 mb-4 font-bold rounded">
                ⏰ Attività attiva: {activeActivity.name} – {formatHMS(elapsed)}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>

            {header}
            <AddActivity onAdd={fetchAll} />

            <div className="space-y-3">
                {activities.map(a => {
                    const isActive = activeSession?.activity_id === a.id;
                    return (
                        <ActivityCard
                            key={a.id}
                            activity={a}
                            activeSession={isActive ? activeSession : null}
                            onStart={() => start(a.id)}
                            onStop={stop}
                            onTogglePin={() => togglePin(a.id, !a.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}