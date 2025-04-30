import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    // 1) Carica attività e sessioni iniziali
    useEffect(() => {
        fetchActivities();
        fetchSessions();

        // ────────────────────────────────────────────────────────────────
        // 2) Sostituisci qui la vecchia subscription con un Channel V2
        // ────────────────────────────────────────────────────────────────
        const channel = supabase
            .channel('public:activity_session')                  // nome univoco del channel
            .on(
                'postgres_changes',                                // tutti gli eventi Postgres
                { event: '*', schema: 'public', table: 'activity_session' },
                () => {
                    // ogni volta che INSERT / UPDATE / DELETE su activity_session
                    fetchSessions();
                }
            )
            .subscribe();

        return () => {
            // pulisci il channel quando il componente smonta
            supabase.removeChannel(channel);
        };
    }, []);

    // fetch delle attività, con le pinned in cima
    const fetchActivities = async () => {
        const { data, error } = await supabase.from('activities').select('*');
        if (!error) {
            setActivities(data.sort((a, b) => b.pinned - a.pinned));
        }
    };

    // fetch delle sessioni
    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .select('*');
        if (!error) setSessions(data);
    };

    // inizia una nuova sessione
    const handleStart = async (activityId) => {
        await supabase
            .from('activity_session')
            .insert({ activity_id: activityId });
    };

    // ferma la sessione attiva
    const handleStop = async (sessionId) => {
        await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', sessionId);
    };

    // toggle pin su un’attività
    const togglePin = async (activityId, pinned) => {
        await supabase
            .from('activities')
            .update({ pinned })
            .eq('id', activityId);
        fetchActivities();
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl mb-6">FastLife 🚀</h1>
            <AddActivity onAdd={fetchActivities} />
            <div className="space-y-4">
                {activities.map((act) => {
                    // trovo se c'è una sessione attiva
                    const activeSession = sessions.find(
                        (s) => s.activity_id === act.id && !s.ended_at
                    );
                    return (
                        <ActivityCard
                            key={act.id}
                            activity={act}
                            activeSession={activeSession}
                            onStart={() => handleStart(act.id)}
                            onStop={() => handleStop(activeSession.id)}
                            onTogglePin={() => togglePin(act.id, !act.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default App;