import { supabase } from '../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, ...rest } = row;
  return { ...rest, desc: description, dept: department_id };
}

export async function listBuildings() {
  const { data, error } = await supabase.from('buildings').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function getBuilding(id) {
  const { data, error } = await supabase.from('buildings').select('*').eq('id', id).single();
  if (error) throw error;
  return fromDb(data);
}