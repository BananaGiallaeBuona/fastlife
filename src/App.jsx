import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';

export default function App() {
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions] = useState([]);

  // ───────────────────────────────────────── load once
  useEffect(() => {
    loadActivities();
    loadSessions();

    const channel = supabase
      .channel('public:activity_session')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_session' },
        loadSessions
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ───────────────────────────────────────── helpers
  async function loadActivities() {
    const { data, error } = await supabase.from('activities').select('*');
    if (error) return console.error(error);
    setActivities(data.sort((a, b) => Number(b.pinned) - Number(a.pinned)));
  }

  async function loadSessions() {
    const { data, error } = await supabase
      .from('activity_session')
      .select('id, activity_id, started_at, ended_at')
      .order('started_at', { ascending: true });        // <- sintassi corretta

    if (error) return console.error(error);
    setSessions(data);
  }

  async function startSession(activity_id) {
    await supabase.from('activity_session').insert({ activity_id });
  }

  async function stopSession(session_id) {
    await supabase
      .from('activity_session')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session_id);
  }

  async function togglePin(id, pinned) {
    await supabase.from('activities').update({ pinned }).eq('id', id);
    loadActivities();
  }

  // ───────────────────────────────────────── UI
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl mb-6">FastLife 🚀</h1>

      <AddActivity onAdd={loadActivities} />

      <div className="space-y-6">
        {activities.map((a) => {
          const active = sessions.find((s) => s.activity_id === a.id && !s.ended_at);
          return (
            <ActivityCard
              key={a.id}
              activity={a}
              activeSession={active}
              onStart={() => startSession(a.id)}
              onStop={() => stopSession(active?.id)}
              onTogglePin={() => togglePin(a.id, !a.pinned)}
            />
          );
        })}
      </div>
    </div>
  );
}