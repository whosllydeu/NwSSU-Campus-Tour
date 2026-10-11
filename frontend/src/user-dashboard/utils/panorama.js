// ============================================================
// Uploaded 360° panoramas (Admin → Buildings → Additional Images).
//
// These are shown in a standalone viewer (BuildingPanoramaViewer)
// that is completely separate from the campus walking tour in
// static/tourNodes.js — no pathway arrows, no links, no conflicts.
// ============================================================
import { buildingGallery, resolveImage } from './assets';

/** Equirectangular 360° images are about twice as wide as tall. */
export function isPanoramaRatio(width, height) {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= 1.9 && ratio <= 2.1 && width >= 2000;
}

const sizeCache = new Map();

/** Loads an image just far enough to read its pixel size. */
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

/**
 * Returns the building's uploaded panoramas, in gallery order:
 *  - gallery images marked "360° panorama" by the admin are used directly
 *  - images marked as normal photos are skipped
 *  - older uploads without a mark are checked by their 2:1 shape
 *  - the main building photo is included too if it is a 2:1 panorama
 * Each item: { id, src, caption, lat, lng }
 */
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

/**
 * Finds the existing campus-tour id (static/tourNodes.js) for a building.
 *
 * Tour ids are the department / college ids ('ccis', 'cat', …), but a
 * building added from the Admin Dashboard gets its id from its name
 * (e.g. 'college-of-computing-information-sciences'). So besides the
 * building's own id we also try its linked department, a department
 * with the same abbreviation, and the abbreviation itself.
 * Returns the first id that has a tour, or null.
 */
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

/**
 * Uploaded gallery images (Admin → Buildings) near a point, closest first.
 * Only images with coordinates that are not marked "normal photo" are
 * considered; whether an unmarked older image really is a 360° panorama
 * is confirmed later with getBuildingPanoramas().
 * @returns [{ building, item, distance }]
 */
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