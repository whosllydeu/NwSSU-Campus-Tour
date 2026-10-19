import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const R = 6371000;
const D2R = Math.PI / 180;

// Flat x/y in metres around a reference latitude (accurate enough for a campus).
const toXY = ([lat, lng], refLat) => [
  lng * D2R * R * Math.cos(refLat * D2R),
  lat * D2R * R,
];

/**
 * Where is the user along the route?
 * Returns { offRoute, remaining } in metres:
 *   offRoute  = distance from the user to the closest point of the route line
 *   remaining = walking distance left from that closest point to the end
 */
export function routeProgress(coords, point) {
  if (!coords || coords.length < 2 || !point) return null;
  const refLat = point[0];
  const p = toXY(point, refLat);
  const pts = coords.map((c) => toXY(c, refLat));

  const segLen = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segLen.push(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]));
  }

  let best = { dist: Infinity, seg: 0, t: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2)) : 0;
    const d = Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy));
    if (d < best.dist) best = { dist: d, seg: i, t };
  }

  let remaining = segLen[best.seg] * (1 - best.t);
  for (let i = best.seg + 1; i < segLen.length; i++) remaining += segLen[i];
  return { offRoute: best.dist, remaining };
}

/**
 * Cuts the route where the user is.
 * Returns { walked, ahead, remaining, offRoute }:
 *   walked    = the part already passed (start → user's spot on the line)
 *   ahead     = the part still to walk (user's spot → destination)
 *   remaining = metres left along the line
 *   offRoute  = metres between the user and the line
 */
export function splitRoute(coords, point) {
  if (!coords || coords.length < 2 || !point) return null;
  const refLat = point[0];
  const p = toXY(point, refLat);
  const pts = coords.map((c) => toXY(c, refLat));

  let best = { dist: Infinity, seg: 0, t: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2)) : 0;
    const d = Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy));
    if (d < best.dist) best = { dist: d, seg: i, t };
  }

  const a = coords[best.seg];
  const b = coords[best.seg + 1];
  const cut = [a[0] + (b[0] - a[0]) * best.t, a[1] + (b[1] - a[1]) * best.t];

  const walked = [...coords.slice(0, best.seg + 1), cut];
  const ahead = [cut, ...coords.slice(best.seg + 1)];

  let remaining = 0;
  for (let i = 0; i < ahead.length - 1; i++) {
    const u = toXY(ahead[i], refLat);
    const v = toXY(ahead[i + 1], refLat);
    remaining += Math.hypot(v[0] - u[0], v[1] - u[1]);
  }
  return { walked, ahead, remaining, offRoute: best.dist };
}

/** Keeps the map centred on the user while live tracking is on. */
export function LiveFollower({ position }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!position) return;
    if (first.current) {
      first.current = false;
      map.setView(position, Math.max(map.getZoom(), 19));
    } else {
      map.panTo(position, { animate: true });
    }
  }, [position, map]);
  return null;
}