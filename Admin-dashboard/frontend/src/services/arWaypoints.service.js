import { supabase } from '../lib/supabaseClient.js';

const TABLE = 'ar_waypoints';

function fromDb(row) {
  return row ? { ...row, _id: row.id } : row;
}

export async function listWaypoints() {
  const { data, error } = await supabase.from(TABLE).select('*').order('display_name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function updateWaypoint(id, data) {
  const { _id, id: _ignored, destination_key, ...rest } = data;
  const { data: rows, error } = await supabase.from(TABLE).update(rest).eq('id', id).select();
  if (error) throw error;
  // Same RLS-silent-block pattern as the other admin services: a blocked
  // write returns 0 rows instead of an error.
  if (!rows || rows.length === 0) {
    throw new Error('Update was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return fromDb(rows[0]);
}

// For the rare case a waypoint row doesn't exist yet (e.g. a building
// created after the initial seed). destination_key must match the
// building/department id or office slug exactly for AR to find it.
export async function createWaypoint(data) {
  const { data: row, error } = await supabase.from(TABLE).insert(data).select().single();
  if (error) throw error;
  return fromDb(row);
}

// Resets coordinates without deleting the row — keeps the place listed
// (and still findable by AR) but marks it as "not measured yet" again.
export async function clearWaypoint(id) {
  return updateWaypoint(id, { lat: null, lng: null });
}
