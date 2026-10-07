// ============================================================
// Maps a building/department id to the pathway tour(s) that lead
// to or from it, each with a short label for the "Walk here"
// button on that building's detail screen.
// ============================================================
export const PATH_LINKS = {
  coed: [
    { id: 'path-gate-coed', label: 'Walk from the Gate' },
    { id: 'path-coed-alumni', label: 'Walk to Alumni Building' }, // TODO: confirm this path starts at COED, not CCIS
  ],
  alumni: [
    { id: 'path-coed-alumni', label: 'Walk from COED' }, // TODO: same confirmation as above
  ],
  cea: [
    { id: 'path-gate-cea', label: 'Walk from the Gate' },
  ],
  library: [
    { id: 'path-library-registrar', label: 'Walk to Registrar' },
  ],
  registrar: [
    { id: 'path-library-registrar', label: 'Walk from Library' },
  ],
  com: [
    { id: 'path-com-sas', label: 'Walk to SAS' }, // TODO: confirm which building id SAS refers to
  ],
  // TODO: add an entry here for whichever id SAS maps to, e.g.:
  // studentcouncil: [{ id: 'path-com-sas', label: 'Walk from COM' }],
};

// ============================================================
// Pathway connections — for each outdoor pathway tour, describes
// its two physical endpoints: which building (if any) sits at
// each end, and which node of that building's OWN indoor tour to
// jump into when the user reaches that end of the path. Endpoint
// "a" is the pathway's node[0]; endpoint "b" is its last node.
// enterTour/enterNode stay null where no indoor tour exists yet
// (the Gate, or a building without a 360 tour) — that end then has
// no exit past the pathway's edge, same as any other dead end.
//
// NOTE: b.enterTour on gate-coed/gate-cea, and a.enterTour on
// com-sas, are intentionally left null here — those specific
// connections are now wired at an EXPLICIT mid-path node instead
// (see NODE_OVERRIDES below), not at the first/last node.
// ============================================================
export const PATHWAY_CONNECTIONS = {
  'path-gate-coed': {
    a: { label: 'Gate', buildingId: 'gate', enterTour: null, enterNode: null },
    b: { label: 'COED', buildingId: 'coed', enterTour: null, enterNode: null },
  },
  'path-coed-alumni': {
    a: { label: 'COED', buildingId: 'coed', enterTour: 'coed', enterNode: 'coed-01.jpg' }, // TODO: confirm COED vs CCIS
    b: { label: 'Alumni Building', buildingId: 'alumni', enterTour: null, enterNode: null },
  },
   'path-gate-cea': {
    a: { label: 'Gate', buildingId: 'gate', enterTour: null, enterNode: null },
    b: { label: 'CEA', buildingId: 'cea', enterTour: null, enterNode: null },
  },
  'path-library-registrar': {
    a: { label: 'Library', buildingId: 'library', enterTour: null, enterNode: null },
    b: { label: 'Registrar', buildingId: 'registrar', enterTour: null, enterNode: null },
  },
  'path-com-sas': {
    a: { label: 'COM', buildingId: 'com', enterTour: null, enterNode: null },
    b: { label: 'SAS', buildingId: null, enterTour: null, enterNode: null }, // TODO: confirm SAS building id
  },
};

// Patches a pathway tour's first/last node with a cross-tour exit
// wherever PATHWAY_CONNECTIONS defines one for that end. Call this
// once, right after building a pathway tour's `nodes` array — see
// the PATH_* exports below.
function withPathwayConnections(tour, pathwayId) {
  const conn = PATHWAY_CONNECTIONS[pathwayId];
  if (!conn) return tour;
  const nodes = tour.nodes;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (conn.a?.enterTour) {
    first.exits = { ...(first.exits || {}), back: { tour: conn.a.enterTour, node: conn.a.enterNode, label: `Enter ${conn.a.label}` } };
  }
  if (conn.b?.enterTour) {
    last.exits = { ...(last.exits || {}), forward: { tour: conn.b.enterTour, node: conn.b.enterNode, label: `Enter ${conn.b.label}` } };
  }
  return tour;
}

