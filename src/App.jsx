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

        // sottoscrivi in realtime alle activity_session
        const sub = supabase
            .from('activity_session')
            .on('*', () => {
                fetchSessions();
            })
            .subscribe();

        return () => {
            supabase.removeSubscription(sub);
        };
    }, []);

    const fetchActivities = async () => {
        const { data, error } = await supabase
            .from('activities')
            .select('*');
        if (!error) {
            // ordina le pinned in cima
            setActivities(data.sort((a, b) => b.pinned - a.pinned));
        }
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .select('*');
        if (!error) setSessions(data);
    };

    const handleStart = async (activityId) => {
        await supabase
            .from('activity_session')
            .insert({ activity_id: activityId });
    };

    const handleStop = async (sessionId) => {
        await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', sessionId);
    };

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