import { BUILDINGS, DEPARTMENTS } from './data.js';
import { slugify } from '../../lib/slugify';

function withIds(list) {
  const seen = new Map();
  return list.map((item) => {
    const raw = item.id || item.name || item.abbr || 'item';
    const base = slugify(String(raw));
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    const _id = n > 0 ? `${base}-${n}` : base;
    return { _id, ...JSON.parse(JSON.stringify(item)) };
  });
}

export const seedBuildings = () => withIds(BUILDINGS);
export const seedDepartments = () => withIds(DEPARTMENTS);

export const BUILDING_TYPES = ['academic', 'admin', 'facility'];