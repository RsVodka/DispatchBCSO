// ✅ agents.js + vehicles.js + patrols.js unifié - version Vercel-compatible
import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  const { route } = req.query;

  // 🔹 Liste des agents
  if route === 'agents' && req.method === 'GET') {
    const { data, error } = await supabase.from('agents').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // 🔹 Ajouter un agent
  if route === 'agents' && req.method === 'POST') {
    const { name, badge } = req.body;
    if (!name || !badge) return res.status(400).json({ error: 'Nom et matricule requis.' });

    const { data: existing } = await supabase.from('agents').select().eq('badge', badge);
    if (existing?.length > 0) return res.status(400).json({ error: 'Matricule déjà existant.' });

    const { data, error } = await supabase.from('agents').insert([{ name, badge }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data[0]);
  }

  // 🔹 Supprimer un agent
  if route === 'agents' && req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, id });
  }

  // 🔹 Liste des véhicules
  if route === 'vehicles' && req.method === 'GET') {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // 🔹 Ajouter un véhicule
  if route === 'vehicles' && req.method === 'POST') {
    const { model, plate } = req.body;
    if (!model || !plate) return res.status(400).json({ error: 'Modèle et plaque requis.' });

    const { data, error } = await supabase.from('vehicles').insert([{ model, plate }]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data[0]);
  }

  // 🔹 Supprimer un véhicule
  if route === 'vehicles') && req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  // 🔹 Supprimer un agent d'une patrouille
  if route === 'remove-agent' && req.method === 'DELETE') {
    const { patrolId, agentId } = req.query;
    const { error } = await supabase.from('patrol_agents').delete().match({
      patrol_id: patrolId,
      agent_id: agentId
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  // 🔹 Créer une patrouille
  if route === 'patrols' && req.method === 'POST') {
    const { unit_type, agentIds, vehicleId } = req.body;

    const { data: patrolInsert, error: patrolErr } = await supabase
      .from('patrols')
      .insert([{ unit_type, status: 'Disponible', vehicle_id: vehicleId }])
      .select();

    if (patrolErr || !patrolInsert?.[0]) return res.status(500).json({ error: patrolErr?.message || 'Erreur création patrouille' });

    const patrolId = patrolInsert[0].id;
    const inserts = agentIds.map(agentId => ({ patrol_id: patrolId, agent_id: agentId }));
    const { error: linkErr } = await supabase.from('patrol_agents').insert(inserts);

    if (linkErr) return res.status(500).json({ error: linkErr.message });
    return res.json({ id: patrolId });
  }

  // 🔹 Lister les patrouilles
  if route === 'patrols' && req.method === 'GET') {
    const { data: patrols, error: patrolErr } = await supabase.from('patrols').select('*');
    if (patrolErr) return res.status(500).json({ error: patrolErr.message });

    const results = [];

    for (const patrol of patrols) {
      const { data: links } = await supabase.from('patrol_agents').select('agent_id').eq('patrol_id', patrol.id);

      const agents = [];
      for (const link of links || []) {
        const { data: agent } = await supabase.from('agents').select('id, name, badge').eq('id', link.agent_id).single();
        if (agent) agents.push(agent);
      }

      const { data: vehicle } = await supabase.from('vehicles').select('model, plate').eq('id', patrol.vehicle_id).single();

      results.push({
        id: patrol.id,
        unit_type: patrol.unit_type,
        status: patrol.status,
        sector: patrol.sector,
        vehicle_model: vehicle?.model || '',
        vehicle_plate: vehicle?.plate || '',
        agents
      });
    }

    return res.json(results);
  }

  // 🔹 Supprimer une patrouille
  if route === 'patrols' && req.method === 'DELETE') {
    const { id } = req.query;
    await supabase.from('patrol_agents').delete().eq('patrol_id', id);
    const { error } = await supabase.from('patrols').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
