// ============================================================
// tourNodes.js — THE single source of truth for every 360°
// panorama on campus (buildings AND outdoor pathways).
//
// The tour DATA now lives in one file per tour under static/tours/:
//   tours/buildings/<building>.js   e.g. tours/buildings/coed.js
//   tours/pathways/<pathway>.js     e.g. tours/pathways/gate-coed.js
//   tours/connections.js            links between tours
//   tours/walkRoutes.js             "Walk there!" + "Walk …" buttons
//   tours/index.js                  list of all tours
// This file only assembles them and keeps the same exports, so
// nothing else in the app needs to change. The logic that turns the
// data into the Photo Sphere Viewer graph is in utils/tourGraph.js.
//
// ─── QUICK GUIDE ─────────────────────────────────────────────
// ANGLES are degrees, Photo Sphere Viewer style:
//     0 = centre of the photo, 90 = quarter-turn right,
//   -90 = quarter-turn left, 180 = directly behind the centre.
// To read a yaw: open the tour, tap 🧭, turn until the doorway/
// path is in the middle of the screen, read "yaw". Tapping the
// panorama while 🧭 is on also prints a ready-to-paste link in the
// browser console.
//
// A NODE (one panorama photo):
//   { id: 'ccis-08',            // = file name without extension
//     name: 'Hallway',          // title shown at the bottom right
//     caption: 'CCIS · Ground Floor',
//     yaw: 90,                  // direction you WALK FORWARD in this
//                               //   photo (also the default view)
//     gps: [12.0712, 124.5954], // [latitude, longitude] or GPS_TODO
//     star: true, office: { name, text },          // optional
//     next: 'ccis-10' | null,   // optional: override/disable the
//     prev: 'ccis-06' | null,   //   automatic forward/back link
//     backYaw: 200,             // optional: exact "turn around" yaw
//     links: [                  // optional extra arrows:
//       { nodeId: 'ccis-12', dir: 'left' },               // relative to yaw
//       { nodeId: 'ccis-13', position: { yaw: '75deg', pitch: '0deg' } }, // exact (CAT style)
//     ] }
//
// A TOUR with `sequential: true` (the default) automatically links
// each node to the next one (forward arrow at `yaw`) and back to the
// previous one (back arrow at `yaw + 180`). So for a normal hallway
// you only set `yaw` per photo. The CAT tour below uses
// `sequential: false` and spells out every link by hand — both
// styles produce the exact same node format.
//
// Cross-building / pathway connections go in tours/connections.js.
// "Walk there!" destinations go in tours/walkRoutes.js.
//
// COORDINATES: every `gps: GPS_TODO` still needs real coordinates.
// Search the tours/ folder for GPS_TODO and replace it with [lat, lng].
// Nothing breaks while they are missing — GPS is only used to pick
// the closest starting panorama for "Walk there!".
// Lines marked `// TODO yaw` were never tuned (old heading was 0
// or missing) — tune them with the 🧭 readout.
// ============================================================
import { buildTourGraph } from '../utils/tourGraph';
import {
  TOUR_DEFS,
  CONNECTIONS,
  WALK_DEFAULT_START,
  WALK_ROUTES,
  PATH_LINKS,
} from './tours';

// Re-exported so existing imports (nwssuTour.js etc.) keep working.
export { CONNECTIONS, WALK_DEFAULT_START, WALK_ROUTES, PATH_LINKS, TOUR_DEFS };

export const TOUR_GRAPH = buildTourGraph(TOUR_DEFS, CONNECTIONS);

// Back-compat: per-tour node arrays (old `nwssuTourNodes.cat` shape).
export const nwssuTourNodes = Object.fromEntries(
  Object.values(TOUR_GRAPH.tours).map((t) => [t.id, t.nodeIds.map((id) => TOUR_GRAPH.byId[id])])
);
