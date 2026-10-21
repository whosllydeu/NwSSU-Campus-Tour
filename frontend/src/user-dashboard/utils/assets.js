const files = import.meta.glob('../../assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byName = {};
for (const path in files) {
  const name = path.split('/').pop();
  byName[name] = files[path];
}

export function img(ref) {
  if (!ref) return '';
  const name = String(ref).split('/').pop();
  return byName[name] || '';
}

export function resolveImage(ref) {
  if (!ref) return '';
  const value = String(ref).trim();
  if (!value) return '';
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  return img(value);
}

export function buildingGallery(building) {
  const list = Array.isArray(building?.images) ? building.images : [];
  return list
    .map((item, index) => ({
      id: item?.id || `img-${index}`,
      src: resolveImage(item?.url),
      lat: item?.lat,
      lng: item?.lng,
      caption: item?.caption || '',
      panorama: typeof item?.panorama === 'boolean' ? item.panorama : undefined,
      heading: Number.isFinite(Number(item?.heading)) ? Number(item.heading) : 0,
      view: item?.view !== null && item?.view !== undefined && item?.view !== '' && Number.isFinite(Number(item.view)) ? Number(item.view) : null,
      back: item?.back !== null && item?.back !== undefined && item?.back !== '' && Number.isFinite(Number(item.back)) ? Number(item.back) : null,
      links: Array.isArray(item?.links) ? item.links : [],
      end: item?.end === true,
    }))
    .filter((item) => Boolean(item.src));
}