import { supabase } from '../../lib/supabaseClient';

const TABLE = 'tour_overrides';

const clean = (row) => ({
  nodeId: row.node_id,
  yaw: Number.isFinite(Number(row.yaw)) && row.yaw !== null ? Number(row.yaw) : null,
  links: Array.isArray(row.links)
    ? row.links
      .filter((l) => l && l.to && Number.isFinite(Number(l.yaw)))
      .map((l) => ({ to: String(l.to), yaw: Number(l.yaw) }))
    : [],
});

export async function listTourOverrides() {
  const { data, error } = await supabase.from(TABLE).select('node_id, yaw, links');
  if (error) throw error;
  return (data || []).map(clean);
}

export async function saveTourOverride(nodeId, { yaw, links }) {
  const row = {
    node_id: nodeId,
    yaw: Number.isFinite(Number(yaw)) && yaw !== '' && yaw !== null ? Number(yaw) : null,
    links: (links || [])
      .filter((l) => l.to && Number.isFinite(Number(l.yaw)))
      .map((l) => ({ to: String(l.to), yaw: Math.round(Number(l.yaw) * 10) / 10 })),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).upsert(row).select('node_id, yaw, links');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Save was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return clean(data[0]);
}

export async function deleteTourOverride(nodeId) {
  const { error } = await supabase.from(TABLE).delete().eq('node_id', nodeId);
  if (error) throw error;
}