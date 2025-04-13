import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnaazsvmodasxopueqtf.supabase.co';
console.log("Supabase URL:", supabaseUrl);  // Aggiungi questa riga per verificare

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYWF6c3Ztb2Rhc3hvcHVlcXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDQzNjMsImV4cCI6MjA1OTcyMDM2M30.7evkxaIi42uDyrc33TskGG_NjJmfCtzy1I5egreQ5qs';

export const supabase = createClient(supabaseUrl, supabaseKey);