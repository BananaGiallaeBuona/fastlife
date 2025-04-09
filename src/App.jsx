import { useEffect, useState } from 'react';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';
import { supabase } from './supabaseClient';

function App() {
    const [activities, setActivities] = useState([]);

    // 📥 Carica tutte le attività al primo avvio
    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        const { data, error } = await supabase.from('activities').select('*').order('id', { ascending: true });
        if (error) console.error(error);
        else setActivities(data);
    };

    // 📤 Aggiunge una nuova attività nel cloud
    const handleAdd = async (activity) => {
        console.log("Invio al cloud:", activity); // <--- DEBUG

        const { data, error } = await supabase
            .from('activities')
            .insert([{ ...activity }])
            .select();

        if (error) {
            console.error('Errore nell’inserimento:', error); // <--- DEBUG
        } else {
            console.log('Attività inserita:', data); // <--- DEBUG
            setActivities((prev) => [...prev, ...data]);
        }
    };


    // 🔄 Aggiorna il tempo speso (spentTime)
    const updateActivity = async (index, deltaMinutes) => {
        const updated = [...activities];
        updated[index].spentTime = Math.max(0, updated[index].spentTime + deltaMinutes);
        const id = updated[index].id;

        const { error } = await supabase
            .from('activities')
            .update({ spentTime: updated[index].spentTime })
            .eq('id', id);

        if (error) {
            console.error('Errore nell’aggiornamento:', error);
        } else {
            setActivities(updated);
        }
    };

    // 🗑️ Reset attività (tempo riportato a 0)
    const resetActivity = async (index) => {
        const updated = [...activities];
        updated[index].spentTime = 0;
        const id = updated[index].id;

        const { error } = await supabase
            .from('activities')
            .update({ spentTime: 0 })
            .eq('id', id);

        if (error) {
            console.error('Errore nel reset:', error);
        } else {
            setActivities(updated);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-4xl font-bold text-blue-600 mb-6">TempoTrack 🚀</h1>
            <AddActivity onAdd={handleAdd} />

            <div className="grid gap-4">
                {activities.map((a, index) => (
                    <ActivityCard
                        key={a.id}
                        index={index}
                        activity={a}
                        updateActivity={updateActivity}
                        resetActivity={resetActivity}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
