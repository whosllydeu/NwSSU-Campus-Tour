// ============================================================
// nwssuTour.js — public API of the 360° tour system.
//
// All panorama DATA now lives in static/tourNodes.js (one source of
// truth). This file only exposes helpers the rest of the app uses:
//   hasTour(id)          → DetailScreen, Modal, BuildingInfoModal, Map
//   PATH_LINKS           → DetailScreen "Walk …" buttons
//   TOURS / NODE_BY_ID   → PanoramaTour / SphereTour
//   getTourStart(id)     → which node a tour opens on
//   planWalk(destId)     → Map "Walk there!" guided route
//   nodesNear(latLng)    → Map "360° near me" (closest panoramas first)
// Existing imports keep working unchanged.
// ============================================================
import {
  TOUR_GRAPH, CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS,
} from './tourNodes';
import { shortestPath } from '../utils/tourGraph';

export { CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS };

export const TOURS = TOUR_GRAPH.tours;
export const TOUR_NODES = TOUR_GRAPH.nodes;
export const NODE_BY_ID = TOUR_GRAPH.byId;

// Kept for existing imports. "Walk there!" no longer uses it — it now
// always starts at the nearest reachable PATHWAY photo, however far.
export const GPS_START_RADIUS = 150;

// "Walk there!": if the nearest reachable pathway photo is farther than
// this (metres), the walk still starts there but the Map shows a notice.
export const WALK_START_MAX_METERS = 40;

// "360° near me": farther than this from every panorama = probably off campus.
export const NEAR_ME_RADIUS = 300;

