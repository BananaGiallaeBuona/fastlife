import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    // 1) Carica attività e sessioni iniziali + setta la subscription Realtime
    useEffect(() => {
        fetchActivities();
        fetchSessions();

        // ────────────────────────────────────────────────────────────────
        // Realtime Channel v2 per activity_session
        // ────────────────────────────────────────────────────────────────
        const channel = supabase
            .channel('public:activity_session') // nome univoco del channel
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                () => {
                    // ad ogni INSERT/UPDATE/DELETE ricarica solo le sessioni aperte
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
        const { data, error } = await supabase
            .from('activities')
            .select('*');
        if (!error) {
            setActivities(data.sort((a, b) => b.pinned - a.pinned));
        }
    };

    // fetch delle sessioni APERTE (ended_at IS NULL)
    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .select('*')
            .is('ended_at', null)
            .order('started_at', { ascending: true });
        if (!error) {
            setSessions(data);
        }
    };

    // inizia una nuova sessione
    const handleStart = async (activityId) => {
        await supabase
            .from('activity_session')
            .insert({ activity_id: activityId });
        // fetchSessions verrà richiamato dalla subscription
    };

    // ferma la sessione attiva
    const handleStop = async (sessionId) => {
        await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        // fetchSessions verrà richiamato dalla subscription
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
                    // trova la sessione aperta (se esiste) per questa attività
                    const activeSession = sessions.find(
                        (s) => s.activity_id === act.id
                    );
                    return (
                        <ActivityCard
                            key={act.id}
                            activity={act}
                            activeSession={activeSession}
                            onStart={() => handleStart(act.id)}
                            onStop={() => handleStop(activeSession?.id)}
                            onTogglePin={() => togglePin(act.id, !act.pinned)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default App;