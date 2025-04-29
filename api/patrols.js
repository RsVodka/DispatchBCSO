import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('patrols')
      .select(`
        id, unit_type, status,
        vehicles (model, plate),
        patrol_agents (
          agents (id, name, badge)
        )
      `)
      .returns();

    if (error) return res.status(500).json({ error: error.message });

    const patrols = {};
    data.forEach(p => {
      patrols[p.id] = {
        unit_type: p.unit_type,
        status: p.status,
        vehicle_model: p.vehicles?.model || '',
        vehicle_plate: p.vehicles?.plate || '',
        agents: (p.patrol_agents || []).map(pa => pa.agents)
      };
    });

    res.json(patrols);
  }

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

    res.json({ id: patrolId });
  }

  else if (req.method === 'DELETE') {
    const { id } = req.query;
    await supabase.from('patrol_agents').delete().eq('patrol_id', id);
    const { error } = await supabase.from('patrols').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  }

  else {
    res.status(405).end();
  }
}
