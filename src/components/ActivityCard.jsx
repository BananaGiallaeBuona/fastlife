import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ActivityCard({ activity, session }) {
    const [running, setRunning] = useState(!!session);
    const [startTime, setStartTime] = useState(session ? new Date(session.created_at) : null);
    const [elapsed, setElapsed] = useState('00:00');
    const [timerId, setTimerId] = useState(null);

    useEffect(() => {
        if (running && startTime) {
            const id = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now - startTime) / 1000);
                const mm = String(Math.floor(diff / 60)).padStart(2, '0');
                const ss = String(diff % 60).padStart(2, '0');
                setElapsed(`${mm}:${ss}`);
            }, 1000);
            setTimerId(id);
            return () => clearInterval(id);
        }
    }, [running, startTime]);

    const startSession = async () => {
        const { data, error } = await supabase.from('activity_session').insert({
            activity_id: activity.id,
        }).select().single();
        if (!error) {
            setStartTime(new Date(data.created_at));
            setRunning(true);
        }
    };

    const stopSession = async () => {
        const { error } = await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', session.id);
        if (!error) {
            clearInterval(timerId);
            setRunning(false);
        }
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <h2>{activity.name}</h2>
            <button onClick={running ? stopSession : startSession}>
                {running ? `Stop (${elapsed})` : 'Start'}
            </button>
        </div>
    );
}