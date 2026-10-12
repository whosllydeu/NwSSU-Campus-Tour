// ============================================================
// adminTours.js — connects buildings added from the Admin Dashboard
// to the campus 360° pathway tour, with no code edits.
//
// A building whose `pathway_link` column is set (Admin → Buildings →
// "360° Pathway Connection") gets:
//   • a building tour made from its uploaded 360° gallery images
//     (gallery order = walking order, `heading` = forward arrow,
//      per-image `links` = extra arrows)
//   • a floating pin on the chosen pathway photo that enters the
//     building, plus a return arrow back to the pathway
//   • a "Walk there!" route (WALK_ROUTES[building.id])
//
// The shared TOUR_GRAPH from static/tourNodes.js is extended IN PLACE,
// so PanoramaTour / SphereTour / nwssuTour keep working unchanged.
// Calling applyAdminBuildingTours() again first removes everything it
// added last time, so it is safe to call whenever buildings reload.
// Buildings that already have a built-in tour in code are skipped.
//
// pathway_link (jsonb):
//   { pathwayNode: 'pathway-ccis-alumni-28',  // pathway photo with the pin
//     entryImage:  '<gallery image id>',      // first photo inside
//     label:       'Enter Sports Complex',    // optional pin text
//     pinYaw:      90,                        // optional, degrees
//     returnYaw:   180 }                      // optional, degrees
// ============================================================
import { TOUR_GRAPH, WALK_ROUTES } from '../static/tourNodes';
import { resetTourCaches } from '../static/nwssuTour';
import { buildingGallery } from './assets';

const IS_DEV = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
const warn = (...args) => { if (IS_DEV) console.warn('[admin-tour]', ...args); };

// Snapshot of what exists in code, taken before any admin building is added.
const STATIC_WALK_KEYS = new Set(Object.keys(WALK_ROUTES));
const STATIC_TOUR_IDS = new Set(Object.keys(TOUR_GRAPH.tours));
const STATIC_ALIASES = new Set(Object.keys(TOUR_GRAPH.aliases || {}));

const MIN_ARROW_GAP = 25;

