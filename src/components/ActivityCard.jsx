import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

function ActivityCard({ activity }) {
    // Stato per indicare se il timer è in esecuzione e per memorizzare l'id della sessione corrente
    const [isRunning, setIsRunning] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    // Stato per memorizzare il totale settimanale (in minuti) dell'attività
    const [weeklyTime, setWeeklyTime] = useState(0);
    // Stato per il timer locale (usato per aggiornare l'interfaccia, se desiderato)
    const intervalRef = useRef(null);

    // Funzione per calcolare il tempo settimanale speso (somma delle durate)
    const fetchWeeklyTime = async () => {
        // Calcola il primo giorno della settimana corrente (supponiamo che la settimana inizi il lunedì)
        const now = new Date();
        const currentDay = now.getDay(); // Domenica=0, Lunedì=1, ...
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // se domenica, torna al lunedì precedente
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const isoMonday = monday.toISOString();

        // Recupera le sessioni per questa attività che hanno start_time dalla mezzanotte del lunedì corrente
        const { data, error } = await supabase
            .from('activity_sessions')
            .select('duration')
            .eq('activity_id', activity.id)
            .gte('start_time', isoMonday);

        if (error) {
            console.error("Errore nel fetch delle sessioni settimanali:", error);
            return;
        }

        // Somma tutte le durate (duration)
        const totalMinutes = data.reduce((acc, session) => acc + (session.duration || 0), 0);
        setWeeklyTime(totalMinutes);
    };

    // Carica il tempo settimanale quando il componente viene montato
    useEffect(() => {
        fetchWeeklyTime();
    }, [activity.id]);

    // Funzione per creare una nuova sessione ("Start")
    const handleStart = async () => {
        // Inserisci una nuova riga nella tabella activity_sessions
        const { data, error } = await supabase
            .from('activity_sessions')
            .insert([
                {
                    activity_id: activity.id,
                    start_time: new Date().toISOString(),
                },
            ])
            .select();
        if (error) {
            console.error("Errore all'avvio della sessione:", error);
            return;
        }
        // Imposta l'id della sessione corrente e segnala che il timer è in esecuzione
        setCurrentSessionId(data[0].id);
        setIsRunning(true);
        // (Facoltativo) Se vuoi aggiornare l'interfaccia ogni minuto, puoi avviare un intervallo locale
        intervalRef.current = setInterval(() => {
            // Puoi eventualmente aggiornare qualche stato locale per mostrare il tempo corrente in tempo reale
        }, 60000);
    };

    // Funzione per fermare la sessione ("Stop")
    const handleStop = async () => {
        if (!currentSessionId) return;
        const stopTime = new Date();
        // Recupera la sessione per calcolare la durata trascorsa
        const { data: sessionData, error: fetchError } = await supabase
            .from('activity_sessions')
            .select('start_time')
            .eq('id', currentSessionId)
            .single();
        if (fetchError) {
            console.error("Errore nel recuperare la sessione:", fetchError);
            return;
        }
        const startTime = new Date(sessionData.start_time);
        const minutesElapsed = Math.floor((stopTime - startTime) / 60000);

        // Aggiorna la sessione con il campo end_time e la durata
        const { error: updateError } = await supabase
            .from('activity_sessions')
            .update({
                end_time: stopTime.toISOString(),
                duration: minutesElapsed,
            })
            .eq('id', currentSessionId);
        if (updateError) {
            console.error("Errore nello stop della sessione:", updateError);
        } else {
            setIsRunning(false);
            setCurrentSessionId(null);
            clearInterval(intervalRef.current);
            // Aggiorna il tempo settimanale ricalcolando le sessioni
            fetchWeeklyTime();
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow-md my-2">
            <h2 className="text-xl font-bold">{activity.name}</h2>
            <p className="text-sm">
                Tempo settimanale speso: {Math.floor(weeklyTime / 60)}h {weeklyTime % 60}min
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
            </div>
        </div>
    );
}

export default ActivityCard;