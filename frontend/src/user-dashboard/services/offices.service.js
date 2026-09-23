import { supabase } from '../../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { description, ...rest } = row;
  return { ...rest, desc: description };
}

export async function listOffices() {
  const { data, error } = await supabase.from('offices').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}