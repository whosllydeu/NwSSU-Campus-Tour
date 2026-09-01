// ============================================================
// AR DESTINATIONS — the ONLY file you edit after measuring GPS.
//
// After you record a place's coordinate (long-press it in Google
// Maps to see its lat/lng), paste the numbers here. The moment a
// place has BOTH lat and lng, its "🧭 AR Walk Here" button turns
// on automatically — no other code changes needed.
//
// KEYS:
//   • Buildings & Departments  → use the id  (e.g. 'ccis', 'library')
//   • Offices                  → use the name-slug (already listed below)
//
// EXAMPLE (filled):
//   ccis: { name: 'CCIS Building', lat: 12.067123, lng: 124.596540 },
// ============================================================

export const AR_DESTINATIONS = {
  // ---- Buildings / Departments (share the same id) ----
  cat:            { name: 'College of Agriculture (CAT)',        lat: null, lng: null },
  ccis:           { name: 'CCIS Building',                       lat: null, lng: null },
  ccjs:           { name: 'CCJS Building',                       lat: null, lng: null },
  coed:           { name: 'College of Education (COED)',         lat: null, lng: null },
  con:            { name: 'College of Nursing (CON)',            lat: null, lng: null },
  com:            { name: 'College of Management (COM)',         lat: null, lng: null },
  cea:            { name: 'College of Engineering & Arch (CEA)', lat: null, lng: null },
  library:        { name: 'University Library',                  lat: null, lng: null },
  registrar:      { name: "Registrar's Office",                  lat: null, lng: null },
  cashier:        { name: "Cashier's Office",                    lat: null, lng: null },
  president:      { name: 'Administration Building',             lat: null, lng: null },
  alumni:         { name: 'Alumni Building',                     lat: null, lng: null },
  sociocultural:  { name: 'Socio-Cultural Building',             lat: null, lng: null },
  studentcouncil: { name: 'Student Council Building',            lat: null, lng: null },
  hotel:          { name: 'NWSSU Hotel & Restaurant',           lat: null, lng: null },
  canteen:        { name: 'University Canteen',                  lat: null, lng: null },
  sports:         { name: 'Sports Complex',                      lat: null, lng: null },

  // ---- Offices (keyed by name-slug) ----
  'office-of-the-university-president': { name: 'Office of the University President', lat: null, lng: null },
  'vp-for-academic-affairs':           { name: 'VP for Academic Affairs',            lat: null, lng: null },
  'vp-for-administration-finance':     { name: 'VP for Administration & Finance',    lat: null, lng: null },
  'university-registrar':              { name: 'University Registrar',               lat: null, lng: null },
  'cashier-s-office':                  { name: "Cashier's Office",                   lat: null, lng: null },
  'human-resources-office':            { name: 'Human Resources Office',             lat: null, lng: null },
  'student-affairs-office':            { name: 'Student Affairs Office',             lat: null, lng: null },
  'osas-office-of-student-affairs':    { name: 'OSAS',                               lat: null, lng: null },
  'guidance-counseling-office':        { name: 'Guidance & Counseling Office',       lat: null, lng: null },
  'health-services-clinic':            { name: 'Health Services / Clinic',           lat: null, lng: null },
  'library-office':                    { name: 'Library Office',                     lat: null, lng: null },
  'planning-development-office':        { name: 'Planning & Development Office',       lat: null, lng: null },
  'research-extension-office':          { name: 'Research & Extension Office',         lat: null, lng: null },
  'international-studies-linkages':     { name: 'International Studies & Linkages',    lat: null, lng: null },
  'public-relations-office':            { name: 'Public Relations Office',            lat: null, lng: null },
  'supreme-student-council':            { name: 'Supreme Student Council',            lat: null, lng: null },
  'sports-coordinator-s-office':        { name: "Sports Coordinator's Office",        lat: null, lng: null },
  'nwssu-hotel-restaurant':             { name: 'NWSSU Hotel & Restaurant',          lat: null, lng: null },
};

// Turn any name into the key used above (offices).
export const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Returns the destination ONLY if it has real coordinates, else null.
export const getAR = (key) => {
  const d = AR_DESTINATIONS[key];
  return d && d.lat != null && d.lng != null ? d : null;
};

// True when a place is ready for AR (coordinates filled in).
export const hasAR = (key) => Boolean(getAR(key));

// ============================================================
// Captured coordinates — saved on THIS device via the AR
// "Save My Location Here" button (no Google Maps needed).
// resolveCoord() prefers a saved coordinate, then falls back to
// the static AR_DESTINATIONS above.
// ============================================================
const AR_LS_KEY = 'nwssu_ar_saved';

export function loadSaved() {
  try { return JSON.parse(localStorage.getItem(AR_LS_KEY)) || {}; }
  catch { return {}; }
}

export function saveCoord(key, lat, lng) {
  const all = loadSaved();
  all[key] = { lat, lng };
  try { localStorage.setItem(AR_LS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all;
}

// Removes just this place's saved coordinate, so its AR screen goes
// back to capture mode (falls through to the Supabase-managed spot,
// if the admin has set one, otherwise to no destination at all).
export function clearCoord(key) {
  const all = loadSaved();
  delete all[key];
  try { localStorage.setItem(AR_LS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all;
}

// Returns { lat, lng, name } for a place, or null if nothing recorded yet.
export function resolveCoord(key) {
  const saved = loadSaved()[key];
  const name = (AR_DESTINATIONS[key] && AR_DESTINATIONS[key].name) || 'Destination';
  if (saved && saved.lat != null && saved.lng != null) return { lat: saved.lat, lng: saved.lng, name };
  const st = AR_DESTINATIONS[key];
  if (st && st.lat != null && st.lng != null) return { lat: st.lat, lng: st.lng, name: st.name };
  return null;
}

// Paste-ready lines for arDestinations.js from everything saved on this device.
export function exportSavedText() {
  const all = loadSaved();
  const keys = Object.keys(all);
  if (!keys.length) return '// No saved locations on this device yet.';
  return keys
    .map((k) => {
      const name = (AR_DESTINATIONS[k] && AR_DESTINATIONS[k].name) || k;
      return `  '${k}': { name: ${JSON.stringify(name)}, lat: ${all[k].lat}, lng: ${all[k].lng} },`;
    })
    .join('\n');
}