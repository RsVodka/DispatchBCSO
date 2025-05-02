import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://bxmchfiugxxgcejxmohr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // ta clé publique
);