const normDeg = (deg) => {
  const x = ((((deg + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};
const angleGap = (a, b) => Math.abs(normDeg(a - b));
const finite = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** True when a building already has a 360° tour / walk route written in code. */
export function isBuiltInTourBuilding(buildingId) {
  if (!buildingId) return false;
  return STATIC_WALK_KEYS.has(buildingId) || STATIC_TOUR_IDS.has(buildingId) || STATIC_ALIASES.has(buildingId);
}

/** Tour id used for an admin building's 360° tour. */
export const adminTourId = (buildingId) => `admin-${buildingId}`;

// Everything added by the last apply, so it can be removed again.
let added = { tourIds: [], nodeIds: new Set(), walkKeys: [], foreign: [] };

function removePrevious() {
  const { byId, nodes, tours } = TOUR_GRAPH;
  // links + pins we put on built-in (pathway) photos
  for (const f of added.foreign) {
    const node = byId[f.nodeId];
    if (!node) continue;
    node.links = node.links.filter((l) => l.nodeId !== f.targetId);
    node.markers = (node.markers || []).filter((m) => m.id !== f.markerId);
  }
  // our own nodes (same array instance, so imports stay valid)
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (added.nodeIds.has(nodes[i].id)) nodes.splice(i, 1);
  }
  added.nodeIds.forEach((id) => { delete byId[id]; });
  added.tourIds.forEach((id) => { delete tours[id]; });
  added.walkKeys.forEach((key) => { delete WALK_ROUTES[key]; });
  added = { tourIds: [], nodeIds: new Set(), walkKeys: [], foreign: [] };
}

function addLink(node, targetId, yaw, extra = {}) {
  if (targetId === node.id || node.links.some((l) => l.nodeId === targetId)) return false;
  const y = normDeg(yaw);
  node.links.push({
    nodeId: targetId,
    position: { yaw: `${Math.round(y * 10) / 10}deg`, pitch: '0deg' },
    data: { yaw: y, ...extra },
  });
  return true;
}

function addPin(node, targetId, yaw, label) {
  const id = `go:${node.id}>${targetId}`;
  (node.markers ||= []).push({
    id,
    position: { yaw: `${normDeg(yaw)}deg`, pitch: '-4deg' },
    html: `<span class="tour-enter-pin"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 7.3 12.28a1 1 0 0 0 1.4 0C13 22 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="currentColor"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>${escapeHtml(label)}</span>`,
    anchor: 'bottom center',
    data: { goto: targetId },
  });
  return id;
}

/** A yaw on `node` that does not overlap its existing arrows (right, left, forward, back). */
function freeYaw(node, preferredOffsets = [90, -90, 0, 180]) {
  const base = node.data?.yaw ?? 0;
  for (const off of preferredOffsets) {
    const y = normDeg(base + off);
    if (node.links.every((l) => angleGap(l.data?.yaw ?? 0, y) >= MIN_ARROW_GAP)) return y;
  }
  return normDeg(base + preferredOffsets[0]);
}

/**
 * Adds every admin-connected building to the shared 360° tour graph.
 * @param {Array} buildings rows from Supabase (camelCase or snake_case)
 * @returns {Array<string>} ids of the buildings that were connected
 */
export function applyAdminBuildingTours(buildings = []) {
  removePrevious();
  const { byId, nodes, tours } = TOUR_GRAPH;
  const connected = [];

  for (const b of buildings || []) {
    const cfg = b?.pathwayLink ?? b?.pathway_link;
    if (!b?.id || !cfg?.pathwayNode) continue;
    if (isBuiltInTourBuilding(b.id)) {
      warn(`"${b.name}" already has a built-in 360° tour — its admin pathway connection is ignored.`);
      continue;
    }
    const pathNode = byId[cfg.pathwayNode];
    if (!pathNode) {
      warn(`"${b.name}": pathway photo "${cfg.pathwayNode}" does not exist.`);
      continue;
    }
    const gallery = buildingGallery(b).filter((img) => img.panorama === true);
    if (!gallery.length) {
      warn(`"${b.name}" has no images marked as 360° panorama — not connected.`);
      continue;
    }

    const tourId = adminTourId(b.id);
    const nodeIdOf = (imgId) => `${tourId}--${imgId}`;
    const imgIds = new Set(gallery.map((img) => img.id));

    // 1) one node per 360° image, same shape utils/tourGraph.js produces
    const own = gallery.map((img) => {
      const node = {
        id: nodeIdOf(img.id),
        panorama: img.src,
        name: img.caption || b.name,
        caption: b.name,
        links: [],
        markers: [],
        data: {
          tour: tourId,
          yaw: normDeg(Number(img.heading) || 0),
          yawIsDefault: !finite(img.heading),
          backYaw: null,
          gps: finite(img.lat) && finite(img.lng) ? [Number(img.lat), Number(img.lng)] : null,
          star: false,
          office: null,
        },
      };
      byId[node.id] = node;
      nodes.push(node);
      added.nodeIds.add(node.id);
      return { img, node };
    });

    // 2) extra arrows set in the admin gallery, then forward/back in gallery order
    own.forEach(({ img, node }) => {
      (img.links || []).forEach((l) => {
        if (imgIds.has(String(l.to)) && finite(l.yaw)) addLink(node, nodeIdOf(String(l.to)), Number(l.yaw));
      });
    });
    own.forEach(({ node }, i) => {
      if (own[i + 1]) addLink(node, own[i + 1].node.id, node.data.yaw, { dir: 'forward' });
      if (own[i - 1]) addLink(node, own[i - 1].node.id, node.data.yaw + 180, { dir: 'back' });
    });

    tours[tourId] = {
      id: tourId,
      kind: 'building',
      title: b.name,
      subtitle: '360° Tour',
      startNode: own[0].node.id,
      nodeIds: own.map(({ node }) => node.id),
    };
    added.tourIds.push(tourId);

    // 3) pathway photo ⇄ entrance photo
    const entry = own.find(({ img }) => img.id === String(cfg.entryImage))?.node || own[0].node;
    tours[tourId].startNode = entry.id;
    const pathTour = tours[pathNode.data.tour];
    const pinLabel = String(cfg.label || '').trim() || `Enter ${b.name}`;
    const pinYaw = finite(cfg.pinYaw) ? Number(cfg.pinYaw) : freeYaw(pathNode);
    if (addLink(pathNode, entry.id, pinYaw, { cross: true, label: pinLabel })) {
      const markerId = addPin(pathNode, entry.id, pinYaw, pinLabel);
      added.foreign.push({ nodeId: pathNode.id, targetId: entry.id, markerId });
    }
    const backLabel = pathTour ? `Walk: ${pathTour.title}` : 'Back to Pathway';
    const returnYaw = finite(cfg.returnYaw) ? Number(cfg.returnYaw) : freeYaw(entry, [180, 90, -90, 0]);
    if (addLink(entry, pathNode.id, returnYaw, { cross: true, label: backLabel })) {
      addPin(entry, pathNode.id, returnYaw, backLabel);
    }

    // 4) "Walk there!" ends at the entrance photo
    if (!STATIC_WALK_KEYS.has(b.id)) {
      WALK_ROUTES[b.id] = { pathway: pathNode.data.tour, arriveNode: entry.id };
      added.walkKeys.push(b.id);
    }
    connected.push(b.id);
  }

  resetTourCaches();
  return connected;
}