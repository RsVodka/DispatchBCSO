const express = require('express');
const router = express.Router();
const { supabase } = require('../../supabaseClient');

// DELETE /api/patrols/remove-agent?patrolId=...&agentId=...
router.delete('/', async (req, res) => {
  const { patrolId, agentId } = req.query;

  const { error } = await supabase
    .from('patrol_agents')
    .delete()
    .match({ patrol_id: patrolId, agent_id: agentId });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
