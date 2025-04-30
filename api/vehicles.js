const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// 🔻 Obtenir tous les véhicules
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔻 Ajouter un véhicule
router.post('/', async (req, res) => {
  const { model, plate } = req.body;
  const { data, error } = await supabase.from('vehicles').insert([{ model, plate }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 🔻 Supprimer un véhicule
router.delete('/', async (req, res) => {
  const { id } = req.query;
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
