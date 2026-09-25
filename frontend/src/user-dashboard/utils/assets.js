// ============================================================
// Asset resolver
// Eagerly imports every file in src/assets/images so the data
// store can keep referencing photos by name (e.g. 'images/cat_logo.jpg').
// Vite rewrites these to hashed, build-safe URLs.
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
 * Resolve an image reference to a usable URL.
 * Accepts a bare filename ('cat_logo.jpg') or a path ('images/cat_logo.jpg').
 * Returns '' when the file is missing so callers can show a placeholder.
 */
export function img(ref) {
  if (!ref) return '';
  const name = ref.split('/').pop();
  return byName[name] || '';
}