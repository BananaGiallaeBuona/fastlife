import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ActivityCard from './components/ActivityCard';
import AddActivity from './components/AddActivity';

export default function App() {
    const [activities, setActivities] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            const { data } = await supabase.from('activities').select('*');
            setActivities(data);
        };
        fetchActivities();
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            const { data } = await supabase
                .from('activity_session')
                .select('id,activity_id,created_at,ended_at')
                .is('ended_at', null)
                .order('created_at', { ascending: true });
            setSessions(data);
        };
        fetchSessions();

        const channel = supabase.channel('session-changes')
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

    return (
        <div style={{ padding: '1rem' }}>
            <h1>FastLife 🚀</h1>
            <AddActivity onAdd={newActivity => setActivities(prev => [...prev, newActivity])} />
            {activities.map(activity => (
                <ActivityCard
                    key={activity.id}
                    activity={activity}
                    session={sessions?.find(s => s.activity_id === activity.id)}
                />
            ))}
        </div>
    );
}