/** Straight-line distance in metres between two [lat, lng] points. */
export function metersBetween([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Every GPS-tagged panorama within `maxMeters` of `latLng`, closest first.
 * Panoramas still marked GPS_TODO (no coordinates) are skipped.
 * @returns [{ node, distance }]
 */
export function nodesNear(latLng, maxMeters = Infinity) {
  if (!Array.isArray(latLng) || latLng.length < 2) return [];
  return TOUR_NODES
    .filter((n) => Array.isArray(n.data?.gps))
    .map((node) => ({ node, distance: metersBetween(latLng, node.data.gps) }))
    .filter((c) => c.distance <= maxMeters)
    .sort((a, b) => a.distance - b.distance);
}

/** Building/pathway id (or alias like 'lib') → tour id, or null. */
export const resolveTourId = (id) => {
  if (!id) return null;
  if (TOURS[id]) return id;
  return TOUR_GRAPH.aliases[id] || null;
};

export const hasTour = (id) => Boolean(resolveTourId(id));

export const tourOfNode = (nodeId) => TOURS[NODE_BY_ID[nodeId]?.data.tour] || null;

/** True when a node belongs to an outdoor pathway tour (not a building interior). */
export const isPathwayNode = (node) => tourOfNode(node?.id)?.kind === 'pathway';

/** Readable place name for a node, e.g. "Gate – CEA Pathway · Walkway 3". */
export function nodeLabel(nodeId) {
  const node = NODE_BY_ID[nodeId];
  if (!node) return '';
  const title = tourOfNode(nodeId)?.title;
  if (!title || title === node.name) return node.name || title || nodeId;
  return node.name ? `${title} · ${node.name}` : title;
}

/**
 * Pathway photos that still have no GPS coordinates (GPS_TODO).
 * These can never be picked as a "Walk there!" start until they get [lat, lng].
 * @returns [{ id, tour, name }]
 */
export function pathwayNodesMissingGps() {
  return TOUR_NODES
    .filter((n) => isPathwayNode(n) && !Array.isArray(n.data?.gps))
    .map((n) => ({ id: n.id, tour: n.data.tour, name: n.name }));
}

if (import.meta.env?.DEV) {
  const missing = pathwayNodesMissingGps();
  if (missing.length) {
    console.info(`[tour] ${missing.length} pathway photo(s) have no GPS yet — "Walk there!" cannot start from them:`);
    console.table(missing);
  }
}

/**
 * Node a tour should open on.
 * `startNode` may be a node id ('coed-07') or an old-style file name
 * ('coed-07.jpg') — both work.
 */
export function getTourStart(tourId, startNode = null) {
  if (startNode) {
    const id = String(startNode).replace(/\.[^.]+$/, '');
    if (NODE_BY_ID[id]) return id;
  }
  const t = TOURS[resolveTourId(tourId)];
  if (t?.startNode && NODE_BY_ID[t.startNode]) return t.startNode;
  return NODE_BY_ID[tourId] ? tourId : null; // a node id was passed directly
}

/** Shortest list of node ids from one panorama to another, or null. */
export const findPath = (fromId, toId) => shortestPath(NODE_BY_ID, fromId, toId);

// Reverse adjacency (who links TO each node), built once on first use.
let reverseLinks = null;
function getReverseLinks() {
  if (reverseLinks) return reverseLinks;
  reverseLinks = {};
  for (const node of TOUR_NODES) {
    for (const l of node.links) {
      (reverseLinks[l.nodeId] ||= []).push(node.id);
    }
  }
  return reverseLinks;
}

/** Set of node ids that have a link path INTO `targetId` (including itself). */
function nodesThatCanReach(targetId) {
  const rev = getReverseLinks();
  const seen = new Set([targetId]);
  const queue = [targetId];
  while (queue.length) {
    const id = queue.shift();
    for (const from of rev[id] || []) {
      if (!seen.has(from)) {
        seen.add(from);
        queue.push(from);
      }
    }
  }
  return seen;
}

/**
 * Plans a guided "Walk there!" route to a building.
 *
 * Start node priority:
 *   1. If an origin position is known (GPS, VITE_TEST_LOCATION, or the
 *      picked origin building's coordinates): the PATHWAY photo with GPS
 *      that is closest to it AND has a link path to the destination.
 *      Building-interior photos are never used as the GPS start.
 *   2. the arrival node of the origin building (no reachable GPS photo)
 *   3. the route's own startNode
 *   4. WALK_DEFAULT_START (Main Gate)
 *
 * Returns null when the destination has no walk route, otherwise:
 *   { startNode, arriveNode, path, steps, label, via,
 *     startLabel, startSource: 'gps' | 'origin' | 'route' | 'gate',
 *     startDistance (m, only for 'gps'), withinThreshold, maxStartMeters }
 */
export function planWalk(
  destinationId,
  { userLocation = null, originBuildingId = null, maxStartMeters = WALK_START_MAX_METERS } = {}
) {
  const route = WALK_ROUTES[destinationId];
  if (!route || !NODE_BY_ID[route.arriveNode]) return null;

  const destTour = tourOfNode(route.arriveNode);
  const base = {
    arriveNode: route.arriveNode,
    label: destTour?.kind === 'building' ? destTour.title : NODE_BY_ID[route.arriveNode].name,
    via: TOURS[route.pathway]?.title || null,
    maxStartMeters,
  };
  const build = (startNode, path, startSource, startDistance = null) => ({
    ...base,
    startNode,
    path,
    steps: path.length - 1,
    startLabel: nodeLabel(startNode),
    startSource,
    startDistance,
    withinThreshold: startDistance === null ? null : startDistance <= maxStartMeters,
  });

  // 1) Nearest reachable pathway photo to the origin position.
  if (Array.isArray(userLocation) && userLocation.length >= 2) {
    const reachable = nodesThatCanReach(route.arriveNode);
    let best = null;
    for (const node of TOUR_NODES) {
      if (!Array.isArray(node.data?.gps) || !isPathwayNode(node) || !reachable.has(node.id)) continue;
      const distance = metersBetween(userLocation, node.data.gps);
      if (!best || distance < best.distance) best = { node, distance };
    }
    if (best) {
      const path = findPath(best.node.id, route.arriveNode);
      if (path) return build(best.node.id, path, 'gps', best.distance);
    }
  }

  // 2–4) Fallbacks when no reachable pathway photo has coordinates.
  const fallbacks = [];
  const origin = WALK_ROUTES[originBuildingId];
  if (origin && originBuildingId !== destinationId) fallbacks.push([origin.arriveNode, 'origin']);
  if (route.startNode) fallbacks.push([route.startNode, 'route']);
  fallbacks.push([WALK_DEFAULT_START, 'gate']);

  for (const [startNode, source] of fallbacks) {
    const path = findPath(startNode, route.arriveNode);
    if (path) return build(startNode, path, source);
  }
  return null;
}