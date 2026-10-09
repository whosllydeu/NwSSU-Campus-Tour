// ============================================================
// tourGraph.js — turns the human-friendly tour data in
// static/tourNodes.js into the node graph Photo Sphere Viewer's
// VirtualTourPlugin expects (the same shape the CAT tour used):
//
//   { id, panorama, name, caption,
//     links: [{ nodeId, position: { yaw: '90deg', pitch: '0deg' } }],
//     markers: [...], data: { tour, yaw, gps, office, ... } }
//
// You normally never edit this file. Add/tune panoramas in
// static/tourNodes.js instead.
//
// ALL ANGLES IN THIS PROJECT ARE DEGREES, measured the Photo
// Sphere Viewer way: 0 = centre of the panorama image, +90 = a
// quarter-turn to the right, -90 = a quarter-turn to the left,
// 180 = directly behind the image centre. Turn on the 🧭 button in
// the tour to read the live yaw of any node.
// ============================================================

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const IS_DEV = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

// Relative angle of each named direction from a node's forward yaw.
const DIR_OFFSET = { forward: 0, right: 90, back: 180, left: -90 };
const DIR_FALLBACK_ORDER = ['forward', 'right', 'left', 'back'];
// Two arrows closer than this on the same node count as overlapping.
const MIN_ARROW_GAP = 25;

