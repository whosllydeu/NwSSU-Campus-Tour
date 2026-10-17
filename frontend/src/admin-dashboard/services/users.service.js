import { supabase } from '../../lib/supabaseClient';

const TABLE = 'profiles';

export async function listProfiles() {
  const { data, error } = await supabase.from(TABLE).select('*').order('email');
  if (error) throw error;
  return data;
}

export async function updateUserRole(id, role) {
  const { data: rows, error } = await supabase.from(TABLE).update({ role }).eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Role change was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return rows[0];
}
