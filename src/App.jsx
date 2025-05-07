import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchEverything();

        const ch = supabase
            .channel('public:activity_session')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                fetchEverything)
            .subscribe();

        return () => supabase.removeChannel(ch);
    }, []);

    const fetchEverything = async () => {
        const act = await supabase.from('activities').select('*');
        setActivities(act.data.sort((a, b) => b.pinned - a.pinned));

        const sess = await supabase
            .from('activity_session')
            .select('id, activity_id, start_time, end_time, duration')
            .order('start_time', { ascending: false });

        setSessions(sess.data);
    };

    const getActiveSession = () => sessions.find(s => !s.end_time);

    const start = async id => {
        const current = getActiveSession();

        if (current) {
            const currentActivity = activities.find(a => a.id === current.activity_id);
            if (current.activity_id === id) {
                alert("Questa attività è già in corso.");
                return;
            }

            const conferma = confirm(
                `Attualmente è attiva "${currentActivity.name}". Vuoi fermarla e avviare "${activities.find(a => a.id === id).name}"?`
            );
            if (!conferma) return;

            await stop(current);
        }

        await supabase.from('activity_session').insert({
            activity_id: id,
            start_time: new Date().toISOString()
        });

        await fetchEverything();
    };

    const stop = async session => {
        if (!session) return;

        const endTime = new Date().toISOString();
        const startTime = new Date(session.start_time);
        const durationSec = Math.floor((new Date(endTime) - startTime) / 1000);

        await supabase
            .from('activity_session')
            .update({ end_time: endTime, duration: durationSec })
            .eq('id', session.id);

        const activity = activities.find(a => a.id === session.activity_id);
        const newSpent = (activity?.spentTime || 0) + durationSec;

        await supabase
            .from('activities')
            .update({ spentTime: newSpent })
            .eq('id', session.activity_id);

        await fetchEverything();
    };

    const togglePin = async (id, currentPinned) => {
        const { error } = await supabase
            .from('activities')
            .update({ pinned: !currentPinned })
            .eq('id', id);

        if (error) {
            alert('Errore nel salvataggio del pin.');
        } else {
            fetchEverything();
        }
    };

    const activeSession = getActiveSession();
    const activeActivity = activities.find(a => a.id === activeSession?.activity_id);

    const formatHMS = seconds => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const elapsed = activeSession?.start_time
        ? Math.floor((now - new Date(activeSession.start_time)) / 1000)
        : 0;

    return (
        <div className="p-6 max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">FastLife 🚀</h1>
            </div>

            {activeSession && activeActivity && (
                <div className="sticky top-0 z-50 bg-yellow-100 border-b-4 border-yellow-400 shadow-lg px-6 py-5 mb-8 rounded-b-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-yellow-900">
                            <span className="text-4xl">⚡</span>
                            <span className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                                Attività attiva: <span className="underline">{activeActivity.name}</span>
                            </span>
                        </div>
                        <span className="font-mono text-3xl sm:text-4xl text-yellow-800 tracking-widest tabular-nums animate-pulse-fast">
                            {formatHMS(elapsed)}
                        </span>
                    </div>
                </div>
            )}

            <AddActivity onAdd={fetchEverything} />

            <div className="space-y-3">
                {activities.map(a => {
                    const session = sessions.find(
                        s => s.activity_id === a.id && !s.end_time
                    );
                    return (
                        <ActivityCard
                            key={a.id}
                            activity={a}
                            activeSession={session}
                            onStart={() => start(a.id)}
                            onStop={() => stop(session)}
                            onTogglePin={() => togglePin(a.id, a.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}