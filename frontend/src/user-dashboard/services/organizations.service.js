import { supabase } from '../../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { college_abbr, ...rest } = row;
  return { ...rest, college: college_abbr };
}

export async function listOrganizations() {
  const { data, error } = await supabase.from('organizations').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}