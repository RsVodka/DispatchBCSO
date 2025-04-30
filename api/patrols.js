const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');


// 🔻 Supprimer un agent d'une patrouille
router.delete('/remove-agent', async (req, res) => {
  const { patrolId, agentId } = req.query;

  const { error } = await supabase.from('patrol_agents').delete().match({
    patrol_id: patrolId,
    agent_id: agentId
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// 🔻 Supprimer une patrouille complètement
router.delete('/', async (req, res) => {
  const { id } = req.query;

  await supabase.from('patrol_agents').delete().eq('patrol_id', id);
  const { error } = await supabase.from('patrols').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 🔻 Lister toutes les patrouilles
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('patrols')
    .select(`
      id, unit_type, status,
      vehicles (model, plate),
      patrol_agents (
        agents (id, name, badge)
      )
    `);

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
});

// 🔄 Mettre à jour une patrouille (status, sector, etc.)
router.put('/', async (req, res) => {
  const { id, updates } = req.body;

  const { error } = await supabase
    .from('patrols')
    .update(updates)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 🔻 Créer une nouvelle patrouille
router.post('/', async (req, res) => {
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
});

module.exports = router;
