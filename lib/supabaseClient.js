const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bxmchfiugxxgcejxmohr.supabase.co';
const supabaseKey = 'eyJhbGciOi...'; // ta clé ici
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
