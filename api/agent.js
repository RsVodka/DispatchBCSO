let agents = [];
let nextId = 1;

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(agents);
  } else if (req.method === 'POST') {
    const { name, badge } = req.body;
    if (!name || !badge) return res.status(400).json({ message: "Champs requis" });

    const newAgent = { id: nextId++, name, badge };
    agents.push(newAgent);
    res.status(200).json(newAgent);
  } else if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    agents = agents.filter(a => a.id !== id);
    res.status(200).json({ message: "Agent supprimé" });
  } else {
    res.status(405).json({ message: "Méthode non autorisée" });
  }
}
