import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }

  else if (req.method === 'POST') {
    const { model, plate } = req.body;
    const { data, error } = await supabase.from('vehicles').insert([{ model, plate }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  }

  else if (req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  }

  else {
    res.status(405).end();
  }
}
