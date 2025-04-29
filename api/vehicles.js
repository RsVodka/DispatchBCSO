const db = require('../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    db.all("SELECT * FROM vehicles", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  } else if (req.method === 'POST') {
    const { model, plate } = req.body;
    db.run("INSERT INTO vehicles (model, plate) VALUES (?, ?)", [model, plate], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  } else if (req.method === 'DELETE') {
    const id = req.query.id;
    db.run("DELETE FROM vehicles WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } else {
    res.status(405).end();
  }
}
