import { TOUR_GRAPH } from '../static/tourNodes';
import { resetTourCaches } from '../static/nwssuTour';
import { enterPinHtml, normDeg } from './tourGraph';
import { hiddenNodeIds } from './adminTours';

const { byId, tours } = TOUR_GRAPH;

const ORIGINAL = {};
for (const node of TOUR_GRAPH.nodes) {
  ORIGINAL[node.id] = {
    yaw: node.data.yaw,
    links: node.links.map((l) => ({ ...l, position: { ...l.position }, data: { ...l.data } })),
    markers: (node.markers || []).map((m) => ({ ...m })),
    office: node.data.office || null,
  };
}

export const isStaticNode = (nodeId) => Boolean(ORIGINAL[nodeId]);

const BASE = {};
const snapshot = (node) => ({
  yaw: node.data.yaw,
  links: node.links.map((l) => ({ ...l, position: { ...l.position }, data: { ...l.data } })),
  markers: (node.markers || []).map((m) => ({ ...m })),
  office: node.data.office || null,
});

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Label pill; when opened, its description drops down right below it.
const labelPinHtml = (name, text, open = false) =>
  `<div class="tour-label${open ? ' is-open' : ''}">` +
  `<span class="tour-label-pin"><span class="tour-label-i">i</span>${escapeHtml(name)}</span>` +
  (open && text ? `<span class="tour-label-desc">${escapeHtml(text)}</span>` : '') +
  '</div>';

export function baseArrows(nodeId) {
  const node = byId[nodeId];
  const o = ORIGINAL[nodeId] || BASE[nodeId] || (node ? snapshot(node) : null);
  if (!o) return { yaw: 0, links: [] };
  const links = o.links.map((l) => ({ to: l.nodeId, yaw: Math.round(normDeg(l.data.yaw) * 10) / 10 }));
  if (ORIGINAL[nodeId] && node) {
    node.links
      .filter((l) => String(l.nodeId).startsWith('admin-') && !links.some((x) => x.to === l.nodeId))
      .forEach((l) => links.push({ to: l.nodeId, yaw: Math.round(normDeg(l.data.yaw) * 10) / 10 }));
  }
  return { yaw: o.yaw, links };
}

export const originalArrows = baseArrows;

const labelFor = (target) => {
  const t = tours[target?.data?.tour];
  if (!t) return 'Continue';
  return t.kind === 'pathway' ? `Walk: ${t.title}` : `Enter ${t.title}`;
};

let applied = new Set();

function restore(nodeId) {
  const node = byId[nodeId];
  const o = ORIGINAL[nodeId];
  if (!node || !o) return;
  node.data.yaw = o.yaw;
  node.links = o.links.map((l) => ({ ...l, position: { ...l.position }, data: { ...l.data } }));
  node.markers = o.markers.map((m) => ({ ...m }));
  node.data.office = o.office;
}

function applyOne(override) {
  const node = byId[override.nodeId];
  if (!node) return false;
  if (!ORIGINAL[override.nodeId] && !BASE[override.nodeId]) BASE[override.nodeId] = snapshot(node);
  const o = ORIGINAL[override.nodeId] || BASE[override.nodeId];
  const before = node.links;

  if (override.yaw !== null && override.yaw !== undefined) node.data.yaw = normDeg(override.yaw);

  const seen = new Set();
  node.links = [];
  for (const l of override.links || []) {
    const target = byId[l.to];
    if (!target || l.to === node.id || seen.has(l.to) || hiddenNodeIds.has(l.to)) continue;
    seen.add(l.to);
    const before = o.links.find((x) => x.nodeId === l.to);
    const cross = target.data.tour !== node.data.tour;
    const yaw = normDeg(Number(l.yaw));
    node.links.push({
      nodeId: l.to,
      position: { yaw: `${Math.round(yaw * 10) / 10}deg`, pitch: '0deg' },
      data: {
        ...(before ? before.data : { dir: null }),
        yaw,
        ...(cross ? { cross: true, label: before?.data?.label || labelFor(target) } : {}),
      },
    });
  }
  for (const l of before) {
    if (String(l.nodeId).startsWith('admin-') && !seen.has(l.nodeId) && l.nodeId !== node.id && ORIGINAL[node.id]) {
      seen.add(l.nodeId);
      node.links.push(l);
    }
  }

  const prefix = `go:${node.id}>`;
  node.markers = (o.markers || []).filter((m) => !String(m.id).startsWith(prefix));
  for (const l of node.links) {
    if (!l.data.cross) continue;
    node.markers.push({
      id: `${prefix}${l.nodeId}`,
      position: { yaw: `${l.data.yaw}deg`, pitch: '-4deg' },
      html: enterPinHtml(l.data.label),
      anchor: 'bottom center',
      data: { goto: l.nodeId },
    });
  }

  // Place labels (offices / facilities the photo passes by)
  const labels = override.labels || [];
  labels.forEach((lb, i) => {
    node.markers.push({
      id: `label:${node.id}:${i}`,
      position: { yaw: `${normDeg(Number(lb.yaw))}deg`, pitch: '9deg' },
      html: labelPinHtml(lb.name, lb.text),
      anchor: 'top center',
      data: {
        label: true,
        htmlClosed: labelPinHtml(lb.name, lb.text),
        htmlOpen: labelPinHtml(lb.name, lb.text, true),
        hasText: Boolean(lb.text),
      },
    });
  });
  node.data.office = o.office || (labels[0] ? { name: labels[0].name, text: labels[0].text || '' } : null);
  return true;
}

export function applyTourOverrides(overrides = []) {
  applied.forEach(restore);
  applied = new Set();
  for (const ov of overrides || []) {
    if (applyOne(ov)) applied.add(ov.nodeId);
  }
  resetTourCaches();
  return applied.size;
}