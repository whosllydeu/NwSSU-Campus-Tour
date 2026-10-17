import { buildingGallery, resolveImage } from './assets';

export function isPanoramaRatio(width, height) {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= 1.9 && ratio <= 2.1 && width >= 2000;
}

const sizeCache = new Map();

export function loadImageSize(src) {
  if (!src) return Promise.resolve(null);
  if (sizeCache.has(src)) return sizeCache.get(src);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
  sizeCache.set(src, promise);
  return promise;
}

export async function getBuildingPanoramas(building) {
  if (!building) return [];

  const candidates = buildingGallery(building);
  const mainSrc = resolveImage(building.photo);
  if (mainSrc && !candidates.some((c) => c.src === mainSrc)) {
    candidates.unshift({
      id: 'main-photo',
      src: mainSrc,
      caption: building.name,
      lat: building.lat,
      lng: building.lng,
      panorama: undefined,
    });
  }

  const checked = await Promise.all(candidates.map(async (item) => {
    if (item.panorama === true) return item;
    if (item.panorama === false) return null;
    const size = await loadImageSize(item.src);
    return size && isPanoramaRatio(size.width, size.height) ? item : null;
  }));

  return checked.filter(Boolean);
}

export function findBuildingTourId(building, departments = [], hasTour) {
  if (!building || typeof hasTour !== 'function') return null;

  const abbr = String(building.abbr || '').trim().toLowerCase();
  const linkedDepts = (departments || []).filter((d) => (
    d.id === building.dept ||
    d.id === building.id ||
    (abbr && String(d.abbr || '').trim().toLowerCase() === abbr)
  ));

  const candidates = [
    building.id,
    building.dept,
    ...linkedDepts.map((d) => d.id),
    abbr,
    abbr.replace(/[^a-z0-9]+/g, '-'),
  ].filter(Boolean);

  return candidates.find((id) => hasTour(id)) || null;
}

export function uploadedImagesNear(buildings, latLng, metersBetween, maxMeters = Infinity) {
  if (!Array.isArray(latLng) || latLng.length < 2) return [];
  const out = [];
  (buildings || []).forEach((building) => {
    buildingGallery(building).forEach((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (item.panorama === false || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const distance = metersBetween(latLng, [lat, lng]);
      if (distance <= maxMeters) out.push({ building, item, distance });
    });
  });
  return out.sort((a, b) => a.distance - b.distance);
}