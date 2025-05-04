import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    // fetch iniziale + realtime
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
            .select('id')
            .is('end_time', null);

        if (running.length > 0) {
            alert("Hai già un'attività in corso. Fermala prima.");
            return;
        }

        await supabase.from('activity_session').insert({ activity_id: id, start_time: new Date().toISOString() });
    };

    const stop = async (sid) => {
        const { error } = await supabase
            .from('activity_session')
            .update({ end_time: new Date().toISOString() })
            .eq('id', sid);

        if (error) {
            alert("Errore nella chiusura della sessione.");
            console.error(error);
        }
    };

    const togglePin = (id, p) =>
        supabase.from('activities').update({ pinned: p }).eq('id', id);

    const activeSession = sessions.find(s => !s.end_time);
    const activeActivity = activities.find(a => a.id === activeSession?.activity_id);

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl mb-4 font-bold">FastLife 🚀</h1>

            {activeSession && activeActivity && (
                <div className="bg-yellow-100 p-2 mb-4 rounded font-medium">
                    🕰️ Attività attiva: {activeActivity.name} – <LiveTimer start={activeSession.start_time} />
                </div>
            )}

            <AddActivity onAdd={fetchActivities} />
            <div className="space-y-3">
                {activities.map(a => {
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

// live cronometro
function LiveTimer({ start }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!start) return;

        const tick = () => {
            const delta = Math.floor((Date.now() - new Date(start)) / 1000);
            setElapsed(delta);
        };

        tick(); // subito
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [start]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}