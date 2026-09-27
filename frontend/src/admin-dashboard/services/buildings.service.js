import { supabase } from '../../lib/supabaseClient';
import { slugify } from '../../lib/slugify';

const TABLE = 'buildings';

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, ...rest } = row;
  return { ...rest, desc: description, dept: department_id, _id: row.id };
}

function toDb(data) {
  const { desc, dept, ...rest } = data;
  return {
    ...rest,
    ...(desc !== undefined ? { description: desc } : {}),
    ...(dept !== undefined ? { department_id: dept || null } : {}),
  };
}

export async function listBuildings() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createBuilding(data) {
  const id = data.id || slugify(data.name || data.abbr || `building-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...toDb(data), id }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateBuilding(id, data) {
  const { data: rows, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select();
  if (error) throw error;
  // RLS blocks a write by silently matching 0 rows, not by returning an
  // error � an empty result here means the update didn't actually happen
  // (usually: not signed in as an admin, or the session expired).
  if (!rows || rows.length === 0) {
    throw new Error('Update was blocked � you may not be signed in as an admin, or your session expired.');
  }
  return fromDb(rows[0]);
}

export async function deleteBuilding(id) {
  const { data: rows, error } = await supabase.from(TABLE).delete().eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Delete was blocked � you may not be signed in as an admin, or your session expired.');
  }
}
