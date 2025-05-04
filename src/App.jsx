import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [now, setNow] = useState(Date.now());

    /* ticker per aggiornare l’orologio di testa */
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    /* fetch + realtime */
    useEffect(() => {
        fetchAll();

        const ch = supabase
            .channel('public:activity_session')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                fetchAll
            )
            .subscribe();

        return () => supabase.removeChannel(ch);
    }, []);

    /* carica attività e sessione attiva */
    const fetchAll = async () => {
        const actRes = await supabase.from('activities').select('*');
        setActivities(actRes.data.sort((a, b) => b.pinned - a.pinned));

        const sessRes = await supabase
            .from('activity_session')
            .select('id, activity_id, start_time, end_time')
            .order('start_time', { ascending: false });

        /* ultima sessione senza end_time */
        const latestActive = sessRes.data.find(s => s.end_time === null);
        setActiveSession(latestActive);
    };

    /* avvia nuova sessione */
    const start = async id => {
        if (activeSession) {
            alert('Hai già un’attività in corso. Fermala prima.');
            return;
        }
        await supabase.from('activity_session').insert({ activity_id: id });
        await fetchAll();
    };

    /* ferma la sessione corrente */
    const stop = async () => {
        if (!activeSession) return;
        await supabase
            .from('activity_session')
            .update({ end_time: new Date().toISOString() })
            .eq('id', activeSession.id);
        await fetchAll();
    };

    /* (un‑)pin */
    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    /* hh:mm:ss helper */
    const formatHMS = sec => {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    /* header live */
    const activeActivity = activities.find(
        a => String(a.id) === String(activeSession?.activity_id)
    );

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>

            {activeSession && activeActivity && (
                <div className="bg-yellow-100 p-4 mb-4 font-bold rounded">
                    ⏰ Attività attiva: {activeActivity.name} –{' '}
                    {formatHMS(
                        Math.floor((now - new Date(activeSession.start_time)) / 1000)
                    )}
                </div>
            )}

            <AddActivity onAdd={fetchAll} />

            <div className="space-y-3">
                {activities.map(a => {
                    const isActive =
                        activeSession &&
                        String(activeSession.activity_id) === String(a.id);
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