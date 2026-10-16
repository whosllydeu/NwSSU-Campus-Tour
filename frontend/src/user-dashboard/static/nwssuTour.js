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
//   setWalkCorridor(pts) → makes the 360° walk follow the Map route
//   nodesNear(latLng)    → Map "360° near me" (closest panoramas first)
// Existing imports keep working unchanged.
// ============================================================
import {
  TOUR_GRAPH, CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS,
} from './tourNodes';

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

// "Walk there!" to a building with no WALK_ROUTES entry (e.g. one added from
// the Admin Dashboard): the walk ends at the pathway photo nearest the
// building, if one is within this many metres.
export const WALK_DEST_MAX_METERS = 40;

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

/** Closest GPS-tagged PATHWAY photo to `latLng` within `maxMeters`, or null. */
export function nearestPathwayNode(latLng, maxMeters = Infinity) {
  if (!Array.isArray(latLng) || latLng.length < 2) return null;
  let best = null;
  for (const node of TOUR_NODES) {
    if (!Array.isArray(node.data?.gps) || !isPathwayNode(node)) continue;
    const distance = metersBetween(latLng, node.data.gps);
    if (distance <= maxMeters && (!best || distance < best.distance)) best = { node, distance };
  }
  return best;
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

// ------------------------------------------------------------------
// Route-following 360° walk
// ------------------------------------------------------------------
// The Map draws its route with A* on the walkway graph (campusGraph.json).
// "Walk there!" must show the SAME route in 360°, so the Map hands that
// route's line to setWalkCorridor() before opening the walk. findPath()
// then picks the chain of photos that stays on that line:
//   cost of a step = metres walked
//                  + a big penalty for every metre a photo is off the route
//                  + a penalty for cutting through another building.
// Without a corridor it is simply the shortest walk in metres.

// Photos within this many metres of the route line count as "on the route"
// (phone GPS on the photos is a few metres off).
export const CORRIDOR_TOLERANCE_M = 15;
const OFF_ROUTE_PENALTY = 25; // per metre beyond the tolerance
const BUILDING_PENALTY = 200; // passing through a building that is not the destination
const NO_GPS_STEP_M = 8; // assumed length of a step to/from a photo with no GPS

let walkCorridor = null;
let pathCache = new Map();

/**
 * Sets the Map route the guided 360° walk must follow ([[lat, lng], …]),
 * or clears it with null.
 */
export function setWalkCorridor(coordinates) {
  walkCorridor = Array.isArray(coordinates) && coordinates.length > 1 ? coordinates : null;
  pathCache = new Map();
}

/** Distance in metres from a point to the nearest point of a polyline. */
function distanceToLine(point, line) {
  const k = Math.cos((point[0] * Math.PI) / 180);
  const M = 111320; // metres per degree of latitude
  const px = point[1] * k * M;
  const py = point[0] * M;
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = line[i][1] * k * M, ay = line[i][0] * M;
    const bx = line[i + 1][1] * k * M, by = line[i + 1][0] * M;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d < best) best = d;
  }
  return best;
}

function offRoutePenalty(node) {
  if (!walkCorridor || !Array.isArray(node.data?.gps)) return 0;
  const off = distanceToLine(node.data.gps, walkCorridor) - CORRIDOR_TOLERANCE_M;
  return off > 0 ? off * OFF_ROUTE_PENALTY : 0;
}

function stepCost(from, to, destTour) {
  const a = from.data?.gps;
  const b = to.data?.gps;
  let cost = Array.isArray(a) && Array.isArray(b) ? metersBetween(a, b) : NO_GPS_STEP_M;
  if (to.data.tour !== destTour && TOURS[to.data.tour]?.kind !== 'pathway') cost += BUILDING_PENALTY;
  return cost + offRoutePenalty(to);
}

/**
 * Best list of node ids from one panorama to another (follows the Map
 * route when a corridor is set), or null when they are not connected.
 */
