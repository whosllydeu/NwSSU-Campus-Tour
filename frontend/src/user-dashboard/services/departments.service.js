import { supabase } from '../../lib/supabaseClient.js';

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getDepartment(id) {
  const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}