/** Wraps any angle to the range (-180, 180]. */
export const normDeg = (deg) => {
  const x = ((((deg + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};

/** Smallest absolute difference between two angles, in degrees. */
export const angleGap = (a, b) => Math.abs(normDeg(a - b));

/** Accepts 90, '90', '90deg' or '1.57rad' — always returns degrees. */
export const toDeg = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const s = String(value).trim().toLowerCase();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return s.endsWith('rad') ? (n * 180) / Math.PI : n;
};

const warn = (...args) => { if (IS_DEV) console.warn('[tour]', ...args); };

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Yaw (degrees) of a named direction ('forward' | 'back' | 'left' | 'right') at a node. */
function dirYaw(node, dir) {
  const d = node.data;
  if (dir === 'back' && d.backYaw !== null) return normDeg(d.backYaw);
  return normDeg(d.yaw + (DIR_OFFSET[dir] ?? 0));
}

function findFreeYaw(node, preferredDir) {
  const order = [preferredDir, ...DIR_FALLBACK_ORDER.filter((d) => d !== preferredDir)];
  for (const dir of order) {
    const y = dirYaw(node, dir);
    if (node.links.every((l) => angleGap(l.data.yaw, y) >= MIN_ARROW_GAP)) return { yaw: y, dir };
  }
  return { yaw: dirYaw(node, preferredDir), dir: preferredDir };
}

/**
 * Builds the whole campus graph.
 * @param {Array} tourDefs     tours from static/tourNodes.js
 * @param {Array} connections  cross-tour connections from static/tourNodes.js
 */
export function buildTourGraph(tourDefs, connections = []) {
  const tours = {};
  const aliases = {};
  const byId = {};
  const nodes = [];

  // 1) Create every node ------------------------------------------------
  for (const t of tourDefs) {
    const kind = t.kind || (t.id.startsWith('path-') ? 'pathway' : 'building');
    tours[t.id] = {
      id: t.id,
      kind,
      title: t.title,
      subtitle: t.subtitle || '',
      startNode: t.startNode || t.nodes[0]?.id || null,
      nodeIds: [],
    };
    (t.aliases || []).forEach((a) => { aliases[a] = t.id; });

    for (const n of t.nodes) {
      if (byId[n.id]) { warn(`Duplicate node id "${n.id}" — skipped.`); continue; }
      const file = n.file || (t.fileFor ? t.fileFor(n.id) : `${n.id}${t.ext || '.jpg'}`);
      const yaw = toDeg(n.yaw);
      const node = {
        id: n.id,
        panorama: `${BASE}panoramas/${t.folder}/${file}`,
        name: n.name || t.defaultName || t.title,
        caption: n.caption || t.subtitle || t.title,
        links: [],
        markers: [],
        data: {
          tour: t.id,
          yaw: yaw ?? 0,
          yawIsDefault: yaw === null,
          backYaw: toDeg(n.backYaw),
          gps: Array.isArray(n.gps) && n.gps.length >= 2 ? n.gps : null, // [lat, lng]
          star: Boolean(n.star),
          office: n.office || null,
        },
      };
      byId[n.id] = node;
      nodes.push(node);
      tours[t.id].nodeIds.push(n.id);
    }
  }

  const addLink = (node, targetId, yaw, extra = {}) => {
    if (!byId[targetId]) { warn(`Node "${node.id}" links to unknown node "${targetId}".`); return; }
    if (targetId === node.id) return;
    if (node.links.some((l) => l.nodeId === targetId)) return; // one arrow per destination
    node.links.push({
      nodeId: targetId,
      position: { yaw: `${Math.round(normDeg(yaw) * 10) / 10}deg`, pitch: '0deg' },
      data: { yaw: normDeg(yaw), ...extra },
    });
  };

  // 2) Explicit per-node links, then automatic forward/back links --------
  for (const t of tourDefs) {
    for (const n of t.nodes) {
      const node = byId[n.id];
      if (!node) continue;
      for (const l of n.links || []) {
        const target = l.nodeId || l.to;
        let yaw = toDeg(l.yaw ?? l.position?.yaw);
        if (yaw === null) yaw = dirYaw(node, l.dir || 'forward');
        addLink(node, target, yaw, { dir: l.dir || null });
      }
    }
    if (t.sequential === false) continue;
    t.nodes.forEach((n, i) => {
      const node = byId[n.id];
      if (!node) return;
      const next = 'next' in n ? n.next : t.nodes[i + 1]?.id;
      const prev = 'prev' in n ? n.prev : t.nodes[i - 1]?.id;
      if (next) addLink(node, next, dirYaw(node, 'forward'), { dir: 'forward' });
      if (prev) addLink(node, prev, dirYaw(node, 'back'), { dir: 'back' });
    });
  }

  // 3) Cross-tour connections (pathway ↔ building ↔ pathway) -------------
  const labelFor = (target) => {
    const t = tours[target.data.tour];
    if (!t) return 'Continue';
    return t.kind === 'pathway' ? `Walk: ${t.title}` : `Enter ${t.title}`;
  };
  for (const c of connections) {
    const a = byId[c.from];
    const b = byId[c.to];
    if (!a || !b) { warn(`Connection ${c.from} → ${c.to} skipped (unknown node).`); continue; }

    const place = (node, explicitYaw, dir) => {
      const y = toDeg(explicitYaw);
      if (y !== null) return y;
      const free = findFreeYaw(node, dir);
      if (free.dir !== dir) warn(`"${node.id}": '${dir}' arrow overlapped another arrow, used '${free.dir}' instead — set an exact yaw in CONNECTIONS.`);
      return free.yaw;
    };

    addLink(a, b.id, place(a, c.fromYaw, c.fromDir || 'forward'), { cross: true, label: c.label || labelFor(b) });
    if (!c.oneWay) {
      addLink(b, a.id, place(b, c.toYaw, c.toDir || 'back'), { cross: true, label: c.returnLabel || labelFor(a) });
    }
  }

  // 4) Floating "Enter …" pins for cross-tour links + overlap check ------
  for (const node of nodes) {
    node.links.forEach((l, i) => {
      node.links.slice(i + 1).forEach((o) => {
        if (angleGap(l.data.yaw, o.data.yaw) < 12) warn(`"${node.id}": arrows to "${l.nodeId}" and "${o.nodeId}" overlap — adjust a yaw.`);
      });
      if (!l.data.cross) return;
      node.markers.push({
        id: `go:${node.id}>${l.nodeId}`,
        position: { yaw: `${l.data.yaw}deg`, pitch: '-4deg' },
        html: `<span class="tour-enter-pin"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 7.3 12.28a1 1 0 0 0 1.4 0C13 22 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="currentColor"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>${escapeHtml(l.data.label)}</span>`,
        anchor: 'bottom center',
        data: { goto: l.nodeId },
      });
    });
  }

  return { tours, aliases, nodes, byId };
}

/** Shortest walk (fewest panoramas) between two nodes, or null. */
export function shortestPath(byId, fromId, toId) {
  if (!byId[fromId] || !byId[toId]) return null;
  if (fromId === toId) return [fromId];
  const prev = { [fromId]: null };
  const queue = [fromId];
  while (queue.length) {
    const id = queue.shift();
    for (const l of byId[id].links) {
      if (l.nodeId in prev) continue;
      prev[l.nodeId] = id;
      if (l.nodeId === toId) {
        const path = [toId];
        let cur = id;
        while (cur !== null) { path.unshift(cur); cur = prev[cur]; }
        return path;
      }
      queue.push(l.nodeId);
    }
  }
  return null;
}

const metersBetween = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Closest node that has GPS coordinates, within maxMeters. */
export function nearestNode(nodes, latLng, maxMeters = Infinity) {
  if (!latLng) return null;
  let best = null;
  for (const n of nodes) {
    if (!n.data.gps) continue;
    const distance = metersBetween(latLng, n.data.gps);
    if (distance <= maxMeters && (!best || distance < best.distance)) best = { node: n, distance };
  }
  return best;
}