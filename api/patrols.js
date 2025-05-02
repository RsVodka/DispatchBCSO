import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  const url = req.url;

  // 🔻 Supprimer un agent d'une patrouille
  if (req.method === 'DELETE' && url.includes('/remove-agent')) {
    const { patrolId, agentId } = req.query;

    const { error } = await supabase.from('patrol_agents').delete().match({
      patrol_id: patrolId,
      agent_id: agentId
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  // 🔻 Supprimer une patrouille complètement
  else if (req.method === 'DELETE') {
    const { id } = req.query;

    await supabase.from('patrol_agents').delete().eq('patrol_id', id);
    const { error } = await supabase.from('patrols').delete().eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  // ✅ 🔻 Lister toutes les patrouilles (corrigé ici)
  else if (req.method === 'GET') {
    const { data: patrols, error: patrolErr } = await supabase.from('patrols').select('*');
    if (patrolErr) return res.status(500).json({ error: patrolErr.message });

    const results = [];

    for (const patrol of patrols) {
      const { data: links } = await supabase
        .from('patrol_agents')
        .select('agent_id')
        .eq('patrol_id', patrol.id);

      const agents = [];
      for (const link of links || []) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name, badge')
          .eq('id', link.agent_id)
          .single();
        if (agent) agents.push(agent);
      }

      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('model, plate')
        .eq('id', patrol.vehicle_id)
        .single();

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

  // 🔻 Créer une nouvelle patrouille
  else if (req.method === 'POST') {
    const { unit_type, agentIds, vehicleId } = req.body;

    const { data: patrolInsert, error: patrolErr } = await supabase
      .from('patrols')
      .insert([{ unit_type, status: 'Disponible', vehicle_id: vehicleId }])
      .select();

    if (patrolErr) return res.status(500).json({ error: patrolErr.message });

    const patrolId = patrolInsert[0].id;
    const inserts = agentIds.map(agentId => ({ patrol_id: patrolId, agent_id: agentId }));

    const { error: linkErr } = await supabase.from('patrol_agents').insert(inserts);
    if (linkErr) return res.status(500).json({ error: linkErr.message });

    return res.json({ id: patrolId });
  }

  else {
    res.status(405).end();
  }
}
