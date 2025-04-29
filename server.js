// Serveur Dispatch BCSO
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./dispatch.db');

// Création des tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        badge TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT,
        plate TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS patrols (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_type TEXT,
        status TEXT,
        vehicle_id INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS patrol_agents (
        patrol_id INTEGER,
        agent_id INTEGER
    )`);
});

// ROUTES API

// Agents
app.get('/api/agents', (req, res) => {
    db.all("SELECT * FROM agents", (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

app.post('/api/agents', (req, res) => {
    const { name, badge } = req.body;
    db.run(`INSERT INTO agents (name, badge) VALUES (?, ?)`, [name, badge], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
});

app.delete('/api/agents/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM agents WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

// Vehicles
app.get('/api/vehicles', (req, res) => {
    db.all("SELECT * FROM vehicles", (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

app.post('/api/vehicles', (req, res) => {
    const { model, plate } = req.body;
    db.run(`INSERT INTO vehicles (model, plate) VALUES (?, ?)`, [model, plate], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
});

app.delete('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM vehicles WHERE id = ?', [id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Patrols
app.get('/api/patrols', (req, res) => {
    db.all(`
        SELECT patrols.id, patrols.unit_type, patrols.status, vehicles.model as vehicle_model, vehicles.plate as vehicle_plate, agents.id as agent_id, agents.name, agents.badge
        FROM patrols
        LEFT JOIN patrol_agents ON patrols.id = patrol_agents.patrol_id
        LEFT JOIN agents ON patrol_agents.agent_id = agents.id
        LEFT JOIN vehicles ON patrols.vehicle_id = vehicles.id
    `, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (!rows) {
            res.json({});
            return;
        }

        let patrols = {};
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
});

app.post('/api/patrols', (req, res) => {
    const { unit_type, agentIds, vehicleId } = req.body;
    db.run(`INSERT INTO patrols (unit_type, status, vehicle_id) VALUES (?, ?, ?)`,
        [unit_type, 'Disponible', vehicleId],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            const patrolId = this.lastID;
            const stmt = db.prepare(`INSERT INTO patrol_agents (patrol_id, agent_id) VALUES (?, ?)`);
            (agentIds || []).forEach(agentId => {
                stmt.run(patrolId, agentId);
            });
            stmt.finalize();
            res.json({ id: patrolId });
        }
    );
});

app.patch('/api/patrols/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run(`UPDATE patrols SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ updated: this.changes });
    });
});

app.delete('/api/patrols/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM patrols WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        db.run(`DELETE FROM patrol_agents WHERE patrol_id = ?`, [id]);
        res.json({ deleted: this.changes });
    });
});

app.delete('/api/patrols/:patrolId/agents/:agentId', (req, res) => {
    const { patrolId, agentId } = req.params;
    db.run(`DELETE FROM patrol_agents WHERE patrol_id = ? AND agent_id = ?`, [patrolId, agentId], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        db.get('SELECT COUNT(*) as count FROM patrol_agents WHERE patrol_id = ?', [patrolId], (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }
            const remaining = row.count;
            if (remaining === 0) {
                db.run('DELETE FROM patrols WHERE id = ?', [patrolId]);
            } else {
                let newType = 'Tango';
                if (remaining === 1) newType = 'Lincoln';
                if (remaining === 2) newType = 'Adam';
                db.run('UPDATE patrols SET unit_type = ? WHERE id = ?', [newType, patrolId]);
            }
            res.json({ success: true });
        });
    });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`✅ Serveur Dispatch BCSO lancé sur http://localhost:${port}`);
});
