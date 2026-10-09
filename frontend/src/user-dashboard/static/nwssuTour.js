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
// Existing imports keep working unchanged.
// ============================================================
import {
  TOUR_GRAPH, CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS,
} from './tourNodes';
import { shortestPath, nearestNode } from '../utils/tourGraph';

export { CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS };

export const TOURS = TOUR_GRAPH.tours;
export const TOUR_NODES = TOUR_GRAPH.nodes;
export const NODE_BY_ID = TOUR_GRAPH.byId;

// How close (metres) the user must be to a GPS-tagged panorama for
// "Walk there!" to start from it instead of the default start node.
const GPS_START_RADIUS = 60;

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
 *   1. the GPS-tagged panorama nearest to the user (once coordinates exist)
 *   2. the arrival node of the building the user is standing at
 *   3. the route's own startNode
 *   4. WALK_DEFAULT_START (Main Gate)
 * Returns { startNode, arriveNode, path, label, via } or null.
 */
export function planWalk(destinationId, { userLocation = null, originBuildingId = null } = {}) {
  const route = WALK_ROUTES[destinationId];
  if (!route || !NODE_BY_ID[route.arriveNode]) return null;

  const candidates = [];
  const near = nearestNode(TOUR_NODES, userLocation, GPS_START_RADIUS);
  if (near) candidates.push(near.node.id);
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
      };
    }
  }
  return null;
}