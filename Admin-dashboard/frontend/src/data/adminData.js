// ============================================================
// Admin data seeding
// The public site's data.js exports are the source of truth for
// *shape*, but the admin dashboard needs a stable, unique key per
// record to edit/delete rows safely (offices & organizations don't
// carry an `id` field in the public data). We derive one here and
// never mutate the original arrays.
// ============================================================
import { BUILDINGS, DEPARTMENTS, OFFICES, ORGANIZATIONS } from './data.js';
import { slugify } from './arDestinations.js';

function withIds(list) {
  const seen = new Map();
  return list.map((item) => {
    const raw = item.id || item.name || item.abbr || 'item';
    const base = slugify(String(raw));
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    const _id = n > 0 ? `${base}-${n}` : base;
    // Deep clone so admin edits never touch the imported constants.
    return { _id, ...JSON.parse(JSON.stringify(item)) };
  });
}

export const seedBuildings = () => withIds(BUILDINGS);
export const seedDepartments = () => withIds(DEPARTMENTS);
export const seedOffices = () => withIds(OFFICES);
export const seedOrganizations = () => withIds(ORGANIZATIONS);

export const BUILDING_TYPES = ['academic', 'admin', 'facility'];
