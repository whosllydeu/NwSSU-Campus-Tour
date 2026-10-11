// On-campus pedestrian routing — fully client-side, no external services.
//
//  * A* over src/data/campusGraph.json with a haversine heuristic.
//  * Edge lengths (metres) are the traversal costs.
//  * Arbitrary points are snapped onto the nearest point of the nearest
//    walkway edge (not just the nearest node) and the snapped edge is
//    traversed "virtually", so the shared graph is never mutated.
//  * Buildings route from/to their `entranceNodeId`, so they are never
//    snapped to a nearby but inaccessible walkway.
//  * The returned geometry is the concatenation of the full walkway
//    geometries, so distance, duration, directions and the drawn polyline
//    all come from the same path.

import campusGraph from '../data/campusGraph.json';

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
const EARTH_RADIUS_M = 6371008.8;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

export function haversine(a, b) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function polylineLength(coords) {
  let d = 0;
  for (let i = 1; i < coords.length; i++) d += haversine(coords[i - 1], coords[i]);
  return d;
}

export function bearing(a, b) {
  const φ1 = toRad(a[0]);
  const φ2 = toRad(b[0]);
  const Δλ = toRad(b[1] - a[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const sameCoord = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

/** Accepts [lat, lng], {lat, lng}, {lat, lon} or a Leaflet LatLng. */
export function toLatLng(p) {
  if (!p) return null;
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  if (typeof p.lat === 'number') return [p.lat, typeof p.lng === 'number' ? p.lng : p.lon];
  return null;
}

// Project point P onto segment AB in a local metric plane.
function projectOnSegment(p, a, b) {
  const k = Math.cos(toRad(p[0]));
  const ax = a[1] * k, ay = a[0];
  const bx = b[1] * k, by = b[0];
  const px = p[1] * k, py = p[0];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return { t, point, distance: haversine(p, point) };
}

// ---------------------------------------------------------------------------
// Minimal binary heap for the A* open set
// ---------------------------------------------------------------------------
class MinHeap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(priority, value) {
    const it = this.items;
    it.push({ priority, value });
    let i = it.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (it[p].priority <= it[i].priority) break;
      [it[p], it[i]] = [it[i], it[p]];
      i = p;
    }
  }
  pop() {
    const it = this.items;
    const top = it[0];
    const last = it.pop();
    if (it.length) {
      it[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < it.length && it[l].priority < it[m].priority) m = l;
        if (r < it.length && it[r].priority < it[m].priority) m = r;
        if (m === i) break;
        [it[m], it[i]] = [it[i], it[m]];
        i = m;
      }
    }
    return top.value;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export const DEFAULT_WALKING_SPEED_MPS = 1.33; // ≈ 80 m per minute
const START = '__start__';
const END = '__end__';

export function createCampusRouter(graph = campusGraph, options = {}) {
  const walkingSpeed = options.walkingSpeed ?? DEFAULT_WALKING_SPEED_MPS;
  const defaultMaxSnap = options.maxSnapDistance ?? 50;

  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const alias = new Map();
  for (const n of graph.nodes) {
    alias.set(n.id, n.id);
    for (const a of n.aliases ?? []) alias.set(a, n.id);
  }
  const edges = new Map(graph.edges.map((e) => [e.id, e]));
  const walkwayNames = new Map((graph.walkways ?? []).map((w) => [w.id, w.name ?? w.id]));

  const adjacency = new Map(graph.nodes.map((n) => [n.id, []]));
  for (const e of graph.edges) {
    adjacency.get(e.from)?.push({ to: e.to, cost: e.length, edge: e, reversed: false });
    adjacency.get(e.to)?.push({ to: e.from, cost: e.length, edge: e, reversed: true });
  }

  const resolveNodeId = (id) => (id == null ? null : alias.get(String(id)) ?? null);
  const coordOf = (id, extra) => extra?.coords.get(id) ?? nodes.get(id)?.coord;

  /** Nearest point on the nearest walkway edge. */
  function snap(input, opts = {}) {
    const p = toLatLng(input);
    if (!p) return null;
    const maxDistance = opts.maxDistance ?? defaultMaxSnap;
    const allowConnectors = opts.allowConnectors ?? false;
    const walkways = opts.walkways ? new Set(opts.walkways) : null;
    let best = null;
    for (const e of graph.edges) {
      if (e.connector && !allowConnectors) continue;
      if (walkways && !walkways.has(e.walkway)) continue;
      const g = e.geometry;
      let along = 0;
      for (let i = 0; i < g.length - 1; i++) {
        const segLen = haversine(g[i], g[i + 1]);
        const pr = projectOnSegment(p, g[i], g[i + 1]);
        if (!best || pr.distance < best.distance) {
          best = {
            edgeId: e.id,
            edge: e,
            segIndex: i,
            t: pr.t,
            point: pr.point,
            distance: pr.distance,
            offset: along + segLen * pr.t, // metres from edge.from
          };
        }
        along += segLen;
      }
    }
    if (!best) return null;
    best.withinRange = best.distance <= maxDistance;
    return best;
  }

  // Split an edge's geometry at a snap position (never mutates the edge).
  function splitGeometry(s) {
    const g = s.edge.geometry;
    const head = g.slice(0, s.segIndex + 1);
    if (!sameCoord(head[head.length - 1], s.point)) head.push(s.point);
    const tail = [s.point];
    for (let i = s.segIndex + 1; i < g.length; i++) if (!sameCoord(tail[tail.length - 1], g[i])) tail.push(g[i]);
    return { toFrom: head.slice().reverse(), toTo: tail }; // both start at the snap point
  }

  // Normalise a route endpoint into { nodeId } or { snap }.
  function resolveEndpoint(input, opts) {
    if (input == null) return { error: 'missing', message: 'No start or destination was given.' };
    if (typeof input === 'string') {
      const id = resolveNodeId(input);
      return id ? { nodeId: id } : { error: 'unknown-node', message: `Unknown graph node "${input}".` };
    }
    const nodeRef = input.nodeId ?? input.entranceNodeId;
    if (nodeRef != null) {
      const id = resolveNodeId(nodeRef);
      if (id) return { nodeId: id };
      return { error: 'unknown-node', message: `Entrance node "${nodeRef}" is not in the campus graph.` };
    }
    const s = snap(input, opts);
    if (!s) return { error: 'invalid-point', message: 'The selected location has no valid coordinates.' };
    if (!s.withinRange)
      return {
        error: 'too-far',
        message: `The selected location is ${Math.round(s.distance)} m from the nearest campus walkway.`,
        snap: s,
      };
    return { snap: s };
  }

  function addVirtual(extra, virtualId, s) {
    const { toFrom, toTo } = splitGeometry(s);
    extra.coords.set(virtualId, s.point);
    const mk = (to, geometry) => ({
      to,
      cost: polylineLength(geometry),
      edge: { id: `${s.edge.id}~${virtualId}`, walkway: s.edge.walkway, connector: !!s.edge.connector, geometry, virtual: true },
      reversed: false,
    });
    const outFrom = mk(s.edge.from, toFrom);
    const outTo = mk(s.edge.to, toTo);
    const push = (k, v) => {
      if (!extra.adj.has(k)) extra.adj.set(k, []);
      extra.adj.get(k).push(v);
    };
    push(virtualId, outFrom);
    push(virtualId, outTo);
    // reverse links so the virtual END node can be reached from the graph
    push(s.edge.from, { ...outFrom, to: virtualId, edge: { ...outFrom.edge, geometry: toFrom.slice().reverse() } });
    push(s.edge.to, { ...outTo, to: virtualId, edge: { ...outTo.edge, geometry: toTo.slice().reverse() } });
  }

  function sameEdgeLink(extra, a, b) {
    // Both snaps on one edge: direct sub-path between them along the walkway.
    const g = a.edge.geometry;
    const forward = a.segIndex < b.segIndex || (a.segIndex === b.segIndex && a.t <= b.t);
    const [p, q] = forward ? [a, b] : [b, a];
    const geom = [p.point];
    for (let i = p.segIndex + 1; i <= q.segIndex; i++) if (!sameCoord(geom[geom.length - 1], g[i])) geom.push(g[i]);
    if (!sameCoord(geom[geom.length - 1], q.point)) geom.push(q.point);
    const geometry = forward ? geom : geom.reverse();
    const link = {
      to: END,
      cost: polylineLength(geometry),
      edge: { id: `${a.edge.id}~direct`, walkway: a.edge.walkway, connector: !!a.edge.connector, geometry, virtual: true },
      reversed: false,
    };
    extra.adj.get(START).push(link);
  }

  function aStar(startId, goalId, extra) {
    const goal = coordOf(goalId, extra);
    const g = new Map([[startId, 0]]);
    const came = new Map();
    const open = new MinHeap();
    const closed = new Set();
    open.push(haversine(coordOf(startId, extra), goal), startId);
    while (open.size) {
      const cur = open.pop();
      if (cur === goalId) break;
      if (closed.has(cur)) continue;
      closed.add(cur);
      const links = [...(adjacency.get(cur) ?? []), ...(extra.adj.get(cur) ?? [])];
      for (const link of links) {
        if (closed.has(link.to)) continue;
        const tentative = g.get(cur) + link.cost;
        if (tentative < (g.get(link.to) ?? Infinity)) {
          g.set(link.to, tentative);
          came.set(link.to, { prev: cur, link });
          open.push(tentative + haversine(coordOf(link.to, extra), goal), link.to);
        }
      }
    }
    if (!g.has(goalId)) return null;
    const path = [];
    let n = goalId;
    while (n !== startId) {
      const step = came.get(n);
      path.push(step);
      n = step.prev;
    }
    return { cost: g.get(goalId), steps: path.reverse() };
  }

  /**
   * Route between two places.
   * from / to may be: a node id string, a building ({ entranceNodeId }),
   * { nodeId }, or a free coordinate ([lat,lng] / {lat,lng}) to be snapped.
   */
  function route(from, to, opts = {}) {
    const a = resolveEndpoint(from, opts);
    if (a.error) return { ok: false, reason: a.error, message: a.message, which: 'start', snap: a.snap };
    const b = resolveEndpoint(to, opts);
    if (b.error) return { ok: false, reason: b.error, message: b.message, which: 'end', snap: b.snap };

    const extra = { adj: new Map(), coords: new Map() };
    let startId = a.nodeId;
    let goalId = b.nodeId;
    if (a.snap) { addVirtual(extra, START, a.snap); startId = START; }
    if (b.snap) { addVirtual(extra, END, b.snap); goalId = END; }
    if (a.snap && b.snap && a.snap.edgeId === b.snap.edgeId) sameEdgeLink(extra, a.snap, b.snap);

    if (startId === goalId) {
      const c = coordOf(startId, extra);
      return buildResult({ cost: 0, steps: [] }, [c], { a, b });
    }
    const found = aStar(startId, goalId, extra);
    if (!found)
      return {
        ok: false,
        reason: 'unreachable',
        message: 'No walkway connection exists between these two places yet.',
      };
    return buildResult(found, null, { a, b }, extra, startId);
  }

  function buildResult(found, fixedCoords, ends, extra, startId) {
    const routeEdges = [];
    const coordinates = fixedCoords ? [...fixedCoords] : [];
    const nodeIds = startId ? [startId] : [];
    for (const { link } of found.steps) {
      const geometry = link.reversed ? link.edge.geometry.slice().reverse() : link.edge.geometry;
      routeEdges.push({
        id: link.edge.id,
        walkway: link.edge.walkway,
        walkwayName: walkwayNames.get(link.edge.walkway) ?? (link.edge.connector ? 'connecting path' : link.edge.walkway),
        connector: !!link.edge.connector,
        virtual: !!link.edge.virtual,
        length: link.cost,
        geometry,
      });
      for (const c of geometry) if (!coordinates.length || !sameCoord(coordinates[coordinates.length - 1], c)) coordinates.push(c);
      nodeIds.push(link.to);
    }
    const distance = routeEdges.reduce((s, e) => s + e.length, 0);
    return {
      ok: true,
      distance, // metres along the walkways
      duration: distance / walkingSpeed, // seconds
      coordinates, // one continuous polyline for Leaflet
      edges: routeEdges,
      nodeIds: nodeIds.filter((id) => id !== START && id !== END),
      startSnap: ends.a.snap ?? null,
      endSnap: ends.b.snap ?? null,
      steps: buildDirections(routeEdges, distance),
    };
  }

  return {
    graph,
    nodes,
    edges,
    walkingSpeed,
    resolveNodeId,
    getNode: (id) => nodes.get(resolveNodeId(id)) ?? null,
    snap,
    route,
    nearestNode(input) {
      const p = toLatLng(input);
      let best = null;
      for (const n of graph.nodes) {
        const d = haversine(p, n.coord);
        if (!best || d < best.distance) best = { node: n, distance: d };
      }
      return best;
    },
    analyze: () => analyzeConnectivity(graph),
  };
}

// ---------------------------------------------------------------------------
// Turn-by-turn directions from the route edges
// ---------------------------------------------------------------------------
function pointBack(coords, metres) {
  // coordinate roughly `metres` before the end of coords
  let acc = 0;
  for (let i = coords.length - 1; i > 0; i--) {
    acc += haversine(coords[i - 1], coords[i]);
    if (acc >= metres) return coords[i - 1];
  }
  return coords[0];
}
function pointAhead(coords, metres) {
  let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    acc += haversine(coords[i - 1], coords[i]);
    if (acc >= metres) return coords[i];
  }
  return coords[coords.length - 1];
}
const CARDINALS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const cardinal = (b) => CARDINALS[Math.round(b / 45) % 8];

function turnPhrase(delta) {
  const a = Math.abs(delta);
  if (a < 25) return { type: 'straight', text: 'Continue straight' };
  const side = delta > 0 ? 'right' : 'left';
  if (a < 60) return { type: `slight-${side}`, text: `Bear ${side}` };
  if (a < 135) return { type: side, text: `Turn ${side}` };
  return { type: `sharp-${side}`, text: `Make a sharp ${side}` };
}

export function buildDirections(routeEdges, totalDistance) {
  if (!routeEdges.length) return [];
  // group consecutive edges on the same walkway (connectors join the next run)
  const runs = [];
  for (const e of routeEdges) {
    const key = e.connector ? '__connector__' : e.walkway;
    const last = runs[runs.length - 1];
    if (last && last.key === key) {
      last.length += e.length;
      for (const c of e.geometry) if (!sameCoord(last.coords[last.coords.length - 1], c)) last.coords.push(c);
    } else {
      runs.push({ key, name: e.connector ? 'the connecting path' : e.walkwayName, length: e.length, coords: [...e.geometry] });
    }
  }
  // Fold very short runs (e.g. a 6 m hop through the gate plaza) into the
  // following run so directions are not cluttered with tiny steps.
  const MIN_STEP_M = 15;
  for (let i = runs.length - 2; i >= 0; i--) {
    if (runs[i].length < MIN_STEP_M) {
      const next = runs[i + 1];
      const merged = [...runs[i].coords];
      for (const c of next.coords) if (!sameCoord(merged[merged.length - 1], c)) merged.push(c);
      next.coords = merged;
      next.length += runs[i].length;
      runs.splice(i, 1);
    }
  }
  const steps = [];
  runs.forEach((run, i) => {
    const head = bearing(run.coords[0], pointAhead(run.coords, i === 0 ? 20 : 8));
    if (i === 0) {
      steps.push({
        type: 'depart',
        instruction: `Head ${cardinal(head)} along ${run.name}`,
        distance: run.length,
        location: run.coords[0],
      });
      return;
    }
    const prev = runs[i - 1];
    const inBearing = bearing(pointBack(prev.coords, 8), prev.coords[prev.coords.length - 1]);
    const delta = ((head - inBearing + 540) % 360) - 180;
    const t = turnPhrase(delta);
    steps.push({
      type: t.type,
      instruction: `${t.text} onto ${run.name}`,
      distance: run.length,
      location: run.coords[0],
    });
  });
  const lastRun = runs[runs.length - 1];
  steps.push({
    type: 'arrive',
    instruction: 'You have arrived at your destination',
    distance: 0,
    location: lastRun.coords[lastRun.coords.length - 1],
  });
  steps.totalDistance = totalDistance;
  return steps;
}

// ---------------------------------------------------------------------------
// Connectivity analysis (used by Graph mode and the verify script)
// ---------------------------------------------------------------------------
export function analyzeConnectivity(graph = campusGraph) {
  const adj = new Map(graph.nodes.map((n) => [n.id, new Set()]));
  for (const e of graph.edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }
  const seen = new Set();
  const components = [];
  for (const n of graph.nodes) {
    if (seen.has(n.id)) continue;
    const comp = [];
    const stack = [n.id];
    seen.add(n.id);
    while (stack.length) {
      const c = stack.pop();
      comp.push(c);
      for (const nb of adj.get(c) ?? []) if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
    }
    components.push(comp);
  }
  components.sort((x, y) => y.length - x.length);
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    componentCount: components.length,
    components,
    isolatedNodes: graph.nodes.filter((n) => adj.get(n.id).size === 0).map((n) => n.id),
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
export const formatDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
export function formatDuration(seconds) {
  const min = Math.max(1, Math.round(seconds / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

// Shared default instance
export const campusRouter = createCampusRouter();
export default campusRouter;