// ============================================================
// tourNodes.js — THE single source of truth for every 360°
// panorama on campus (buildings AND outdoor pathways).
//
// Everything here is plain data. The logic that turns it into the
// Photo Sphere Viewer node graph lives in utils/tourGraph.js, so
// you and your groupmate only ever need to edit THIS file.
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
// Cross-building / pathway connections go in CONNECTIONS (bottom).
// "Walk there!" destinations go in WALK_ROUTES (bottom).
//
// COORDINATES: every `gps: GPS_TODO` still needs real coordinates.
// Search this file for GPS_TODO and replace it with [lat, lng].
// Nothing breaks while they are missing — GPS is only used to pick
// the closest starting panorama for "Walk there!".
// Lines marked `// TODO yaw` were never tuned (old heading was 0
// or missing) — tune them with the 🧭 readout.
// ============================================================
import { buildTourGraph } from '../utils/tourGraph';

// Placeholder for missing coordinates — replace with [lat, lng].
const GPS_TODO = null;

// ============================================================
// BUILDING TOURS
// ============================================================

// ── CAT — the reference tour. Links are hand-authored exactly as
// in the original CAT graph (old ids building-1…18 → cat-01…18).
const CAT = {
  id: 'cat',
  title: 'College of Agriculture & Technology Building',
  subtitle: 'Ground & 2nd Floor',
  folder: 'cat',
  sequential: false,
  nodes: [
    { id: 'cat-01', name: 'Covered Walkway (Near Bleachers)', caption: 'CAT · Ground Floor', yaw: 3, gps: [12.071104, 124.595427],
      links: [
        { nodeId: 'cat-02', position: { yaw: '0deg', pitch: '0deg' } }, // pitch was "180deg" (invalid) — set to 0
      ] },
    { id: 'cat-02', name: 'Covered Walkway (Near Bleachers)', caption: 'CAT · Ground Floor', yaw: -7, gps: [12.071246, 124.595470],
      links: [
        { nodeId: 'cat-01', position: { yaw: '180deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-03', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071311, 124.595526],
      links: [
        { nodeId: 'cat-02', position: { yaw: '-90deg', pitch: '0deg' } },
        { nodeId: 'cat-18', position: { yaw: '0deg', pitch: '0deg' } },
        { nodeId: 'cat-04', position: { yaw: '90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-04', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071353, 124.595529],
      links: [
        { nodeId: 'cat-05', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '-90deg', pitch: '0deg' } }, // added: back link was missing
      ] },
    { id: 'cat-05', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071443, 124.595596],
      links: [
        { nodeId: 'cat-06', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-06', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-07', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-05', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-07', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-08', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-06', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-08', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 95, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-09', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-07', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-09', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 99, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-08', position: { yaw: '-90deg', pitch: '0deg' } },
        { nodeId: 'cat-10', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-10', name: 'Ground Floor Area', caption: 'CAT · Ground Floor → 2nd Floor', yaw: 95, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-09', position: { yaw: '-40deg', pitch: '0deg' } },
        { nodeId: 'cat-11', position: { yaw: '40deg', pitch: '0deg' } },
      ] },
    { id: 'cat-11', name: '2nd Floor Landing', caption: 'CAT · 2nd Floor', yaw: -90, gps: GPS_TODO, // yaw follows its link to cat-12
      links: [
        { nodeId: 'cat-10', position: { yaw: '0deg', pitch: '0deg' } },
        { nodeId: 'cat-12', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-12', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-11', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-13', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-13', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-12', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-14', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-14', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -12, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-13', position: { yaw: '-180deg', pitch: '0deg' } },
        { nodeId: 'cat-15', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-15', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-14', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-16', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-16', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-15', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-17', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-17', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-16', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-18', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-18', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: 40, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-17', position: { yaw: '-40deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '40deg', pitch: '0deg' } },
      ] },
  ],
};

const CCIS = {
  id: 'ccis',
  title: 'CCIS Building',
  subtitle: 'Ground Floor',
  folder: 'ccis',
  nodes: [
    { id: 'ccis-01', name: 'Stairwell to Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-02', name: 'Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-03', name: 'Management Information System (MIS) Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'MIS Office', text: 'The Management Information System (MIS) Office handles the college’s records, enrollment data, and information systems.' } },
    { id: 'ccis-04', name: 'CCIS Faculty Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO,
      office: { name: 'CCIS Faculty Office', text: 'Workspace for CCIS faculty, used for consultations and program coordination.' } },
    { id: 'ccis-05', name: 'Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-06', name: 'Faculty Room', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'Faculty Room', text: 'The CCIS Faculty Room — staff workspace and student consultation area.' } },
    { id: 'ccis-07', name: 'CCIS Dean\'s Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'CCIS Dean\'s Office', text: 'Office of the College Dean, College of Computing and Information Sciences.' } },
    { id: 'ccis-08', name: 'Middle Stairwell Landing', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-09', name: 'Conference Room (to Middle Stairwell)', caption: 'CCIS · Ground Floor → 2nd Floor', yaw: -5, gps: GPS_TODO },
  ],
};

const CON = {
  id: 'con',
  title: 'College of Nursing Building',
  subtitle: 'Ground Floor',
  folder: 'co_n',
  nodes: [
    { id: 'con-01', name: 'Entrance & Stairwell', caption: 'College of Nursing · Ground Floor', yaw: 26, gps: GPS_TODO },
    { id: 'con-02', name: 'Stairwell Landing', caption: 'College of Nursing · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'con-03', name: 'Hallway', caption: 'College of Nursing · Ground Floor', yaw: 102, gps: GPS_TODO },
    { id: 'con-04', name: 'Faculty Exit / Anatomy & Physiology Lab', caption: 'College of Nursing · Ground Floor', yaw: 95, gps: GPS_TODO, star: true,
      office: { name: 'Anatomy & Physiology Lab', text: 'Laboratory used for anatomy and physiology classes, accessible through the faculty exit hallway.' } },
    { id: 'con-05', name: 'Nursing Classroom 1', caption: 'College of Nursing · Ground Floor', yaw: 95, gps: GPS_TODO, star: true,
      office: { name: 'Nursing Classroom 1', text: 'Lecture room for College of Nursing classes.' } },
    { id: 'con-06', name: 'Nursing Classroom 2', caption: 'College of Nursing · Ground Floor', yaw: 76, gps: GPS_TODO, star: true,
      office: { name: 'Nursing Classroom 2', text: 'Lecture room for College of Nursing classes.' } },
    { id: 'con-07', name: 'Hallway (Toward CCIS Building)', caption: 'College of Nursing · Ground Floor → CCIS Building', yaw: 90, gps: GPS_TODO },
    { id: 'con-08', name: 'Hallway to 3rd Floor Stairs', caption: 'College of Nursing · Ground Floor', yaw: -23, gps: GPS_TODO },
    { id: 'con-09', name: 'Stairs to 3rd Floor', caption: 'College of Nursing · Ground Floor → 3rd Floor', yaw: -60, gps: GPS_TODO },
    { id: 'con-10', name: 'Central Supply Room', caption: 'College of Nursing · 3rd Floor', yaw: 0, gps: GPS_TODO, star: true,
      office: { name: 'Central Supply Room', text: 'Supply room located at the end of the 3rd floor hallway.' } }, // TODO yaw
  ],
};

const ADMIN = {
  id: 'president',
  title: 'Administration Building',
  subtitle: 'Ground Floor',
  folder: 'admin',
  nodes: [
    // { id: 'admin-01', name: 'Pathway from Auxiliary Building', caption: 'Auxiliary Building → Administration Building', yaw: 0, gps: GPS_TODO },
    { id: 'admin-02', name: 'Approach to Admin Building', caption: 'Auxiliary Building → Administration Building', yaw: -89, gps: GPS_TODO },
    { id: 'admin-03', name: 'Administration Building Entrance', caption: 'Auxiliary Building → Administration Building', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'admin-04', name: 'Records Office', caption: 'Administration Building · Ground Floor', yaw: 0, gps: GPS_TODO, star: true,
      office: { name: 'Records Office', text: 'Handles student and personnel records for the Administration Building.' } }, // TODO yaw
    { id: 'admin-05', name: 'Stairs to Admin Office', caption: 'Administration Building · Ground Floor → Upper Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'admin-06', name: 'Stairwell Landing (Toward Admin Office)', caption: 'Administration Building · Upper Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const COED = {
  id: 'coed',
  title: 'College of Education Building',
  subtitle: 'Ground to 4th Floor',
  folder: 'coed',
  nodes: [
    { id: 'coed-01', name: 'COED Building Approach', caption: 'College of Education · Exterior', yaw: 89, gps: GPS_TODO },
    { id: 'coed-02', name: 'COED Building Facade', caption: 'College of Education · Exterior', yaw: 89, gps: GPS_TODO },
    { id: 'coed-03', name: 'COED Building Facade', caption: 'College of Education · Exterior', yaw: 89, gps: GPS_TODO },
    { id: 'coed-04', name: 'COED Building Corner', caption: 'College of Education · Exterior', yaw: 89, gps: GPS_TODO },
    // { id: 'coed-05', name: 'COED Parking Area', caption: 'College of Education · Exterior', yaw: 0, gps: GPS_TODO },
    // { id: 'coed-06', name: 'Pathway to Alumni Building', caption: 'College of Education → Alumni Building', yaw: 0, gps: GPS_TODO },
    { id: 'coed-07', name: 'Entrance Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-08', name: 'Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-09', name: 'Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-10', name: 'Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-11', name: 'Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-12', name: 'Stairwell to 2nd Floor', caption: 'College of Education · Ground Floor → 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-13', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-14', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-15', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-16', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-17', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-18', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-19', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-20', name: 'Hallway', caption: 'College of Education · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-21', name: 'Stairwell to 3rd Floor', caption: 'College of Education · 2nd Floor → 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-22', name: 'Stairwell to 3rd Floor', caption: 'College of Education · 2nd Floor → 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-23', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-24', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-25', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-26', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-27', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-28', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-29', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-30', name: 'Hallway', caption: 'College of Education · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-31', name: 'Stairwell to 4th Floor', caption: 'College of Education · 3rd Floor → 4th Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-32', name: 'Hallway', caption: 'College of Education · 4th Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-33', name: 'Hallway', caption: 'College of Education · 4th Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-34', name: 'Hallway', caption: 'College of Education · 4th Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-35', name: 'Hallway', caption: 'College of Education · 4th Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-36', name: 'Stairwell Going Down', caption: 'College of Education · 4th Floor → 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-37', name: 'Stairwell Going Down', caption: 'College of Education · 3rd Floor → 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-38', name: 'Stairwell Going Down', caption: 'College of Education · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-39', name: 'Ground Floor Hallway', caption: 'College of Education · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'coed-40', name: 'Back at the Courtyard', caption: 'College of Education · Exterior', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const CCJS = {
  id: 'ccjs',
  title: 'College of Criminal Justice & Science Building',
  subtitle: 'Ground to 3rd Floor',
  folder: 'ccjs',
  nodes: [
    { id: 'ccjs-01', name: 'Quadrangle (Between Wings)', caption: 'CCJS · Ground Floor', yaw: -31, gps: GPS_TODO },
    { id: 'ccjs-02', name: 'Covered Parking Walkway', caption: 'CCJS · Ground Floor', yaw: -31, gps: GPS_TODO },
    { id: 'ccjs-03', name: 'Covered Parking Walkway', caption: 'CCJS · Ground Floor', yaw: -1, gps: GPS_TODO },
    { id: 'ccjs-04', name: 'CAS Faculty Room', caption: 'CCJS · Ground Floor', yaw: -1, gps: GPS_TODO, star: true,
      office: { name: 'CAS Faculty Room', text: 'Faculty room located along the ground-floor walkway of the building.' } },
    { id: 'ccjs-05', name: 'Stairwell Landing', caption: 'CCJS · Ground Floor', yaw: 85, gps: GPS_TODO },
    { id: 'ccjs-06', name: 'Ground Floor (Utility Room Area)', caption: 'CCJS · Ground Floor', yaw: 86, gps: GPS_TODO },
    // { id: 'ccjs-07', name: 'Ground Floor (Utility Room Area)', caption: 'CCJS · Ground Floor → 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-08', name: 'Stairwell (Going Up to 2nd Floor)', caption: 'CCJS · Ground Floor → 2nd Floor', yaw: 14, gps: GPS_TODO },
    { id: 'ccjs-09', name: '2nd Floor Hallway', caption: 'CCJS · 2nd Floor', yaw: -92, gps: GPS_TODO },
    { id: 'ccjs-10', name: 'Criminology Laboratory', caption: 'CCJS · 2nd Floor', yaw: -93, gps: GPS_TODO, star: true,
      office: { name: 'Criminology Laboratory', text: 'Laboratory used for Criminology program classes and practicals.' } },
    { id: 'ccjs-11', name: 'ACAD 03', caption: 'CCJS · 2nd Floor', yaw: -91, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 03', text: 'Faculty/academic room on the 2nd floor of the CCJS building.' } },
    { id: 'ccjs-12', name: 'ACAD 01 / DEVCOM Lab (Campus Radio)', caption: 'CCJS · 2nd Floor', yaw: -95, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 01 / DEVCOM Lab', text: 'Academic room that also houses the campus radio station, DYNW 89.5 Kauswagan Radio.' } },
    { id: 'ccjs-13', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-14', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: -6, gps: GPS_TODO },
    { id: 'ccjs-15', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-16', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: -2, gps: GPS_TODO },
    { id: 'ccjs-17', name: 'Wash Area (2nd Floor, Other Side)', caption: 'CCJS · 2nd Floor', yaw: 94, gps: GPS_TODO },
    { id: 'ccjs-18', name: 'Stairwell to 3rd Floor', caption: 'CCJS · 2nd Floor → 3rd Floor', yaw: 16, gps: GPS_TODO },
    { id: 'ccjs-19', name: 'Stairwell Landing (3rd Floor Arrival)', caption: 'CCJS · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'ccjs-20', name: 'ACAD 301', caption: 'CCJS · 3rd Floor', yaw: -88, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 301', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-21', name: 'ACAD 302', caption: 'CCJS · 3rd Floor', yaw: -91, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 302', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-22', name: 'ACAD 303', caption: 'CCJS · 3rd Floor', yaw: -90, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 303', text: 'Academic room on the 3rd floor, with crime-scene investigation exhibit boards displayed outside the door.' } },
    { id: 'ccjs-23', name: 'ACAD 304', caption: 'CCJS · 3rd Floor', yaw: -92, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 304', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-24', name: 'ACAD 305', caption: 'CCJS · 3rd Floor', yaw: -96, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 305', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-25', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -93, gps: GPS_TODO },
    { id: 'ccjs-26', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -4, gps: GPS_TODO },
    { id: 'ccjs-27', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -4, gps: GPS_TODO },
    { id: 'ccjs-28', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -2, gps: GPS_TODO },
    { id: 'ccjs-29', name: '3rd Floor Hallway (End, Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -3, gps: GPS_TODO },
    { id: 'ccjs-30', name: 'Stairwell Landing (Near Toilets)', caption: 'CCJS · 3rd Floor', yaw: -92, gps: GPS_TODO },
    { id: 'ccjs-31', name: 'Toilets', caption: 'CCJS · 3rd Floor', yaw: 180, gps: GPS_TODO },
  ],
};

// CEA branching (same behaviour as before):
// - cea-02 is the entry: forward jumps to Building 2 (cea-24), right
//   goes into the Building 1 ground-floor chain (cea-09).
// - cea-11 has a right turn into the stairwell (cea-18).
// - cea-14 / cea-22 / cea-32 / cea-36 are dead ends (next: null).
// - cea-31 is a left/right fork with no straight-ahead.
const CEA = {
  id: 'cea',
  title: 'College of Engineering & Architecture Building',
  subtitle: 'Building 1 & 2, Ground to 3rd Floor',
  folder: 'cea',
  nodes: [
    { id: 'cea-02', name: 'Entrance Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: -88, gps: GPS_TODO, next: 'cea-24', links: [{ nodeId: 'cea-09', dir: 'right' }] },
    // { id: 'cea-03', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-04', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-05', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-06', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-07', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-08', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-09', name: 'Hallway (Back to Center)', caption: 'CEA Building 1 · Ground Floor', yaw: -87, gps: GPS_TODO },
    { id: 'cea-10', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 1 · Ground Floor → 2nd Floor', yaw: 65, gps: GPS_TODO },
    { id: 'cea-11', name: 'Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 67, gps: GPS_TODO, links: [{ nodeId: 'cea-18', dir: 'right' }] },
    { id: 'cea-12', name: 'Classrooms Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-13', name: 'Classrooms Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 91, gps: GPS_TODO },
    { id: 'cea-14', name: 'Classrooms Hallway (End)', caption: 'CEA Building 1 · 2nd Floor', yaw: 174, gps: GPS_TODO, next: null },
    // { id: 'cea-15', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-16', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-17', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-18', name: 'Stairwell to 3rd Floor', caption: 'CEA Building 1 · 2nd Floor → 3rd Floor', yaw: -39, gps: GPS_TODO, prev: 'cea-11' },
    { id: 'cea-19', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: -62, gps: GPS_TODO },
    { id: 'cea-20', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 129, gps: GPS_TODO },
    { id: 'cea-21', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 175, gps: GPS_TODO },
    { id: 'cea-22', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: -6, gps: GPS_TODO, next: null, prev: 'cea-20' },
    // { id: 'cea-23', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-24', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: -46, gps: GPS_TODO, prev: 'cea-02' },
    { id: 'cea-25', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-26', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-27', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 1, gps: GPS_TODO },
    { id: 'cea-28', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: -32, gps: GPS_TODO },
    { id: 'cea-29', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 2 · Ground Floor → 2nd Floor', yaw: -5, gps: GPS_TODO },
    { id: 'cea-30', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 2 · Ground Floor → 2nd Floor', yaw: -40, gps: GPS_TODO },
    { id: 'cea-31', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO, next: null, links: [{ nodeId: 'cea-33', dir: 'left' }, { nodeId: 'cea-32', dir: 'right' }] }, // TODO yaw
    { id: 'cea-32', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 2, gps: GPS_TODO, next: null },
    { id: 'cea-33', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: -91, gps: GPS_TODO, prev: 'cea-31' },
    { id: 'cea-34', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 92, gps: GPS_TODO },
    { id: 'cea-35', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: -5, gps: GPS_TODO },
    { id: 'cea-36', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 2, gps: GPS_TODO, next: null },
    { id: 'cea-37', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-38', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-39', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-40', name: 'Stairwell Going Down', caption: 'CEA Building 2 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-41', name: 'Stairwell Going Down', caption: 'CEA Building 2 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-42', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-43', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-44', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-45', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-46', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-47', name: 'Hallway Toward COM Building', caption: 'CEA Building 2 → College of Management (COM)', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-48', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-49', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-50', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-51', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-52', name: 'Parking Area', caption: 'CEA Building 2 · Exterior / Parking', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const COM = {
  id: 'com',
  title: 'College of Management Building',
  subtitle: 'Building 1 & 2, Ground to 3rd Floor',
  folder: 'com',
  nodes: [
    { id: 'com-01', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-02', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-03', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-04', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-05', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-06', name: 'Faculty Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-07', name: 'Hallway', caption: 'COM Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-08', name: 'Hallway', caption: 'COM Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-09', name: 'Stairwell Going Down', caption: 'COM Building 1 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-10', name: 'Stairwell Going Down', caption: 'COM Building 1 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-11', name: 'Ground Floor Area', caption: 'COM Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-12', name: 'Hallway Toward Building 2', caption: 'COM Building 1 → COM Building 2', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-13', name: 'Hallway Toward Building 2', caption: 'COM Building 1 → COM Building 2', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-14', name: 'Ground Floor Area', caption: 'COM Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-15', name: 'Hallway', caption: 'COM Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-16', name: 'Hallway', caption: 'COM Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-17', name: 'Hallway', caption: 'COM Building 2 · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-18', name: 'Hallway', caption: 'COM Building 2 · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'com-19', name: 'Hallway', caption: 'COM Building 2 · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const LIBRARY = {
  id: 'library',
  aliases: ['lib'],
  title: 'NwSSU Library',
  subtitle: '',
  folder: 'library',
  nodes: [
    { id: 'lib-02', name: 'Stairwell Landing', caption: 'NwSSU Library', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'lib-03', name: 'Hallway', caption: 'NwSSU Library', yaw: 102, gps: GPS_TODO },
    { id: 'lib-01', name: 'Entrance & Stairwell', caption: 'NwSSU Library', yaw: 26, gps: GPS_TODO },
  ],
};

// ============================================================
// OUTDOOR PATHWAY TOURS — same format, just not tied to a building.
// ============================================================

const PATH_GATE_COED = {
  id: 'path-gate-coed',
  title: 'Gate → College of Education',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/gate-coed',
  ext: '.JPG',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-gate-coed-01', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-02', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-03', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-04', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-05', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-06', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-07', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-08', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-09', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-10', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-11', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-12', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-13', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-14', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-15', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-16', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-17', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-18', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-19', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-20', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-21', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-22', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-23', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-24', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-gate-coed-25', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

// NOTE: the connection list calls this pathway "ccis-alumni", but the
// image files on disk are still named pathway-coed-alumni-XX.JPG
// inside pathways/coed-alumni/. `fileFor` maps the new ids onto the
// existing files, so no image needs renaming. If you rename the
// folder/files later, delete `fileFor` and set folder accordingly.
const PATH_CCIS_ALUMNI = {
  id: 'path-ccis-alumni',
  aliases: ['path-coed-alumni'],
  title: 'CCIS → Alumni Building',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/coed-alumni',
  fileFor: (id) => `${id.replace('pathway-ccis-alumni', 'pathway-coed-alumni')}.JPG`,
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-ccis-alumni-01', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-02', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-03', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-04', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-05', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-06', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-07', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-08', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-09', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-10', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-11', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-12', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-13', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-14', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-15', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-16', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-17', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-18', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-19', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-20', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-21', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-22', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-23', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-24', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-25', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-26', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-27', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-28', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-29', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const PATH_GATE_CEA = {
  id: 'path-gate-cea',
  title: 'Gate → College of Engineering & Architecture',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/gate-cea',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-gate-cea-01', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-02', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-03', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-04', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-05', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-06', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-07', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-08', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-09', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-10', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-11', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-12', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-13', yaw: -9, gps: GPS_TODO },
    { id: 'pathway-gate-cea-14', yaw: -9, gps: GPS_TODO },
  ],
};

const PATH_LIBRARY_REGISTRAR = {
  id: 'path-library-registrar',
  title: 'Library → Registrar',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/library-registrar',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-library-registrar-01', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-02', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-03', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-04', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-05', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-06', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-07', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-08', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-09', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-10', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-library-registrar-11', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

const PATH_COM_SAS = {
  id: 'path-com-sas',
  title: 'College of Management → SAS',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/com-sas',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-com-sas-01', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-02', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-03', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-04', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-05', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-06', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-07', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-08', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-09', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-10', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-11', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-12', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-13', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-com-sas-14', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

// ============================================================
// CONNECTIONS — explicit node → node links between tours.
// Works for pathway→pathway, pathway→building, building→pathway
// and building→building, at ANY node (not just first/last).
//
//   from / to      node ids
//   fromDir        where the arrow sits on the `from` photo:
//                  'forward' | 'back' | 'left' | 'right' (relative
//                  to that node's yaw)       — or fromYaw: 75 (exact)
//   toDir / toYaw  where the RETURN arrow sits on the `to` photo
//                  (default 'back')
//   oneWay: true   no return arrow
//   label          text on the floating pin (default "Enter <building>")
//
// Each connection is two-way unless oneWay is set, so a pathway can
// be walked in both directions without duplicating data.
// If a requested direction would overlap an existing arrow, the
// builder picks the next free side and logs a console warning in
// dev — replace the guess with an exact fromYaw/toYaw when tuning.
// All dirs marked TODO are best guesses until tuned on-site.
// ============================================================
export const CONNECTIONS = [
  // 1
  { from: 'pathway-library-registrar-01', to: 'lib-02', fromDir: 'back', toDir: 'back' },
  // 2
  { from: 'pathway-library-registrar-11', to: 'pathway-ccis-alumni-01', fromDir: 'forward', toDir: 'back' },
  // 3
  { from: 'pathway-library-registrar-10', to: 'con-02', fromDir: 'left', toDir: 'right' }, // TODO tune
  // 4
  { from: 'pathway-gate-coed-14', to: 'coed-07', fromDir: 'left', toDir: 'right' }, // TODO tune toDir
  // 5
  { from: 'pathway-ccis-alumni-27', to: 'pathway-gate-coed-25', fromDir: 'left', toDir: 'forward' }, // TODO tune fromDir
  // 6
  { from: 'pathway-ccis-alumni-09', to: 'ccis-08', fromDir: 'left', toDir: 'right' }, // TODO tune
  // 7 + 8 — enter CCJS from node 25, leave CCJS toward node 26
  { from: 'pathway-ccis-alumni-25', to: 'ccjs-06', fromDir: 'left', oneWay: true }, // TODO tune
  { from: 'ccjs-06', to: 'pathway-ccis-alumni-26', fromDir: 'right', oneWay: true, label: 'Exit to Pathway' }, // TODO tune
  // 9
  { from: 'pathway-gate-cea-01', to: 'pathway-gate-coed-03', fromDir: 'back', toDir: 'right' }, // TODO tune toDir
  // 10
  { from: 'pathway-gate-cea-08', to: 'cea-25', fromDir: 'right', toDir: 'left' }, // TODO tune
  // 11
  { from: 'pathway-gate-cea-10', to: 'cea-02', fromDir: 'right', toDir: 'back' },
  // 12
  { from: 'pathway-gate-cea-14', to: 'pathway-com-sas-01', fromDir: 'forward', toDir: 'back' },
  // 13
  { from: 'pathway-com-sas-14', to: 'cat-09', fromDir: 'forward', toDir: 'back' }, // TODO tune toDir

  // Carried over from the old NODE_OVERRIDES (not in the new list).
  // Delete these two lines if they are no longer correct.
  { from: 'pathway-com-sas-03', to: 'com-01', fromDir: 'left', toDir: 'back', label: 'Enter College of Management' },
  { from: 'pathway-com-sas-07', to: 'pathway-library-registrar-01', fromDir: 'right', toDir: 'left', label: 'Walk to Library' },
];

// ============================================================
// WALK THERE — Map page "Walk there!" button.
// Key = building id (same ids as the database / map).
//   arriveNode  the panorama to finish on (usually the entrance)
//   pathway     the preferred outdoor pathway (shown in the guide)
//   startNode   optional: where to begin when the user's position
//               is unknown (defaults to WALK_DEFAULT_START)
// The actual sequence of panoramas is computed automatically from
// the links above (shortest walk), so a new building only needs a
// CONNECTIONS entry + one line here.
// ============================================================
export const WALK_DEFAULT_START = 'pathway-gate-coed-01'; // Main Gate

export const WALK_ROUTES = {
  cat:       { pathway: 'path-com-sas',           arriveNode: 'cat-09' },
  cea:       { pathway: 'path-gate-cea',          arriveNode: 'cea-02' },
  coed:      { pathway: 'path-gate-coed',         arriveNode: 'coed-07' },
  ccis:      { pathway: 'path-ccis-alumni',       arriveNode: 'ccis-08' },
  ccjs:      { pathway: 'path-ccis-alumni',       arriveNode: 'ccjs-06' },
  con:       { pathway: 'path-library-registrar', arriveNode: 'con-02' },
  library:   { pathway: 'path-library-registrar', arriveNode: 'lib-02' },
  com:       { pathway: 'path-com-sas',           arriveNode: 'com-01' },
  registrar: { pathway: 'path-library-registrar', arriveNode: 'pathway-library-registrar-11' }, // TODO confirm: end of pathway
  alumni:    { pathway: 'path-ccis-alumni',       arriveNode: 'pathway-ccis-alumni-29' },       // TODO confirm: end of pathway
  gate:      { pathway: 'path-gate-coed',         arriveNode: 'pathway-gate-coed-01' },
};

// ============================================================
// "Walk …" buttons on the building detail screen (DetailScreen.jsx).
// Each opens a pathway tour at its first node.
// ============================================================
export const PATH_LINKS = {
  coed:      [{ id: 'path-gate-coed', label: 'Walk from the Gate' }],
  ccis:      [{ id: 'path-ccis-alumni', label: 'Walk to Alumni Building' }],
  alumni:    [{ id: 'path-ccis-alumni', label: 'Walk from CCIS' }],
  cea:       [{ id: 'path-gate-cea', label: 'Walk from the Gate' }],
  library:   [{ id: 'path-library-registrar', label: 'Walk to Registrar' }],
  registrar: [{ id: 'path-library-registrar', label: 'Walk from Library' }],
  com:       [{ id: 'path-com-sas', label: 'Walk to SAS' }],
  cat:       [{ id: 'path-com-sas', label: 'Walk from COM' }],
};

// ============================================================
// Register every tour here (order doesn't matter).
// ============================================================
const TOUR_DEFS = [
  CAT, CCIS, CON, ADMIN, COED, CCJS, CEA, COM, LIBRARY,
  PATH_GATE_COED, PATH_CCIS_ALUMNI, PATH_GATE_CEA, PATH_LIBRARY_REGISTRAR, PATH_COM_SAS,
];

export const TOUR_GRAPH = buildTourGraph(TOUR_DEFS, CONNECTIONS);

// Back-compat: per-tour node arrays (old `nwssuTourNodes.cat` shape).
export const nwssuTourNodes = Object.fromEntries(
  Object.values(TOUR_GRAPH.tours).map((t) => [t.id, t.nodeIds.map((id) => TOUR_GRAPH.byId[id])])
);
