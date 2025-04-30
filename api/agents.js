const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// GET - Liste des agents
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('agents').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST - Ajouter un agent
router.post('/', async (req, res) => {
  const { name, badge } = req.body;
  const { data, error } = await supabase.from('agents').insert([{ name, badge }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// DELETE - Supprimer un agent
router.delete('/', async (req, res) => {
  const { id } = req.query;
  const { error } = await supabase.from('agents').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
