import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

function ActivityCard({ activity, onDelete }) {
    // Stato per gestione timer locale (in minuti) e sessione corrente
    const [isRunning, setIsRunning] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [weeklyTime, setWeeklyTime] = useState(0);
    const intervalRef = useRef(null);

    // Funzione per ricalcolare il tempo settimanale speso per questa attività
    const fetchWeeklyTime = async () => {
        // Calcola il lunedì corrente (inizio settimana)
        const now = new Date();
        const currentDay = now.getDay(); // Domenica=0, Lunedì=1, ecc.
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // se Domenica, torna al lunedì precedente
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const isoMonday = monday.toISOString();

        const { data, error } = await supabase
            .from('activity_session')
            .select('duration')
            .eq('activity_id', activity.id)
            .gte('start_time', isoMonday);
        if (error) {
            console.error("Errore nel fetch delle sessioni:", error);
            return;
        }
        const total = data.reduce((acc, session) => acc + (session.duration || 0), 0);
        setWeeklyTime(total);
    };

    // Sottoscrizione Realtime per questa attività
    useEffect(() => {
        const channel = supabase
            .channel(`realtime:activity_session:${activity.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activity_session',
                    filter: `activity_id=eq.${activity.id}`,
                },
                (payload) => {
                    console.log("Realtime update per activity", activity.id, ":", payload);
                    fetchWeeklyTime();
                }
            )
            .subscribe();

        // Carica il tempo settimanale al montaggio del componente
        fetchWeeklyTime();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activity.id]);

    // Funzione per iniziare una sessione ("Start")
    const handleStart = async () => {
        const { data, error } = await supabase
            .from('activity_session')
            .insert([{ activity_id: activity.id, start_time: new Date().toISOString() }])
            .select();
        if (error) {
            console.error("Errore all'avvio della sessione:", error);
            return;
        }
        setCurrentSessionId(data[0].id);
        setIsRunning(true);
        // (Opzionale) Puoi impostare un intervallo locale se vuoi mostrare il tempo in tempo reale
        intervalRef.current = setInterval(() => {
            // Questo intervallo è solo per l'aggiornamento visivo locale (se desiderato)
            // Se la sincronizzazione è in realtime, potresti non averne bisogno
        }, 60000);
    };

    // Funzione per fermare la sessione ("Stop")
    const handleStop = async () => {
        if (!currentSessionId) return;
        const stopTime = new Date();
        const { data: sessionData, error: fetchError } = await supabase
            .from('activity_session')
            .select('start_time')
            .eq('id', currentSessionId)
            .single();
        if (fetchError) {
            console.error("Errore nel recuperare la sessione:", fetchError);
            return;
        }
        const startTime = new Date(sessionData.start_time);
        const minutesElapsed = Math.floor((stopTime - startTime) / 60000);

        const { error: updateError } = await supabase
            .from('activity_session')
            .update({
                end_time: stopTime.toISOString(),
                duration: minutesElapsed,
            })
            .eq('id', currentSessionId);
        if (updateError) {
            console.error("Errore nel fermare la sessione:", updateError);
        } else {
            setIsRunning(false);
            setCurrentSessionId(null);
            clearInterval(intervalRef.current);
            fetchWeeklyTime();
        }
    };

    const ore = Math.floor(weeklyTime / 60);
    const minuti = weeklyTime % 60;

    return (
        <div className="bg-white p-4 rounded shadow-md my-2">
            <h2 className="text-xl font-bold">{activity.name}</h2>
            <p className="text-sm">
                Tempo settimanale speso: {ore}h {minuti}min
            </p>
            <div className="mt-2 flex gap-2">
                {!isRunning ? (
                    <button onClick={handleStart} className="bg-green-500 text-white px-3 py-1 rounded">
                        Start
                    </button>
                ) : (
                    <button onClick={handleStop} className="bg-red-500 text-white px-3 py-1 rounded">
                        Stop
                    </button>
                )}
                <button onClick={onDelete} className="bg-red-600 text-white px-3 py-1 rounded">
                    Elimina
                </button>
            </div>
        </div>
    );
}

export default ActivityCard;