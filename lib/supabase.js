import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxmchfiugxxgcejxmohr.supabase.co'; // ⇦ à remplacer
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWNoZml1Z3h4Z2Nlanhtb2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDczMzgsImV4cCI6MjA2MTUyMzMzOH0.J90kmL65e-gJIyOTtd3tIB9q_vxqoFLR80lDqY-l3Mw'; // ⇦ à remplacer

export const supabase = createClient(supabaseUrl, supabaseKey);