export function findPath(fromId, toId) {
  if (!NODE_BY_ID[fromId] || !NODE_BY_ID[toId]) return null;
  if (fromId === toId) return [fromId];
  const key = `${fromId}>${toId}`;
  if (pathCache.has(key)) return pathCache.get(key);

  const destTour = NODE_BY_ID[toId].data.tour;
  const dist = new Map([[fromId, 0]]);
  const prev = new Map();
  const done = new Set();
  const open = [fromId];
  while (open.length) {
    // small graph (a few hundred photos) → a simple scan is fast enough
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist.get(open[i]) < dist.get(open[bi])) bi = i;
    const id = open.splice(bi, 1)[0];
    if (id === toId) break;
    if (done.has(id)) continue;
    done.add(id);
    const node = NODE_BY_ID[id];
    for (const l of node.links) {
      const next = NODE_BY_ID[l.nodeId];
      if (!next || done.has(next.id)) continue;
      const d = dist.get(id) + stepCost(node, next, destTour);
      if (d < (dist.get(next.id) ?? Infinity)) {
        dist.set(next.id, d);
        prev.set(next.id, id);
        open.push(next.id);
      }
    }
  }

  let path = null;
  if (dist.has(toId)) {
    path = [toId];
    let cur = toId;
    while (prev.has(cur)) { cur = prev.get(cur); path.unshift(cur); }
  }
  pathCache.set(key, path);
  return path;
}

// Reverse adjacency (who links TO each node), built once on first use.
let reverseLinks = null;

/** Call after nodes/links change at runtime (e.g. buildings connected from the Admin Dashboard). */
export function resetTourCaches() {
  reverseLinks = null;
  pathCache = new Map();
}
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
 * Destination: the WALK_ROUTES entry for `destinationId`. If there is none
 * (e.g. a building added from the Admin Dashboard), the walk ends at the
 * pathway photo nearest `destinationLatLng`, within `maxDestMeters`.
 *
 * Returns null when no destination photo can be found, otherwise:
 *   { startNode, arriveNode, path, steps, label, via,
 *     startLabel, startSource: 'gps' | 'origin' | 'route' | 'gate',
 *     startDistance (m, only for 'gps'), withinThreshold, maxStartMeters,
 *     arriveDistance (m, only when the destination was found by GPS) }
 */
export function planWalk(
  destinationId,
  {
    userLocation = null,
    originBuildingId = null,
    maxStartMeters = WALK_START_MAX_METERS,
    destinationLatLng = null,
    destinationName = null,
    maxDestMeters = WALK_DEST_MAX_METERS,
    routeCoordinates = null,
  } = {}
) {
  // When the Map route is known, the walk starts and ends where that
  // route starts and ends, so the 360° walk and the map line match.
  const hasRoute = Array.isArray(routeCoordinates) && routeCoordinates.length > 1;
  const routeStart = hasRoute ? routeCoordinates[0] : null;
  const routeEnd = hasRoute ? routeCoordinates[routeCoordinates.length - 1] : null;

  let route = WALK_ROUTES[destinationId];
  let arriveDistance = null;
  if (!route || !NODE_BY_ID[route.arriveNode]) {
    const near =
      (routeEnd && nearestPathwayNode(routeEnd, maxDestMeters)) ||
      nearestPathwayNode(destinationLatLng, maxDestMeters);
    if (!near) return null;
    route = { arriveNode: near.node.id, pathway: near.node.data.tour };
    arriveDistance = near.distance;
  }

  const destTour = tourOfNode(route.arriveNode);
  const base = {
    arriveNode: route.arriveNode,
    label: destinationName
      || (destTour?.kind === 'building' ? destTour.title : NODE_BY_ID[route.arriveNode].name),
    via: TOURS[route.pathway]?.title || null,
    maxStartMeters,
    arriveDistance,
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

  // 1) Reachable pathway photo nearest to where the Map route starts
  //    (or to the origin position when there is no route).
  const anchor = routeStart || (Array.isArray(userLocation) && userLocation.length >= 2 ? userLocation : null);
  if (anchor) {
    const reachable = nodesThatCanReach(route.arriveNode);
    let best = null;
    for (const node of TOUR_NODES) {
      if (!Array.isArray(node.data?.gps) || !isPathwayNode(node) || !reachable.has(node.id)) continue;
      const distance = metersBetween(anchor, node.data.gps);
      if (!best || distance < best.distance) best = { node, distance };
    }
    if (best) {
      const path = findPath(best.node.id, route.arriveNode);
      const hasUser = Array.isArray(userLocation) && userLocation.length >= 2;
      if (path && hasUser) return build(best.node.id, path, 'gps', metersBetween(userLocation, best.node.data.gps));
      if (path) return build(best.node.id, path, 'route');
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