// Explicit, exactly-specified cross-tour connections at a SPECIFIC
// node of a pathway (not just its first/last node). `node` is the
// 1-based number shown in the 🧭 readout / Stops menu (Node #N).
// `dir` is left/right by default throughout, to avoid overriding a
// pathway's own forward/back walk-through at a mid-route node —
// swap any of these to 'forward'/'back' later if that's actually
// the correct physical direction once you've seen the photos.
const NODE_OVERRIDES = [
  { pathwayId: 'path-library-registrar', node: 10, dir: 'left',
    target: { tour: 'con', node: 'con-01.jpg', label: 'Enter College of Nursing' } },

  { pathwayId: 'path-com-sas', node: 7, dir: 'right',
    target: { tour: 'path-library-registrar', node: 'pathway-library-registrar-01.jpg', label: 'Walk to Library' } },
  { pathwayId: 'path-com-sas', node: 7, dir: 'left',
    target: { tour: 'path-library-registrar', node: 'pathway-library-registrar-01.jpg', label: 'Walk to Library' } },

  { pathwayId: 'path-com-sas', node: 3, dir: 'left',
    target: { tour: 'com', node: 'com-01.jpg', label: 'Enter College of Management' } },

  { pathwayId: 'path-coed-alumni', node: 3, dir: 'left',
    target: { tour: 'ccis', node: 'ccis-01.jpg', label: 'Enter CCIS' } },
  { pathwayId: 'path-coed-alumni', node: 21, dir: 'left',
    target: { tour: 'ccjs', node: 'ccjs-01.jpg', label: 'Enter CCJS' } },

  { pathwayId: 'path-gate-cea', node: 10, dir: 'right',
    target: { tour: 'cea', node: 'cea-02.jpg', label: 'Enter CEA' } },
  { pathwayId: 'path-gate-cea', node: 12, dir: 'left',
    target: { tour: 'path-com-sas', node: 'pathway-com-sas-01.jpg', label: 'Walk toward COM / SAS' } },

  { pathwayId: 'path-gate-coed', node: 14, dir: 'left',
    target: { tour: 'coed', node: 'coed-01.jpg', label: 'Enter COED' } },
];

function applyNodeOverrides(tour, pathwayId) {
  NODE_OVERRIDES.filter((o) => o.pathwayId === pathwayId).forEach((o) => {
    const node = tour.nodes[o.node - 1];
    if (!node) return;
    node.exits = { ...(node.exits || {}), [o.dir]: { ...o.target } };
  });
  return tour;
}

// ============================================================
// CCIS Ground-Floor Virtual Tour — node graph
// Each node = one 360° panorama (equirectangular JPEG in
// public/panoramas/ccis/). Nodes are walked in order; the
// viewer adds Back/Next arrows automatically.
// To add the 2nd floor later: append more nodes here and (if
// you want a stair jump) give a node a `jumpTo` index.
// ============================================================

export const CCIS_TOUR = {
  buildingId: 'ccis',
  title: 'CCIS Building',
  subtitle: 'Ground Floor',
  basePath: 'panoramas/ccis/', // resolved against import.meta.env.BASE_URL
  nodes: [
    { file: 'ccis-01.jpg', title: 'Stairwell to Hallway',                 sub: 'CCIS · Ground Floor',  heading: 175},
    { file: 'ccis-02.jpg', title: 'Hallway',                              sub: 'CCIS · Ground Floor',  heading: 175},
    { file: 'ccis-03.jpg', title: 'Management Information System (MIS) Office', sub: 'CCIS · Ground Floor', heading: 175, star: true,
      office: { name: 'MIS Office', text: 'The Management Information System (MIS) Office handles the college\u2019s records, enrollment data, and information systems.' } },
    { file: 'ccis-04.jpg', title: 'CCIS Faculty Office',                  sub: 'CCIS · Ground Floor', heading: 175,
      office: { name: 'CCIS Faculty Office', text: 'Workspace for CCIS faculty, used for consultations and program coordination.' } },
    { file: 'ccis-05.jpg', title: 'Hallway', sub: 'CCIS · Ground Floor', heading: 175},
    { file: 'ccis-06.jpg', title: 'Faculty Room',                        sub: 'CCIS · Ground Floor', heading: 175, star: true,
      office: { name: 'Faculty Room', text: 'The CCIS Faculty Room \u2014 staff workspace and student consultation area.' } },
    { file: 'ccis-07.jpg', title: "CCIS Dean's Office",                  sub: 'CCIS · Ground Floor', heading: 175, star: true,
      office: { name: "CCIS Dean's Office", text: 'Office of the College Dean, College of Computing and Information Sciences.' } },
    { file: 'ccis-08.jpg', title: 'Middle Stairwell Landing',            sub: 'CCIS · Ground Floor', heading: 175},
    { file: 'ccis-09.jpg', title: 'Conference Room (to Middle Stairwell)', sub: 'CCIS · Ground Floor → 2nd Floor', heading: 175},
  ],
};

