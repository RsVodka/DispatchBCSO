const db = require('../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    db.all("SELECT * FROM agents", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  } else if (req.method === 'POST') {
    const { name, badge } = req.body;
    db.run("INSERT INTO agents (name, badge) VALUES (?, ?)", [name, badge], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  } else if (req.method === 'DELETE') {
    const id = req.query.id;
    db.run("DELETE FROM agents WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  } else {
    res.status(405).end();
  }
}
