  if (req.method === 'DELETE' && req.url.includes('/remove-agent')) {
    const { patrolId, agentId } = req.query;
    const { error } = await supabase.from('patrol_agents').delete().match({
      patrol_id: patrolId,
      agent_id: agentId
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
