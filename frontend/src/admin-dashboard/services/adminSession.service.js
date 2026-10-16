import { supabase } from '../../lib/supabaseClient';

// Only one administrator may be logged in at a time.
// The lock lives in Supabase (table admin_active_session, functions
// claim_admin_session / release_admin_session — see admin_single_session.sql).

// How often the dashboard checks in to keep the lock (ms).
export const HEARTBEAT_MS = 30 * 1000;
// Must match admin_session_timeout() in the SQL file — used only for messages.
export const SESSION_TIMEOUT_MINUTES = 2;

const DEVICE_KEY = 'nwssu-admin-device-id';
let memoryDeviceId = null;

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Stable id for this browser, so reloads and extra tabs keep the same lock. */
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

/**
 * Claims (or keeps) the active-admin slot for this browser.
 * Resolves to { ok: true } or { ok: false, reason, activeEmail, lastSeen }.
 */
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

/** Gives the slot back (called on log out). Never throws. */
export async function releaseAdminSession() {
  try {
    await supabase.rpc('release_admin_session', { p_device_id: getDeviceId() });
  } catch {
    /* the lock also expires on its own */
  }
}

/** Message shown on the login page when another admin is active. */
export function busyMessage(result) {
  const who = result?.activeEmail ? ` (${result.activeEmail})` : '';
  return `Another administrator${who} is currently logged in. Only one administrator can use the dashboard at a time. Please try again after they log out, or about ${SESSION_TIMEOUT_MINUTES} minutes after they close the dashboard.`;
}