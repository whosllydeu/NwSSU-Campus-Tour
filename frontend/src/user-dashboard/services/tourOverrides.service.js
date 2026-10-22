import { supabase } from '../../lib/supabaseClient';

const TABLE = 'tour_overrides';
const COLS = 'node_id, yaw, links, labels';
const COLS_OLD = 'node_id, yaw, links';

// false until tour_overrides_labels.sql has been run in Supabase
let labelsColumn = true;
export const labelsSupported = () => labelsColumn;

const isMissingLabels = (error) => /labels/i.test(error?.message || '') && /column/i.test(error?.message || '');

const cleanLabels = (labels) =>
  Array.isArray(labels)
    ? labels
      .filter((l) => l && String(l.name || '').trim() && Number.isFinite(Number(l.yaw)))
      .map((l) => ({
        name: String(l.name).trim(),
        text: String(l.text || '').trim(),
        yaw: Math.round(Number(l.yaw) * 10) / 10,
      }))
    : [];

const clean = (row) => ({
  nodeId: row.node_id,
  yaw: Number.isFinite(Number(row.yaw)) && row.yaw !== null ? Number(row.yaw) : null,
  links: Array.isArray(row.links)
    ? row.links
      .filter((l) => l && l.to && Number.isFinite(Number(l.yaw)))
      .map((l) => ({ to: String(l.to), yaw: Number(l.yaw) }))
    : [],
  labels: cleanLabels(row.labels),
});

export async function listTourOverrides() {
  let { data, error } = await supabase.from(TABLE).select(COLS);
  if (error && isMissingLabels(error)) {
    labelsColumn = false;
    ({ data, error } = await supabase.from(TABLE).select(COLS_OLD));
  }
  if (error) throw error;
  return (data || []).map(clean);
}

export async function saveTourOverride(nodeId, { yaw, links, labels }) {
  const row = {
    node_id: nodeId,
    yaw: Number.isFinite(Number(yaw)) && yaw !== '' && yaw !== null ? Number(yaw) : null,
    links: (links || [])
      .filter((l) => l.to && Number.isFinite(Number(l.yaw)))
      .map((l) => ({ to: String(l.to), yaw: Math.round(Number(l.yaw) * 10) / 10 })),
    updated_at: new Date().toISOString(),
  };
  if (labelsColumn) row.labels = cleanLabels(labels);
  const { data, error } = await supabase.from(TABLE).upsert(row).select(labelsColumn ? COLS : COLS_OLD);
  if (error) {
    if (isMissingLabels(error)) {
      labelsColumn = false;
      throw new Error('Labels are not set up yet — run tour_overrides_labels.sql in Supabase, then try again.');
    }
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error('Save was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return clean(data[0]);
}

export async function deleteTourOverride(nodeId) {
  const { error } = await supabase.from(TABLE).delete().eq('node_id', nodeId);
  if (error) throw error;
}