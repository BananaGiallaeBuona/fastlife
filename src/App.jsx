import { useEffect, useState } from 'react';
import AddActivity from './components/AddActivity';
import ActivityCard from './components/ActivityCard';
import { supabase } from './supabaseClient';

function App() {
    const [activities, setActivities] = useState([]);

    const fetchActivities = async () => {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('id', { ascending: true });
        if (error) {
            console.error("Errore nel fetch delle attività:", error);
        } else {
            setActivities(data);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleAdd = async (activity) => {
        const { data, error } = await supabase
            .from('activities')
            .insert([activity])
            .select();
        if (error) {
            console.error("Errore nell'inserimento dell'attività:", error);
        } else {
            setActivities([...activities, ...data]);
        }
    };

    const handleDelete = async (id) => {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);
        if (error) {
            console.error("Errore nell'eliminazione dell'attività:", error);
        } else {
            setActivities(activities.filter((a) => a.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h1 className="text-4xl font-bold text-center mb-4">FastLife 🚀</h1>
            <AddActivity onAdd={handleAdd} />
            <div className="mt-6 space-y-4">
                {activities.map((activity) => (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onDelete={() => handleDelete(activity.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;