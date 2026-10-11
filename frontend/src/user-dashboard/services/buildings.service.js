import { supabase } from '../../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, images, ...rest } = row;
  return {
    ...rest,
    desc: description || '',
    dept: department_id,
    images: Array.isArray(images) ? images : [],
  };
}

export async function listBuildings() {
  const { data, error } = await supabase.from('buildings').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function getBuildingById(id) {
  const { data, error } = await supabase.from('buildings').select('*').eq('id', id).single();
  if (error) throw error;
  return fromDb(data);
}