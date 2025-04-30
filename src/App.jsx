import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchActivities();
        fetchSessions();

        const channel = supabase
            .channel('public:activity_session')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'activity_session' },
                () => fetchSessions()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchActivities = async () => {
        const { data, error } = await supabase
            .from('activities')
            .select('*');
        if (!error) {
            setActivities(data.sort((a, b) => b.pinned - a.pinned));
        }
    };

    // fetch delle sessioni
    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .select('*')
            .order('started_at', { ascending: true });

        if (!error) {
            // tieni solo quelle ancora aperte
            setSessions(data.filter(s => !s.ended_at));
        }
    };

    const handleStart = async (activityId) => {
        await supabase
            .from('activity_session')
            .insert({ activity_id: activityId });
        fetchSessions();
    };

    const handleStop = async (sessionId) => {
        await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        fetchSessions();
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