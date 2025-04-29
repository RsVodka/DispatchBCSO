const db = require('../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    db.all(`
      SELECT patrols.id, patrols.unit_type, patrols.status, vehicles.model as vehicle_model, vehicles.plate as vehicle_plate, agents.id as agent_id, agents.name, agents.badge
      FROM patrols
      LEFT JOIN patrol_agents ON patrols.id = patrol_agents.patrol_id
      LEFT JOIN agents ON patrol_agents.agent_id = agents.id
      LEFT JOIN vehicles ON patrols.vehicle_id = vehicles.id
    `, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const patrols = {};
      rows.forEach(row => {
        if (!patrols[row.id]) {
          patrols[row.id] = {
            unit_type: row.unit_type,
            status: row.status,
            vehicle_model: row.vehicle_model,
            vehicle_plate: row.vehicle_plate,
            agents: []
          };
        }
        if (row.agent_id) {
          patrols[row.id].agents.push({
            id: row.agent_id,
            name: row.name,
            badge: row.badge
          });
        }
      });

      res.json(patrols);
    });
  }

  else if (req.method === 'POST') {
    const { unit_type, agentIds, vehicleId } = req.body;
    db.run("INSERT INTO patrols (unit_type, status, vehicle_id) VALUES (?, ?, ?)", [unit_type, 'Disponible', vehicleId], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const patrolId = this.lastID;
      const stmt = db.prepare("INSERT INTO patrol_agents (patrol_id, agent_id) VALUES (?, ?)");
      (agentIds || []).forEach(id => stmt.run(patrolId, id));
      stmt.finalize();

      res.json({ id: patrolId });
    });
  }

  else if (req.method === 'DELETE') {
    const id = req.query.id;
    db.run("DELETE FROM patrols WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run("DELETE FROM patrol_agents WHERE patrol_id = ?", [id]);
      res.json({ deleted: this.changes });
    });
  }

  else {
    res.status(405).end();
  }
}
