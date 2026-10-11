// ============================================================
// Asset resolver
// Eagerly imports every file in src/assets/images so the data
// store can keep referencing photos by name (e.g. 'images/cat_logo.jpg').
// Vite rewrites these to hashed, build-safe URLs.
//
// Building photos uploaded from the Admin Dashboard are stored in
// Supabase Storage and saved as full public URLs, so resolveImage()
// passes those through unchanged while still supporting the older
// local-filename references.
// ============================================================

const files = import.meta.glob('../../assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Build a { 'cat_logo.jpg': '/assets/cat_logo-abc123.jpg' } lookup.
const byName = {};
for (const path in files) {
  const name = path.split('/').pop();
  byName[name] = files[path];
}

/**
 * Resolve a LOCAL image reference to a usable URL.
 * Accepts a bare filename ('cat_logo.jpg') or a path ('images/cat_logo.jpg').
 * Returns '' when the file is missing so callers can show a placeholder.
 */
export function img(ref) {
  if (!ref) return '';
  const name = String(ref).split('/').pop();
  return byName[name] || '';
}

/**
 * Resolve ANY image reference to a usable URL:
 *  - full http(s) URLs (Supabase Storage uploads) -> returned as-is
 *  - blob:/data: URLs (admin form previews)       -> returned as-is
 *  - local filenames ('images/cat.jpg')            -> resolved via img()
 * Returns '' when nothing usable is found.
 */
export function resolveImage(ref) {
  if (!ref) return '';
  const value = String(ref).trim();
  if (!value) return '';
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  return img(value);
}

/**
 * Normalise a building's `images` column (jsonb array of
 * { id, url, path, lat, lng, caption, panorama, heading }) into a clean list with
 * resolved URLs. Invalid / empty entries are dropped.
 */
export function buildingGallery(building) {
  const list = Array.isArray(building?.images) ? building.images : [];
  return list
    .map((item, index) => ({
      id: item?.id || `img-${index}`,
      src: resolveImage(item?.url),
      lat: item?.lat,
      lng: item?.lng,
      caption: item?.caption || '',
      // true / false when the admin marked it; undefined for older uploads
      panorama: typeof item?.panorama === 'boolean' ? item.panorama : undefined,
      // forward-arrow direction in degrees for the building 360° tour (0 = photo centre)
      heading: Number.isFinite(Number(item?.heading)) ? Number(item.heading) : 0,
    }))
    .filter((item) => Boolean(item.src));
}