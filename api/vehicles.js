let vehicles = [];
let nextId = 1;

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(vehicles);
  } else if (req.method === 'POST') {
    const { model, plate } = req.body;
    if (!model || !plate) return res.status(400).json({ message: "Champs requis" });

    const newVehicle = { id: nextId++, model, plate };
    vehicles.push(newVehicle);
    res.status(200).json(newVehicle);
  } else if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    vehicles = vehicles.filter(v => v.id !== id);
    res.status(200).json({ message: "Véhicule supprimé" });
  } else {
    res.status(405).json({ message: "Méthode non autorisée" });
  }
}
