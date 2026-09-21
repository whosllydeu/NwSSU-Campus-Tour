import { supabase } from '../../lib/supabaseClient.js';

export async function listActivity(limit = 50) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    ts: row.created_at,
    action: row.action,
    entity: row.entity,
    label: row.record_label,
  }));
}