// ============================================================
// College of Nursing (CON) Virtual Tour — node graph
// Same structure as CCIS_TOUR above: one 360° panorama per node
// (equirectangular JPEG in public/panoramas/con/), walked in
// order, with Back/Next arrows added automatically by the viewer.
// Source photos: CON_1, CON_3–CON_10, CON_13 (provided set skips
// CON_2/11/12), renumbered here to con-01..con-10 in walking order.
// ============================================================
export const CON_TOUR = {
  buildingId: 'con',
  title: 'College of Nursing Building',
  subtitle: 'Ground Floor',
  basePath: 'panoramas/co_n/', // resolved against import.meta.env.BASE_URL
  nodes: [
    { file: 'con-01.jpg', title: 'Entrance & Stairwell',                     sub: 'College of Nursing · Ground Floor', heading: 206 },
    { file: 'con-02.jpg', title: 'Stairwell Landing',                        sub: 'College of Nursing · Ground Floor' },
    { file: 'con-03.jpg', title: 'Hallway',                                  sub: 'College of Nursing · Ground Floor', heading: 282 },
    { file: 'con-04.jpg', title: 'Faculty Exit / Anatomy & Physiology Lab',  sub: 'College of Nursing · Ground Floor', heading: 275, star: true,
      office: { name: 'Anatomy & Physiology Lab', text: 'Laboratory used for anatomy and physiology classes, accessible through the faculty exit hallway.' } },
    { file: 'con-05.jpg', title: 'Nursing Classroom 1',                      sub: 'College of Nursing · Ground Floor',heading: 275, star: true,
      office: { name: 'Nursing Classroom 1', text: 'Lecture room for College of Nursing classes.' } },
    { file: 'con-06.jpg', title: 'Nursing Classroom 2',                      sub: 'College of Nursing · Ground Floor',heading: 256, star: true,
      office: { name: 'Nursing Classroom 2', text: 'Lecture room for College of Nursing classes.' } },
    { file: 'con-07.jpg', title: 'Hallway (Toward CCIS Building)',           sub: 'College of Nursing · Ground Floor → CCIS Building', heading: 270 },
    { file: 'con-08.jpg', title: 'Hallway to 3rd Floor Stairs',              sub: 'College of Nursing · Ground Floor', heading: 157 },
    { file: 'con-09.jpg', title: 'Stairs to 3rd Floor',                      sub: 'College of Nursing · Ground Floor → 3rd Floor', heading: 120 },
    { file: 'con-10.jpg', title: 'Central Supply Room',                      sub: 'College of Nursing · 3rd Floor', star: true,
      office: { name: 'Central Supply Room', text: 'Supply room located at the end of the 3rd floor hallway.' } },
  ],
};

// ============================================================
// Administration Building (ADMIN) Virtual Tour — node graph
// Same structure as CON_TOUR above: one 360° panorama per node
// (JPEG in public/panoramas/admin/), walked in order, with
// Back/Next arrows added automatically by the viewer.
// Source photos were numbered by the photographer as part of one
// continuous walk: AUX TO ADMIN_1, _2, _4, then ADMIN_9_RECORDS
// OFFICE, then GOING UP TO ADMIN OFFICE_11, _12 (gaps such as
// _3/_5–_8/_10 were not provided). Renumbered here to
// admin-01..admin-06 in that same ascending walking order —
// entering from the Auxiliary Building, through the Records
// Office, then up the stairs toward the Admin Office. Reorder
// the nodes below if the actual walkthrough differs.
// ============================================================
export const ADMIN_TOUR = {
  buildingId: 'president',
  title: 'Administration Building',
  subtitle: 'Ground Floor',
  basePath: 'panoramas/admin/', // resolved against import.meta.env.BASE_URL
  nodes: [
    //{ file: 'admin-01.jpg', title: 'Pathway from Auxiliary Building',        sub: 'Auxiliary Building → Administration Building' },
    { file: 'admin-02.jpg', title: 'Approach to Admin Building',             sub: 'Auxiliary Building → Administration Building', heading: 91 },
    { file: 'admin-03.jpg', title: 'Administration Building Entrance',       sub: 'Auxiliary Building → Administration Building' },
    { file: 'admin-04.jpg', title: 'Records Office',                        sub: 'Administration Building · Ground Floor', star: true,
      office: { name: 'Records Office', text: 'Handles student and personnel records for the Administration Building.' } },
    { file: 'admin-05.jpg', title: 'Stairs to Admin Office',                 sub: 'Administration Building · Ground Floor → Upper Floor' },
    { file: 'admin-06.jpg', title: 'Stairwell Landing (Toward Admin Office)', sub: 'Administration Building · Upper Floor' },
  ],
};

