import { TOUR_GRAPH, WALK_ROUTES } from '../static/tourNodes';
import { resetTourCaches } from '../static/nwssuTour';
import { buildingGallery } from './assets';

const IS_DEV = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
const warn = (...args) => { if (IS_DEV) console.warn('[admin-tour]', ...args); };

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

export function isBuiltInTourBuilding(buildingId) {
  if (!buildingId) return false;
  return STATIC_WALK_KEYS.has(buildingId) || STATIC_TOUR_IDS.has(buildingId) || STATIC_ALIASES.has(buildingId);
}

export const adminTourId = (buildingId) => `admin-${buildingId}`;

const freshAdded = () => ({
  tourIds: [], nodeIds: new Set(), walkKeys: [], foreign: [],
  restoreTours: [], restoreWalks: [], unlinked: [],
});
let added = freshAdded();

export const hiddenNodeIds = new Set();

function staticTourIdOf(buildingId) {
  const { tours, aliases, byId } = TOUR_GRAPH;
  if (tours[buildingId] && !String(buildingId).startsWith('admin-')) return buildingId;
  if (aliases?.[buildingId]) return aliases[buildingId];
  const arrive = WALK_ROUTES[buildingId]?.arriveNode;
  return arrive ? byId[arrive]?.data?.tour || null : null;
}

function replaceStaticTour(buildingId, tourId) {
  const { tours, nodes } = TOUR_GRAPH;
  const staticId = staticTourIdOf(buildingId);
  if (!staticId || !tours[staticId] || staticId === tourId) return;
  const staticNodes = new Set(tours[staticId].nodeIds);
  staticNodes.forEach((id) => hiddenNodeIds.add(id));
  added.restoreTours.push({ id: staticId, tour: tours[staticId] });
  tours[staticId] = tours[tourId];

  for (const node of nodes) {
    if (staticNodes.has(node.id)) continue;
    const links = node.links.filter((l) => staticNodes.has(l.nodeId));
    if (!links.length) continue;
    const markers = (node.markers || []).filter((m) => staticNodes.has(m.data?.goto));
    node.links = node.links.filter((l) => !staticNodes.has(l.nodeId));
    node.markers = (node.markers || []).filter((m) => !staticNodes.has(m.data?.goto));
    added.unlinked.push({ nodeId: node.id, links, markers });
  }

  [buildingId, staticId].forEach((key) => {
    if (!WALK_ROUTES[key] || added.restoreWalks.some((w) => w.key === key)) return;
    added.restoreWalks.push({ key, route: WALK_ROUTES[key] });
    delete WALK_ROUTES[key];
  });
}

