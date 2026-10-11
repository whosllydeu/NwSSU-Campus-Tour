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

// How close (metres) the user must be to a GPS-tagged panorama for
// "Walk there!" to start from it instead of the origin building / Gate.
// Covers someone standing between two buildings (e.g. Gate ↔ CEA).
export const GPS_START_RADIUS = 150;

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

/**
 * Plans a guided "Walk there!" route to a building.
 * Start node priority:
 *   1. GPS-tagged panoramas near the user, closest first — the first one
 *      that has a route to the destination wins (so a nearby photo with
 *      no connection doesn't send the user back to the Gate)
 *   2. the arrival node of the building the user is standing at
 *   3. the route's own startNode
 *   4. WALK_DEFAULT_START (Main Gate)
 * Returns { startNode, arriveNode, path, label, via, startDistance } or null.
 * `startDistance` is metres from the user to the start photo (null when
 * the start wasn't chosen by GPS).
 */
export function planWalk(destinationId, { userLocation = null, originBuildingId = null } = {}) {
  const route = WALK_ROUTES[destinationId];
  if (!route || !NODE_BY_ID[route.arriveNode]) return null;

  const candidates = [];
  const gpsDistance = {};
  nodesNear(userLocation, GPS_START_RADIUS).forEach(({ node, distance }) => {
    candidates.push(node.id);
    gpsDistance[node.id] = distance;
  });
  const origin = WALK_ROUTES[originBuildingId];
  if (origin && originBuildingId !== destinationId) candidates.push(origin.arriveNode);
  if (route.startNode) candidates.push(route.startNode);
  candidates.push(WALK_DEFAULT_START);

  for (const startNode of candidates) {
    const path = findPath(startNode, route.arriveNode);
    if (path) {
      const destTour = tourOfNode(route.arriveNode);
      return {
        startNode,
        arriveNode: route.arriveNode,
        path,
        label: destTour?.kind === 'building' ? destTour.title : NODE_BY_ID[route.arriveNode].name,
        via: TOURS[route.pathway]?.title || null,
        startDistance: gpsDistance[startNode] ?? null,
      };
    }
  }
  return null;
}