export const CAT_TOUR = {
  buildingId: 'cat',
  title: 'College of Agriculture & Technology Building',
  subtitle: 'Ground Floor',
  basePath: 'panoramas/cat/',
  nodes: [
    { file: 'cat-01.jpg', title: 'Covered Walkway (Near Bleachers)', sub: 'CAT · Ground Floor', heading: 183},
    { file: 'cat-02.jpg', title: 'Covered Walkway (Near Bleachers)', sub: 'CAT · Ground Floor', heading: 173},
    { file: 'cat-03.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 270},
    { file: 'cat-04.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 270 },
    { file: 'cat-05.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 270 },
    { file: 'cat-06.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 270 },
    { file: 'cat-07.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 270 },
    { file: 'cat-08.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 275 },
    { file: 'cat-09.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor', heading: 279 },
    { file: 'cat-10.jpg', title: 'Ground Floor Area',                sub: 'CAT · Ground Floor → 2nd Floor', heading: 275},
    { file: 'cat-11.jpg', title: '2nd Floor Landing',                sub: 'CAT · 2nd Floor' },
    { file: 'cat-12.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 87 },
    { file: 'cat-13.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 87 },
    { file: 'cat-14.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 168 },
    { file: 'cat-15.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 87 },
    { file: 'cat-16.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 87 },
    { file: 'cat-17.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor', heading: 90 },
    { file: 'cat-18.jpg', title: '2nd Floor Hallway',                sub: 'CAT · 2nd Floor' },
  ],
};

// ============================================================
// College of Education (COED) Virtual Tour — node graph
// Same structure as CON_TOUR/ADMIN_TOUR: one 360° panorama per
// node (JPEG in public/panoramas/coed/), walked in order, with
// Back/Next arrows added automatically by the viewer.
// Source photos were numbered by the photographer as one
// continuous walk: exterior approach (1-6) -> ground floor
// hallway (8-15) -> stairs to 2nd floor (16) -> 2nd floor
// hallway (18-25) -> stairs to 3rd floor (26-27) -> 3rd floor
// hallway (28-35) -> stairs to 4th floor (36) -> 4th floor
// hallway (37-38, 42-43) -> stairs back down through
// 4th(44)->3rd(45)->2nd(46)->ground(48) -> exterior again (49).
// Renumbered here to coed-01..coed-40 in that same order.
// ============================================================
export const COED_TOUR = {
  buildingId: 'coed',
  title: 'College of Education Building',
  subtitle: 'Ground to 4th Floor',
  basePath: 'panoramas/coed/', // resolved against import.meta.env.BASE_URL
  nodes: [
    { file: 'coed-01.jpg', title: 'COED Building Approach',      sub: 'College of Education · Exterior', heading: 269 },
    { file: 'coed-02.jpg', title: 'COED Building Facade',        sub: 'College of Education · Exterior', heading: 269 },
    { file: 'coed-03.jpg', title: 'COED Building Facade',        sub: 'College of Education · Exterior', heading: 269 },
    { file: 'coed-04.jpg', title: 'COED Building Corner',        sub: 'College of Education · Exterior', heading: 269 },
    //{ file: 'coed-05.jpg', title: 'COED Parking Area',           sub: 'College of Education · Exterior', heading: 269 },
    //{ file: 'coed-06.jpg', title: 'Pathway to Alumni Building',  sub: 'College of Education → Alumni Building', heading: 153 },
    { file: 'coed-07.jpg', title: 'Entrance Hallway',            sub: 'College of Education · Ground Floor' },
    { file: 'coed-08.jpg', title: 'Hallway',                     sub: 'College of Education · Ground Floor' },
    { file: 'coed-09.jpg', title: 'Hallway',                     sub: 'College of Education · Ground Floor' },
    { file: 'coed-10.jpg', title: 'Hallway',                     sub: 'College of Education · Ground Floor' },
    { file: 'coed-11.jpg', title: 'Hallway',                     sub: 'College of Education · Ground Floor' },
    { file: 'coed-12.jpg', title: 'Stairwell to 2nd Floor',      sub: 'College of Education · Ground Floor → 2nd Floor' },
    { file: 'coed-13.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-14.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-15.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-16.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-17.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-18.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-19.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-20.jpg', title: 'Hallway',                     sub: 'College of Education · 2nd Floor' },
    { file: 'coed-21.jpg', title: 'Stairwell to 3rd Floor',      sub: 'College of Education · 2nd Floor → 3rd Floor' },
    { file: 'coed-22.jpg', title: 'Stairwell to 3rd Floor',      sub: 'College of Education · 2nd Floor → 3rd Floor' },
    { file: 'coed-23.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-24.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-25.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-26.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-27.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-28.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-29.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-30.jpg', title: 'Hallway',                     sub: 'College of Education · 3rd Floor' },
    { file: 'coed-31.jpg', title: 'Stairwell to 4th Floor',      sub: 'College of Education · 3rd Floor → 4th Floor' },
    { file: 'coed-32.jpg', title: 'Hallway',                     sub: 'College of Education · 4th Floor' },
    { file: 'coed-33.jpg', title: 'Hallway',                     sub: 'College of Education · 4th Floor' },
    { file: 'coed-34.jpg', title: 'Hallway',                     sub: 'College of Education · 4th Floor' },
    { file: 'coed-35.jpg', title: 'Hallway',                     sub: 'College of Education · 4th Floor' },
    { file: 'coed-36.jpg', title: 'Stairwell Going Down',        sub: 'College of Education · 4th Floor → 3rd Floor' },
    { file: 'coed-37.jpg', title: 'Stairwell Going Down',        sub: 'College of Education · 3rd Floor → 2nd Floor' },
    { file: 'coed-38.jpg', title: 'Stairwell Going Down',        sub: 'College of Education · 2nd Floor → Ground Floor' },
    { file: 'coed-39.jpg', title: 'Ground Floor Hallway',        sub: 'College of Education · Ground Floor' },
    { file: 'coed-40.jpg', title: 'Back at the Courtyard',       sub: 'College of Education · Exterior' },
  ],
};

// ============================================================
// College of Criminal Justice & Science (CCJS)
// Ground Floor → 2nd Floor → 3rd Floor. Headings not set yet —
// use the 🧭 readout in PanoramaTour.jsx to tune each node once
// this is live.
// ============================================================
export const CCJS_TOUR = {
  buildingId: 'ccjs',
  title: 'College of Criminal Justice & Science Building',
  subtitle: 'Ground to 3rd Floor',
  basePath: 'panoramas/ccjs/',
  nodes: [
    { file: 'ccjs-01.jpg', title: 'Quadrangle (Between Wings)',       sub: 'CCJS · Ground Floor', heading: 149},
    { file: 'ccjs-02.jpg', title: 'Covered Parking Walkway',          sub: 'CCJS · Ground Floor', heading: 149},
    { file: 'ccjs-03.jpg', title: 'Covered Parking Walkway',          sub: 'CCJS · Ground Floor', heading: 179},
    { file: 'ccjs-04.jpg', title: 'CAS Faculty Room',                 sub: 'CCJS · Ground Floor', heading: 179, star: true,
      office: { name: 'CAS Faculty Room', text: 'Faculty room located along the ground-floor walkway of the building.' } },
    { file: 'ccjs-05.jpg', title: 'Stairwell Landing',                sub: 'CCJS · Ground Floor', heading: 265 },
    { file: 'ccjs-06.jpg', title: 'Ground Floor (Utility Room Area)', sub: 'CCJS · Ground Floor', heading: 266 },
    //{ file: 'ccjs-07.jpg', title: 'Ground Floor (Utility Room Area)', sub: 'CCJS · Ground Floor → 2nd Floor' },

    { file: 'ccjs-08.jpg', title: 'Stairwell (Going Up to 2nd Floor)', sub: 'CCJS · Ground Floor → 2nd Floor', heading: 194 },
    { file: 'ccjs-09.jpg', title: '2nd Floor Hallway',                 sub: 'CCJS · 2nd Floor',heading: 88 },
    { file: 'ccjs-10.jpg', title: 'Criminology Laboratory',            sub: 'CCJS · 2nd Floor',heading: 87, star: true,
      office: { name: 'Criminology Laboratory', text: 'Laboratory used for Criminology program classes and practicals.' } },
    { file: 'ccjs-11.jpg', title: 'ACAD 03',                           sub: 'CCJS · 2nd Floor',heading: 89, star: true,
      office: { name: 'ACAD 03', text: 'Faculty/academic room on the 2nd floor of the CCJS building.' } },
    { file: 'ccjs-12.jpg', title: 'ACAD 01 / DEVCOM Lab (Campus Radio)', sub: 'CCJS · 2nd Floor', heading: 85, star: true,
      office: { name: 'ACAD 01 / DEVCOM Lab', text: 'Academic room that also houses the campus radio station, DYNW 89.5 Kauswagan Radio.' } },
    { file: 'ccjs-13.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor',heading: 180 },
    { file: 'ccjs-14.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor',heading: 174 },
    { file: 'ccjs-15.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor',heading: 180 },
    { file: 'ccjs-16.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor',heading: 178 },
    { file: 'ccjs-17.jpg', title: 'Wash Area (2nd Floor, Other Side)', sub: 'CCJS · 2nd Floor',heading: 274 },
    { file: 'ccjs-18.jpg', title: 'Stairwell to 3rd Floor',            sub: 'CCJS · 2nd Floor → 3rd Floor',heading: 196 },

    { file: 'ccjs-19.jpg', title: 'Stairwell Landing (3rd Floor Arrival)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-20.jpg', title: 'ACAD 301',                             sub: 'CCJS · 3rd Floor', heading: 92, star: true,
      office: { name: 'ACAD 301', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-21.jpg', title: 'ACAD 302',                             sub: 'CCJS · 3rd Floor', heading: 89, star: true,
      office: { name: 'ACAD 302', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-22.jpg', title: 'ACAD 303',                             sub: 'CCJS · 3rd Floor', heading: 90, star: true,
      office: { name: 'ACAD 303', text: 'Academic room on the 3rd floor, with crime-scene investigation exhibit boards displayed outside the door.' } },
    { file: 'ccjs-23.jpg', title: 'ACAD 304',                             sub: 'CCJS · 3rd Floor',  heading: 88, star: true,
      office: { name: 'ACAD 304', text: 'Academic room on the 3rd floor of the CCJS building.'  } },
    { file: 'ccjs-24.jpg', title: 'ACAD 305',                             sub: 'CCJS · 3rd Floor', heading: 84, star: true,
      office: { name: 'ACAD 305', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-25.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor',  heading: 87 },
    { file: 'ccjs-26.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor', heading: 176 },
    { file: 'ccjs-27.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor', heading: 176 },
    { file: 'ccjs-28.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor', heading: 178 },
    { file: 'ccjs-29.jpg', title: '3rd Floor Hallway (End, Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor',  heading: 177 },
    { file: 'ccjs-30.jpg', title: 'Stairwell Landing (Near Toilets)',  sub: 'CCJS · 3rd Floor', heading: 88 },
    { file: 'ccjs-31.jpg', title: 'Toilets',                            sub: 'CCJS · 3rd Floor',  heading: 0 },
  ],
};

// ============================================================
// College of Engineering & Architecture (CEA) Virtual Tour
// Two physical buildings, walked as one continuous sequence:
// Building 1 (ground -> 2nd -> 3rd floor) then Building 2
// (ground -> 2nd floor -> back down to ground -> parking exit).
// Source photos numbered 9-60 continuously (1-8 not provided/
// not part of this set). Renumbered here to cea-01..cea-52 in
// that same order. Headings not set yet — use the 🧭 readout in
// PanoramaTour.jsx to tune each node once this is live.
//
// Branching notes:
// - cea-02 is the tour's entry point (forward skips straight to
//   Building 2 at cea-24; right branches into the old ground-floor
//   hallway chain starting at cea-09).
// - cea-11 gains a right turn into the stairwell at cea-18; cea-18's
//   back returns to cea-11 (not the node before it in array order).
// - cea-14 and cea-22 are dead-end hallways (forward disabled).
// - cea-24's back returns to cea-02 (the branch point), not cea-22.
// - cea-31 is a left/right fork (no default forward); cea-33 (left
//   branch) has its back pointed at the fork itself; cea-32 (right
//   branch) and cea-36 (end of left branch) are dead ends.
// ============================================================
export const CEA_TOUR = {
  buildingId: 'cea',
  title: 'College of Engineering & Architecture Building',
  subtitle: 'Building 1 & 2, Ground to 3rd Floor',
  basePath: 'panoramas/cea/', // resolved against import.meta.env.BASE_URL
  nodes: [
    { file: 'cea-02.jpg', title: 'Entrance Hallway',                    sub: 'CEA Building 1 · Ground Floor', heading: 92,
      exits: { forward: 'cea-24.jpg', right: 'cea-09.jpg' } },
    /*{ file: 'cea-03.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · Ground Floor' },
    { file: 'cea-04.jpg', title: 'Hallway (Back to Center)',            sub: 'CEA Building 1 · Ground Floor', heading: 92 },
    { file: 'cea-05.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · Ground Floor' },
    { file: 'cea-06.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · Ground Floor' },
    { file: 'cea-07.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · Ground Floor' },
    { file: 'cea-08.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · Ground Floor' },*/
    { file: 'cea-09.jpg', title: 'Hallway (Back to Center)',            sub: 'CEA Building 1 · Ground Floor', heading: 93 },
    { file: 'cea-10.jpg', title: 'Stairwell to 2nd Floor',              sub: 'CEA Building 1 · Ground Floor → 2nd Floor', heading: 245 },
    { file: 'cea-11.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 2nd Floor', heading: 247,
      exits: { right: 'cea-18.jpg' } },
    { file: 'cea-12.jpg', title: 'Classrooms Hallway',                  sub: 'CEA Building 1 · 2nd Floor', heading: 180 },
    { file: 'cea-13.jpg', title: 'Classrooms Hallway',                  sub: 'CEA Building 1 · 2nd Floor', heading: 271 },
    { file: 'cea-14.jpg', title: 'Classrooms Hallway (End)',            sub: 'CEA Building 1 · 2nd Floor', heading: 354,
      exits: { forward: null } },
    /*{ file: 'cea-15.jpg', title: 'Classrooms Hallway (Other Side)',     sub: 'CEA Building 1 · 2nd Floor' },
    { file: 'cea-16.jpg', title: 'Classrooms Hallway (Other Side)',     sub: 'CEA Building 1 · 2nd Floor' },
    { file: 'cea-17.jpg', title: 'Classrooms Hallway (Other Side End)', sub: 'CEA Building 1 · 2nd Floor' },*/
    { file: 'cea-18.jpg', title: 'Stairwell to 3rd Floor',              sub: 'CEA Building 1 · 2nd Floor → 3rd Floor', heading: 141,
      exits: { back: 'cea-11.jpg' } },
    { file: 'cea-19.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 3rd Floor', heading: 118 },
    { file: 'cea-20.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 3rd Floor', heading: 309 },
    { file: 'cea-21.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 3rd Floor', heading: 355 },
    { file: 'cea-22.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 3rd Floor', heading: 174,
      exits: { back: 'cea-20.jpg', forward: null } },
    //{ file: 'cea-23.jpg', title: 'Hallway',                             sub: 'CEA Building 1 · 3rd Floor' },
    { file: 'cea-24.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor', heading: 134,
      exits: { back: 'cea-02.jpg' } },
    { file: 'cea-25.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor', heading: 180 },
    //{ file: 'cea-26.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-27.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor', heading: 181 },
    { file: 'cea-28.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor', heading: 148 },
    { file: 'cea-29.jpg', title: 'Stairwell to 2nd Floor',              sub: 'CEA Building 2 · Ground Floor → 2nd Floor', heading: 175 },
    { file: 'cea-30.jpg', title: 'Stairwell to 2nd Floor',              sub: 'CEA Building 2 · Ground Floor → 2nd Floor', heading: 140 },
    { file: 'cea-31.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor',
      exits: { forward: null, left: 'cea-33.jpg', right: 'cea-32.jpg' } },
    { file: 'cea-32.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor', heading: 182,
      exits: { forward: null } },
    { file: 'cea-33.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor', heading: 89,
      exits: { back: 'cea-31.jpg' } },
    { file: 'cea-34.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor', heading: 272 },
    { file: 'cea-35.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor', heading: 175 },
    { file: 'cea-36.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor', heading: 182,
      exits: { forward: null } },
    { file: 'cea-37.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor' },
    { file: 'cea-38.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor' },
    { file: 'cea-39.jpg', title: 'Hallway',                             sub: 'CEA Building 2 · 2nd Floor' },
    { file: 'cea-40.jpg', title: 'Stairwell Going Down',                sub: 'CEA Building 2 · 2nd Floor → Ground Floor' },
    { file: 'cea-41.jpg', title: 'Stairwell Going Down',                sub: 'CEA Building 2 · 2nd Floor → Ground Floor' },
    { file: 'cea-42.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-43.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-44.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-45.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-46.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-47.jpg', title: 'Hallway Toward COM Building',         sub: 'CEA Building 2 → College of Management (COM)' },
    { file: 'cea-48.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-49.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-50.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-51.jpg', title: 'Ground Floor Area',                   sub: 'CEA Building 2 · Ground Floor' },
    { file: 'cea-52.jpg', title: 'Parking Area',                        sub: 'CEA Building 2 · Exterior / Parking' },
  ],
};

// ============================================================
// College of Management (COM) Virtual Tour
// Two physical buildings, walked as one continuous sequence:
// Building 1 (ground -> 2nd floor -> back down to ground ->
// toward Building 2) then Building 2 (ground -> 2nd -> 3rd floor).
// Source photos were a sparser capture than other buildings —
// numbered 2-36 with real gaps (not every frame kept), but still
// one clean ascending walk. Renumbered here to com-01..com-19.
// Because a few connecting shots (e.g. the stairwell between
// Building 2's ground and 2nd floor) weren't captured, some
// consecutive nodes may feel like a visual jump — that's a
// missing-photo gap, not a numbering error. Headings default to
// 0 below — use the 🧭 readout in PanoramaTour.jsx to tune each
// node once this is live.
// ============================================================
export const COM_TOUR = {
  buildingId: 'com',
  title: 'College of Management Building',
  subtitle: 'Building 1 & 2, Ground to 3rd Floor',
  basePath: 'panoramas/com/',
  nodes: [
    { file: 'com-01.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-02.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-03.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-04.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-05.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-06.jpg', title: 'Faculty Area',                sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-07.jpg', title: 'Hallway',                     sub: 'COM Building 1 · 2nd Floor', heading: 0 },
    { file: 'com-08.jpg', title: 'Hallway',                     sub: 'COM Building 1 · 2nd Floor', heading: 0 },
    { file: 'com-09.jpg', title: 'Stairwell Going Down',        sub: 'COM Building 1 · 2nd Floor → Ground Floor', heading: 0 },
    { file: 'com-10.jpg', title: 'Stairwell Going Down',        sub: 'COM Building 1 · 2nd Floor → Ground Floor', heading: 0 },
    { file: 'com-11.jpg', title: 'Ground Floor Area',           sub: 'COM Building 1 · Ground Floor', heading: 0 },
    { file: 'com-12.jpg', title: 'Hallway Toward Building 2',   sub: 'COM Building 1 → COM Building 2', heading: 0 },
    { file: 'com-13.jpg', title: 'Hallway Toward Building 2',   sub: 'COM Building 1 → COM Building 2', heading: 0 },
    { file: 'com-14.jpg', title: 'Ground Floor Area',           sub: 'COM Building 2 · Ground Floor', heading: 0 },
    { file: 'com-15.jpg', title: 'Hallway',                     sub: 'COM Building 2 · 2nd Floor', heading: 0 },
    { file: 'com-16.jpg', title: 'Hallway',                     sub: 'COM Building 2 · 2nd Floor', heading: 0 },
    { file: 'com-17.jpg', title: 'Hallway',                     sub: 'COM Building 2 · 3rd Floor', heading: 0 },
    { file: 'com-18.jpg', title: 'Hallway',                     sub: 'COM Building 2 · 3rd Floor', heading: 0 },
    { file: 'com-19.jpg', title: 'Hallway',                     sub: 'COM Building 2 · 3rd Floor', heading: 0 },
  ],
};

// ============================================================
// Outdoor Pathway Tours — walking connections between buildings.
// Same node/heading/exits structure as building tours, just not
// tied to a single buildingId. Keyed in TOURS by a path-* id and
// opened via a "Walk here" button (PATH_LINKS, above), the Map's
// "Walk There" button (findDirectPathway, below), or the mid-path
// cross-tour pins (NODE_OVERRIDES, above). Headings default to 0
// below — use the 🧭 readout in PanoramaTour.jsx to tune each node
// once these are live.
// ============================================================
export const PATH_GATE_COED = applyNodeOverrides(withPathwayConnections({
  buildingId: 'path-gate-coed',
  title: 'Gate → College of Education',
  subtitle: 'Outdoor Pathway',
  basePath: 'panoramas/pathways/gate-coed/',
  nodes: Array.from({ length: 25 }, (_, i) => ({
    file: `pathway-gate-coed-${String(i + 1).padStart(2, '0')}.JPG`,
    title: 'Pathway',
    sub: 'Gate → College of Education',
    heading: 0,
  })),
}, 'path-gate-coed'), 'path-gate-coed');

export const PATH_COED_ALUMNI = applyNodeOverrides(withPathwayConnections({
  buildingId: 'path-coed-alumni',
  title: 'College of Education → Alumni Building',
  subtitle: 'Outdoor Pathway',
  basePath: 'panoramas/pathways/coed-alumni/',
  nodes: Array.from({ length: 29 }, (_, i) => ({
    file: `pathway-coed-alumni-${String(i + 1).padStart(2, '0')}.JPG`,
    title: 'Pathway',
    sub: 'College of Education → Alumni Building',
    heading: 0,
  })),
}, 'path-coed-alumni'), 'path-coed-alumni');

export const PATH_GATE_CEA = applyNodeOverrides(withPathwayConnections({
  buildingId: 'path-gate-cea',
  title: 'Gate → College of Engineering & Architecture',
  subtitle: 'Outdoor Pathway',
  basePath: 'panoramas/pathways/gate-cea/',
  nodes: Array.from({ length: 14 }, (_, i) => ({
    file: `pathway-gate-cea-${String(i + 1).padStart(2, '0')}.jpg`,
    title: 'Pathway',
    sub: 'Gate → College of Engineering & Architecture',
    heading: 171,
  })),
}, 'path-gate-cea'), 'path-gate-cea');

export const PATH_LIBRARY_REGISTRAR = applyNodeOverrides(withPathwayConnections({
  buildingId: 'path-library-registrar',
  title: 'Library → Registrar',
  subtitle: 'Outdoor Pathway',
  basePath: 'panoramas/pathways/library-registrar/',
  nodes: Array.from({ length: 11 }, (_, i) => ({
    file: `pathway-library-registrar-${String(i + 1).padStart(2, '0')}.jpg`,
    title: 'Pathway',
    sub: 'Library → Registrar',
    heading: 0,
  })),
}, 'path-library-registrar'), 'path-library-registrar');

export const PATH_COM_SAS = applyNodeOverrides(withPathwayConnections({
  buildingId: 'path-com-sas',
  title: 'College of Management → SAS',
  subtitle: 'Outdoor Pathway',
  basePath: 'panoramas/pathways/com-sas/',
  nodes: Array.from({ length: 14 }, (_, i) => ({
    file: `pathway-com-sas-${String(i + 1).padStart(2, '0')}.jpg`,
    title: 'Pathway',
    sub: 'College of Management → SAS',
    heading: 0,
  })),
}, 'path-com-sas'), 'path-com-sas');

export const LIB_TOUR = {
  buildingId: 'lib',
  title: 'NwSSU Library',
  basePath: 'panoramas/library/', // resolved against import.meta.env.BASE_URL
  nodes: [
    { file: 'lib-02.jpg', title: 'Stairwell Landing',                        sub: 'NwSSU Library' },
    { file: 'lib-03.jpg', title: 'Hallway',                                  sub: 'NwSSU Library', heading: 282 },
    { file: 'lib-01.jpg', title: 'Entrance & Stairwell',                     sub: 'NwSSU Library', heading: 206 },
  ]
}


// Lookup table so more buildings can register tours later.
export const TOURS = {
  ccis: CCIS_TOUR, con: CON_TOUR, president: ADMIN_TOUR, cat: CAT_TOUR,
  coed: COED_TOUR, ccjs: CCJS_TOUR, cea: CEA_TOUR, com: COM_TOUR, lib: LIB_TOUR,
  'path-gate-coed': PATH_GATE_COED,
  'path-coed-alumni': PATH_COED_ALUMNI,
  'path-gate-cea': PATH_GATE_CEA,
  'path-library-registrar': PATH_LIBRARY_REGISTRAR,
  'path-com-sas': PATH_COM_SAS,

};
export const hasTour = (id) => Boolean(TOURS[id]);

// Given two building ids, returns the pathway tour that connects
// them DIRECTLY, with the correct starting node and walk direction
// for going from origin → destination — or null if no such direct
// pathway exists (multi-hop routing across several pathways isn't
// supported yet).
export function findDirectPathway(originId, destId) {
  for (const [pathwayId, conn] of Object.entries(PATHWAY_CONNECTIONS)) {
    const nodes = TOURS[pathwayId]?.nodes || [];
    if (conn.a.buildingId === originId && conn.b.buildingId === destId) {
      return { pathwayId, reverse: false, startFile: nodes[0]?.file };
    }
    if (conn.a.buildingId === destId && conn.b.buildingId === originId) {
      return { pathwayId, reverse: true, startFile: nodes[nodes.length - 1]?.file };
    }
  }
  return null;
}