function removePrevious() {
  const { byId, nodes, tours } = TOUR_GRAPH;
  for (const f of added.foreign) {
    const node = byId[f.nodeId];
    if (!node) continue;
    node.links = node.links.filter((l) => l.nodeId !== f.targetId);
    node.markers = (node.markers || []).filter((m) => m.id !== f.markerId);
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (added.nodeIds.has(nodes[i].id)) nodes.splice(i, 1);
  }
  added.nodeIds.forEach((id) => { delete byId[id]; });
  added.tourIds.forEach((id) => { delete tours[id]; });
  added.walkKeys.forEach((key) => { delete WALK_ROUTES[key]; });
  added.restoreWalks.forEach(({ key, route }) => { WALK_ROUTES[key] = route; });
  added.restoreTours.forEach(({ id, tour }) => { tours[id] = tour; });
  for (const u of added.unlinked) {
    const node = byId[u.nodeId];
    if (!node) continue;
    u.links.forEach((l) => { if (!node.links.some((x) => x.nodeId === l.nodeId)) node.links.push(l); });
    const markers = node.markers || [];
    node.markers = [...markers, ...u.markers.filter((m) => !markers.some((x) => x.id === m.id))];
  }
  hiddenNodeIds.clear();
  added = freshAdded();
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

function freeYaw(node, preferredOffsets = [90, -90, 0, 180]) {
  const base = node.data?.yaw ?? 0;
  for (const off of preferredOffsets) {
    const y = normDeg(base + off);
    if (node.links.every((l) => angleGap(l.data?.yaw ?? 0, y) >= MIN_ARROW_GAP)) return y;
  }
  return normDeg(base + preferredOffsets[0]);
}

export function applyAdminBuildingTours(buildings = []) {
  removePrevious();
  const { byId, nodes, tours } = TOUR_GRAPH;
  const connected = [];

  for (const b of buildings || []) {
    const cfg = b?.pathwayLink ?? b?.pathway_link;
    if (!b?.id) continue;
    const builtIn = isBuiltInTourBuilding(b.id);
    if (builtIn && cfg?.useUploadedTour !== true) continue;
    const gallery = buildingGallery(b).filter((img) => img.panorama === true);
    if (!gallery.length) continue;

    const tourId = adminTourId(b.id);
    const nodeIdOf = (imgId) => `${tourId}--${imgId}`;
    const imgIds = new Set(gallery.map((img) => img.id));

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
          yaw: normDeg(finite(img.view) ? Number(img.view) : Number(img.heading) || 0),
          forward: normDeg(Number(img.heading) || 0),
          yawIsDefault: !finite(img.heading) && !finite(img.view),
          backYaw: finite(img.back) ? normDeg(Number(img.back)) : null,
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

    own.forEach(({ img, node }) => {
      (img.links || []).forEach((l) => {
        if (imgIds.has(String(l.to)) && finite(l.yaw)) addLink(node, nodeIdOf(String(l.to)), Number(l.yaw));
      });
    });
    own.forEach(({ img, node }, i) => {
      if (own[i + 1] && !img.end) addLink(node, own[i + 1].node.id, node.data.forward, { dir: 'forward' });
      if (own[i - 1] && !own[i - 1].img.end) addLink(node, own[i - 1].node.id, node.data.backYaw ?? node.data.forward + 180, { dir: 'back' });
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
    if (builtIn) replaceStaticTour(b.id, tourId);

    const pathNode = cfg?.pathwayNode ? byId[cfg.pathwayNode] : null;
    if (!pathNode) {
      if (cfg?.pathwayNode) warn(`"${b.name}": pathway photo "${cfg.pathwayNode}" does not exist.`);
      continue;
    }

    const entry = own.find(({ img }) => img.id === String(cfg.entryImage))?.node || own[0].node;
    tours[tourId].startNode = entry.id;
    const pathTour = tours[pathNode.data.tour];
    const pinLabel = String(cfg.label || '').trim() || `Enter ${b.name}`;
    const pinYaw = finite(cfg.pinYaw) ? Number(cfg.pinYaw) : freeYaw(pathNode);
    if (addLink(pathNode, entry.id, pinYaw, { cross: true, label: pinLabel })) {
      const markerId = addPin(pathNode, entry.id, pinYaw, pinLabel);
      added.foreign.push({ nodeId: pathNode.id, targetId: entry.id, markerId });
    }
    if (cfg.exitArrow === true) {
      const backLabel = pathTour ? `Walk: ${pathTour.title}` : 'Back to Pathway';
      const returnYaw = finite(cfg.returnYaw) ? Number(cfg.returnYaw) : freeYaw(entry, [180, 90, -90, 0]);
      if (addLink(entry, pathNode.id, returnYaw, { cross: true, label: backLabel })) {
        addPin(entry, pathNode.id, returnYaw, backLabel);
      }
    }

    if (!STATIC_WALK_KEYS.has(b.id) || builtIn) {
      WALK_ROUTES[b.id] = { pathway: pathNode.data.tour, arriveNode: entry.id };
      added.walkKeys.push(b.id);
    }
    connected.push(b.id);
  }

  resetTourCaches();
  return connected;
}