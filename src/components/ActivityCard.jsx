import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ActivityCard({ activity, session }) {
    const [elapsed, setElapsed] = useState('00:00');
    const [intervalId, setIntervalId] = useState(null);
    const [activeSession, setActiveSession] = useState(session);
    const [pinned, setPinned] = useState(activity.pinned || false);

    useEffect(() => {
        setActiveSession(session);
    }, [session]);

    useEffect(() => {
        if (activeSession?.start_time) {
            const start = new Date(activeSession.start_time);
            if (isNaN(start)) return;

            const id = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now - start) / 1000);
                const mm = String(Math.floor(diff / 60)).padStart(2, '0');
                const ss = String(diff % 60).padStart(2, '0');
                setElapsed(`${mm}:${ss}`);
            }, 1000);
            setIntervalId(id);
            return () => clearInterval(id);
        } else {
            clearInterval(intervalId);
            setElapsed('00:00');
        }
    }, [activeSession]);

    const startSession = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .insert({ activity_id: activity.id, start_time: new Date().toISOString() })
            .select()
            .single();
        if (!error && data?.start_time) {
            setActiveSession(data);
        } else {
            console.error('Start session error:', error);
        }
    };

    const stopSession = async () => {
        if (!activeSession?.id) return;
        const end = new Date();
        const start = new Date(activeSession.start_time);
        const durationSec = Math.floor((end - start) / 1000);

        const { error } = await supabase
            .from('activity_session')
            .update({ end_time: end.toISOString(), duration: durationSec })
            .eq('id', activeSession.id);

        if (!error) {
            setActiveSession(null);
        } else {
            console.error('Stop session error:', error);
        }
    };

    const togglePin = async () => {
        const newPin = !pinned;
        setPinned(newPin);
        const { error } = await supabase
            .from('activities')
            .update({ pinned: newPin })
            .eq('id', activity.id);
        if (error) console.error('Failed to update pin:', error);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <h2>{activity.name}</h2>
            <button onClick={activeSession ? stopSession : startSession}>
                {activeSession ? `Stop (${elapsed})` : 'Start'}
            </button>
            <button onClick={togglePin}>
                {pinned ? '📌' : '📍'}
            </button>
        </div>
    );
}
