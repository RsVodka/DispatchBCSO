console.log("✅ API dispatch.js appelée — route:", req.query.route);

import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  const { route } = req.query;

  try {
    // 🔹 Liste des agents
    if (route === 'agents' && req.method === 'GET') {
      const { data, error } = await supabase.from('agents').select('*');
      if (error) throw new Error(error.message);
      return res.json(data);
    }

    // 🔹 Ajouter un agent
    if (route === 'agents' && req.method === 'POST') {
      const { name, badge } = req.body;
      if (!name || !badge) return res.status(400).json({ error: 'Nom et matricule requis.' });

      const { data: existing } = await supabase.from('agents').select().eq('badge', badge);
      if (existing?.length > 0) return res.status(400).json({ error: 'Matricule déjà existant.' });

      const { data, error } = await supabase.from('agents').insert([{ name, badge }]).select();
      if (error) throw new Error(error.message);
      return res.json(data[0]);
    }

    // 🔹 Supprimer un agent
    if (route === 'agents' && req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return res.json({ success: true });
    }

    // 🔹 Liste des véhicules
    if (route === 'vehicles' && req.method === 'GET') {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw new Error(error.message);
      return res.json(data);
    }

    // 🔹 Ajouter un véhicule
    if (route === 'vehicles' && req.method === 'POST') {
      const { model, plate } = req.body;
      if (!model || !plate) return res.status(400).json({ error: 'Modèle et plaque requis.' });

      const { data, error } = await supabase.from('vehicles').insert([{ model, plate }]).select();
      if (error) throw new Error(error.message);
      return res.json(data[0]);
    }

    // 🔹 Supprimer un véhicule
    if (route === 'vehicles' && req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return res.json({ success: true });
    }

    // 🔹 Supprimer un agent d'une patrouille
    if (route === 'remove-agent' && req.method === 'DELETE') {
      const { patrolId, agentId } = req.query;
      const { error } = await supabase.from('patrol_agents').delete().match({
        patrol_id: patrolId,
        agent_id: agentId
      });
      if (error) throw new Error(error.message);
      return res.json({ success: true });
    }

    // 🔹 Créer une patrouille
    if (route === 'patrols' && req.method === 'POST') {
      const { unit_type, agentIds, vehicleId } = req.body;

      const { data: patrolInsert, error: patrolErr } = await supabase
        .from('patrols')
        .insert([{ unit_type, status: 'Disponible', vehicle_id: vehicleId }])
        .select();

      if (patrolErr || !patrolInsert?.[0]) throw new Error(patrolErr?.message || 'Erreur création patrouille');

      const patrolId = patrolInsert[0].id;
      const inserts = agentIds.map(agentId => ({ patrol_id: patrolId, agent_id: agentId }));
      const { error: linkErr } = await supabase.from('patrol_agents').insert(inserts);

      if (linkErr) throw new Error(linkErr.message);
      return res.json({ id: patrolId });
    }

    // 🔹 Lister les patrouilles (avec protections robustes)
    if (route === 'patrols' && req.method === 'GET') {
      console.log('🔍 Route /patrols appelée');

      const { data: patrols, error: patrolErr } = await supabase.from('patrols').select('*');
      if (patrolErr) throw new Error(patrolErr.message);

      const results = [];

      for (const patrol of patrols) {
        const { data: links, error: linkErr } = await supabase
          .from('patrol_agents')
          .select('agent_id')
          .eq('patrol_id', patrol.id);

        if (linkErr) {
          console.error('Erreur liens agents:', linkErr.message);
          continue;
        }

        const agents = [];
        for (const link of links || []) {
          const { data: agent, error: agentErr } = await supabase
            .from('agents')
            .select('id, name, badge')
            .eq('id', link.agent_id)
            .single();

          if (agentErr) {
            console.warn(`Agent introuvable id=${link.agent_id}`);
            continue;
          }

          if (agent) agents.push(agent);
        }

        let vehicle_model = '';
        let vehicle_plate = '';

        if (patrol.vehicle_id) {
          const { data: vehicle, error: vehicleErr } = await supabase
            .from('vehicles')
            .select('model, plate')
            .eq('id', patrol.vehicle_id)
            .single();

          if (vehicleErr) {
            console.warn(`Véhicule introuvable id=${patrol.vehicle_id}`);
          } else if (vehicle) {
            vehicle_model = vehicle.model;
            vehicle_plate = vehicle.plate;
          }
        }

        results.push({
          id: patrol.id,
          unit_type: patrol.unit_type,
          status: patrol.status,
          sector: patrol.sector,
          vehicle_model,
          vehicle_plate,
          agents
        });
      }

      console.log("✅ Résultats reconstruits :", results);
      return res.json(results);
    }

    // 🔹 Supprimer une patrouille
    if (route === 'patrols' && req.method === 'DELETE') {
      const { id } = req.query;
      await supabase.from('patrol_agents').delete().eq('patrol_id', id);
      const { error } = await supabase.from('patrols').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error("🔥 ERREUR FATALE route:", route, err);
    return res.status(500).json({ error: err.message || 'Erreur interne serveur' });
  }
}
