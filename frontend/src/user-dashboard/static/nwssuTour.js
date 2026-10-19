import {
  TOUR_GRAPH, CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS,
} from './tourNodes';

export { CONNECTIONS, WALK_ROUTES, WALK_DEFAULT_START, PATH_LINKS };

export const TOURS = TOUR_GRAPH.tours;
export const TOUR_NODES = TOUR_GRAPH.nodes;
export const NODE_BY_ID = TOUR_GRAPH.byId;

export const GPS_START_RADIUS = 150;

export const WALK_START_MAX_METERS = 40;

export const WALK_DEST_MAX_METERS = 40;

export const NEAR_ME_RADIUS = 300;

export function metersBetween([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nodesNear(latLng, maxMeters = Infinity) {
  if (!Array.isArray(latLng) || latLng.length < 2) return [];
  return TOUR_NODES
    .filter((n) => Array.isArray(n.data?.gps))
    .map((node) => ({ node, distance: metersBetween(latLng, node.data.gps) }))
    .filter((c) => c.distance <= maxMeters)
    .sort((a, b) => a.distance - b.distance);
}

export const resolveTourId = (id) => {
  if (!id) return null;
  if (TOURS[id]) return id;
  return TOUR_GRAPH.aliases[id] || null;
};

export const hasTour = (id) => Boolean(resolveTourId(id));

export const tourOfNode = (nodeId) => TOURS[NODE_BY_ID[nodeId]?.data.tour] || null;

export const isPathwayNode = (node) => tourOfNode(node?.id)?.kind === 'pathway';

export function nodeLabel(nodeId) {
  const node = NODE_BY_ID[nodeId];
  if (!node) return '';
  const title = tourOfNode(nodeId)?.title;
  if (!title || title === node.name) return node.name || title || nodeId;
  return node.name ? `${title} · ${node.name}` : title;
}

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

export function getTourStart(tourId, startNode = null) {
  if (startNode) {
    const id = String(startNode).replace(/\.[^.]+$/, '');
    if (NODE_BY_ID[id]) return id;
  }
  const t = TOURS[resolveTourId(tourId)];
  if (t?.startNode && NODE_BY_ID[t.startNode]) return t.startNode;
  return NODE_BY_ID[tourId] ? tourId : null;
}

export const CORRIDOR_TOLERANCE_M = 15;
const OFF_ROUTE_PENALTY = 25;
const BUILDING_PENALTY = 200;
const NO_GPS_STEP_M = 8;

let walkCorridor = null;
let pathCache = new Map();

export function setWalkCorridor(coordinates) {
  walkCorridor = Array.isArray(coordinates) && coordinates.length > 1 ? coordinates : null;
  pathCache = new Map();
}

function distanceToLine(point, line) {
  const k = Math.cos((point[0] * Math.PI) / 180);
  const M = 111320;
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

function pathCost(path) {
  if (!path || path.length < 2) return 0;
  const destTour = NODE_BY_ID[path[path.length - 1]].data.tour;
  let total = 0;
  for (let i = 1; i < path.length; i++) total += stepCost(NODE_BY_ID[path[i - 1]], NODE_BY_ID[path[i]], destTour);
  return total;
}

const START_CANDIDATE_SLACK_M = 15;

let reverseLinks = null;

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

function originDoorNode(originBuildingId, destinationId) {
  if (!originBuildingId || originBuildingId === destinationId) return null;
  const origin = WALK_ROUTES[originBuildingId];
  const inside = origin && NODE_BY_ID[origin.arriveNode];
  if (!inside) return null;
  if (isPathwayNode(inside)) return inside.id;
  const out = inside.links.find((l) => NODE_BY_ID[l.nodeId]?.data.tour === origin.pathway)
    || inside.links.find((l) => isPathwayNode(NODE_BY_ID[l.nodeId]));
  return out ? out.nodeId : inside.id;
}

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
    startFromOrigin = false,
  } = {}
) {
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

  if (startFromOrigin) {
    const door = originDoorNode(originBuildingId, destinationId);
    const path = door ? findPath(door, route.arriveNode) : null;
    if (path) return build(door, path, 'origin');
  }

  const anchor = routeStart || (Array.isArray(userLocation) && userLocation.length >= 2 ? userLocation : null);
  if (anchor) {
    const reachable = nodesThatCanReach(route.arriveNode);
    const candidates = [];
    for (const node of TOUR_NODES) {
      if (!Array.isArray(node.data?.gps) || !isPathwayNode(node) || !reachable.has(node.id)) continue;
      candidates.push({ node, distance: metersBetween(anchor, node.data.gps) });
    }
    const nearest = Math.min(...candidates.map((c) => c.distance));
    let best = null;
    for (const c of candidates) {
      if (c.distance > nearest + START_CANDIDATE_SLACK_M) continue;
      const p = findPath(c.node.id, route.arriveNode);
      if (!p) continue;
      const score = 2 * c.distance + offRoutePenalty(c.node) + pathCost(p);
      if (!best || score < best.score) best = { ...c, score };
    }
    if (best) {
      const path = findPath(best.node.id, route.arriveNode);
      const hasUser = Array.isArray(userLocation) && userLocation.length >= 2;
      if (path && hasUser) return build(best.node.id, path, 'gps', metersBetween(userLocation, best.node.data.gps));
      if (path) return build(best.node.id, path, 'route');
    }
  }

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