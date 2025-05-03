// FILE: src/components/ActivityCard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ActivityCard({ activity, session }) {
    const [elapsed, setElapsed] = useState('00:00');
    const [intervalId, setIntervalId] = useState(null);
    const [activeSession, setActiveSession] = useState(session);
    const [pinned, setPinned] = useState(false);

    useEffect(() => {
        setActiveSession(session);
    }, [session]);

    useEffect(() => {
        const localPin = localStorage.getItem(`pin-${activity.id}`);
        if (localPin === 'true') setPinned(true);
    }, [activity.id]);

    useEffect(() => {
        if (activeSession) {
            const start = new Date(activeSession.created_at);
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
            .insert({ activity_id: activity.id })
            .select()
            .single();
        if (!error) setActiveSession(data);
    };

    const stopSession = async () => {
        if (!activeSession) return;
        const { error } = await supabase
            .from('activity_session')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', activeSession.id);
        if (!error) setActiveSession(null);
    };

    const togglePin = () => {
        const newPin = !pinned;
        setPinned(newPin);
        localStorage.setItem(`pin-${activity.id}`, newPin);
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
