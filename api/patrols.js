let patrols = {};
let nextId = 1;

let agents = [];
let vehicles = [];

// Astuce : Vercel n'exécute pas tout dans un même scope, donc tu peux injecter ces dépendances ici si besoin,
// ou bien rendre le fichier autonome si agents/vehicles sont dans une vraie BDD (non ici).

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(patrols);
  } else if (req.method === 'POST') {
    const { unit_type, agentIds, vehicleId } = req.body;
    if (!agentIds || !Array.isArray(agentIds) || !vehicleId)
      return res.status(400).json({ message: "Champs manquants" });

    // agents et véhicules simulés en dur pour éviter les dépendances croisées
    const fakeAgent = id => ({ id, name: `Nom-${id}`, badge: `B${id}` });
    const fakeVehicle = { model: `Modèle-${vehicleId}`, plate: `Plate-${vehicleId}` };

    const patrol = {
      id: nextId,
      unit_type,
      agents: agentIds.map(fakeAgent),
      vehicle_model: fakeVehicle.model,
      vehicle_plate: fakeVehicle.plate,
    };

    patrols[nextId] = patrol;
    nextId++;
    res.status(200).json(patrol);
  } else if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    delete patrols[id];
    res.status(200).json({ message: 'Patrouille supprimée' });
  } else {
    res.status(405).json({ message: 'Méthode non autorisée' });
  }
}
