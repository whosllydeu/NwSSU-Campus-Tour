import { supabase } from '../../lib/supabaseClient.js';

const TABLE = 'organizations';

function fromDb(row) {
  if (!row) return row;
  const { college_abbr, ...rest } = row;
  return { ...rest, college: college_abbr, _id: row.id };
}

function toDb(data) {
  const { college, _id, ...rest } = data;
  return { ...rest, ...(college !== undefined ? { college_abbr: college } : {}) };
}

export async function listOrganizations() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createOrganization(data) {
  const { data: row, error } = await supabase.from(TABLE).insert(toDb(data)).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateOrganization(id, data) {
  const { data: rows, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select();
  if (error) throw error;
  // RLS blocks a write by silently matching 0 rows, not by returning an
  // error — an empty result here means the update didn't actually happen
  // (usually: not signed in as an admin, or the session expired).
  if (!rows || rows.length === 0) {
    throw new Error('Update was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return fromDb(rows[0]);
}

export async function deleteOrganization(id) {
  const { data: rows, error } = await supabase.from(TABLE).delete().eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Delete was blocked — you may not be signed in as an admin, or your session expired.');
  }
}
