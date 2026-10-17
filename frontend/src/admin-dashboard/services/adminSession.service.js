import { supabase } from '../../lib/supabaseClient';

export const HEARTBEAT_MS = 30 * 1000;
export const SESSION_TIMEOUT_MINUTES = 2;

const DEVICE_KEY = 'nwssu-admin-device-id';
let memoryDeviceId = null;

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    if (!memoryDeviceId) memoryDeviceId = newId();
    return memoryDeviceId;
  }
}

export async function claimAdminSession() {
  const { data, error } = await supabase.rpc('claim_admin_session', { p_device_id: getDeviceId() });
  if (error) throw new Error(`Could not check for an active administrator: ${error.message}`);
  return {
    ok: Boolean(data?.ok),
    reason: data?.reason || null,
    activeEmail: data?.active_email || null,
    lastSeen: data?.last_seen || null,
  };
}

export async function releaseAdminSession() {
  try {
    await supabase.rpc('release_admin_session', { p_device_id: getDeviceId() });
  } catch {
  }
}

export function busyMessage(result) {
  const who = result?.activeEmail ? ` (${result.activeEmail})` : '';
  return `Another administrator${who} is currently logged in. Only one administrator can use the dashboard at a time. Please try again after they log out, or about ${SESSION_TIMEOUT_MINUTES} minutes after they close the dashboard.`;
}