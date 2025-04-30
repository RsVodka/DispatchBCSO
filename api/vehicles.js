const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// GET tous les véhicules
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST nouveau véhicule
router.post('/', async (req, res) => {
  const { model, plate } = req.body;
  if (!model || !plate) {
    return res.status(400).json({ error: "Modèle et plaque requis." });
  }

  const { data, error } = await supabase.from('vehicles').insert([{ model, plate }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// DELETE un véhicule
router.delete('/', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "ID requis pour suppression." });
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
