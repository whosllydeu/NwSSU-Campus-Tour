import { supabase } from '../lib/supabaseClient.js';
import { slugify } from '../lib/slugify.js';

const TABLE = 'departments';

function fromDb(row) {
  return row ? { ...row, _id: row.id } : row;
}

export async function listDepartments() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createDepartment(data) {
  const { _id, ...rest } = data;
  const id = rest.id || slugify(rest.name || rest.abbr || `dept-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...rest, id }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateDepartment(id, data) {
  const { _id, ...rest } = data;
  const { data: rows, error } = await supabase.from(TABLE).update(rest).eq('id', id).select();
  if (error) throw error;
  // RLS blocks a write by silently matching 0 rows, not by returning an
  // error — an empty result here means the update didn't actually happen
  // (usually: not signed in as an admin, or the session expired).
  if (!rows || rows.length === 0) {
    throw new Error('Update was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return fromDb(rows[0]);
}

export async function deleteDepartment(id) {
  const { data: rows, error } = await supabase.from(TABLE).delete().eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Delete was blocked — you may not be signed in as an admin, or your session expired.');
  }
}