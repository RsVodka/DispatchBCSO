import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patrolId, agentId } = req.query;

  const { error } = await supabase.from('patrol_agents').delete().match({
    patrol_id: patrolId,
    agent_id: agentId
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
}
