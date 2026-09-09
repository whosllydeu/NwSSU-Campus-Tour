import { supabase } from '../lib/supabaseClient.js';

let cache = null;

export async function listWaypoints() {
  if (cache) return cache;
  const { data, error } = await supabase.from('ar_waypoints').select('*');
  if (error) throw error;
  cache = data;
  return data;
}

// Mirrors the old arDestinations.js resolveCoord() shape: { lat, lng, name } | null
export async function resolveCoord(key) {
  const rows = await listWaypoints();
  const row = rows.find((r) => r.destination_key === key);
  if (!row || row.lat == null || row.lng == null) return null;
  return { lat: row.lat, lng: row.lng, name: row.display_name };
}

export function hasARSync(key, rows) {
  const row = rows.find((r) => r.destination_key === key);
  return Boolean(row && row.lat != null && row.lng != null);
}