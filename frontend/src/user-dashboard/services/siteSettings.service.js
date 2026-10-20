import { supabase } from '../../lib/supabaseClient';

const TABLE = 'site_settings';
const ANNOUNCEMENT = 'announcement';

const EMPTY = { enabled: false, text: '', tone: 'info' };

/** The announcement shown at the top of the visitor site. */
export async function getAnnouncement() {
  const { data, error } = await supabase.from(TABLE).select('value').eq('key', ANNOUNCEMENT).maybeSingle();
  if (error) throw error;
  return { ...EMPTY, ...(data?.value || {}) };
}

export async function saveAnnouncement({ enabled, text, tone }) {
  const value = { enabled: Boolean(enabled), text: String(text || '').trim(), tone: tone || 'info' };
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key: ANNOUNCEMENT, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
  return value;
}