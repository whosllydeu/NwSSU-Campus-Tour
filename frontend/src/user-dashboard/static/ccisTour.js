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
    { file: 'ccis-01.jpg', title: 'Stairwell to Hallway',                 sub: 'CCIS · Ground Floor' },
    { file: 'ccis-02.jpg', title: 'Hallway',                              sub: 'CCIS · Ground Floor' },
    { file: 'ccis-03.jpg', title: 'Management Information System (MIS) Office', sub: 'CCIS · Ground Floor', star: true,
      office: { name: 'MIS Office', text: 'The Management Information System (MIS) Office handles the college\u2019s records, enrollment data, and information systems.' } },
    { file: 'ccis-04.jpg', title: 'CCIS Faculty Office',                  sub: 'CCIS · Ground Floor',
      office: { name: 'CCIS Faculty Office', text: 'Workspace for CCIS faculty, used for consultations and program coordination.' } },
    { file: 'ccis-05.jpg', title: 'Hallway',                              sub: 'CCIS · Ground Floor' },
    { file: 'ccis-06.jpg', title: 'Faculty Room',                        sub: 'CCIS · Ground Floor', star: true,
      office: { name: 'Faculty Room', text: 'The CCIS Faculty Room \u2014 staff workspace and student consultation area.' } },
    { file: 'ccis-07.jpg', title: "CCIS Dean's Office",                  sub: 'CCIS · Ground Floor', star: true,
      office: { name: "CCIS Dean's Office", text: 'Office of the College Dean, College of Computing and Information Sciences.' } },
    { file: 'ccis-08.jpg', title: 'Middle Stairwell Landing',            sub: 'CCIS · Ground Floor' },
    { file: 'ccis-09.jpg', title: 'Conference Room (to Middle Stairwell)', sub: 'CCIS · Ground Floor → 2nd Floor' },
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
    { file: 'con-01.jpg', title: 'Entrance & Stairwell',                     sub: 'College of Nursing · Ground Floor' },
    { file: 'con-02.jpg', title: 'Stairwell Landing',                        sub: 'College of Nursing · Ground Floor' },
    { file: 'con-03.jpg', title: 'Hallway',                                  sub: 'College of Nursing · Ground Floor' },
    { file: 'con-04.jpg', title: 'Faculty Exit / Anatomy & Physiology Lab',  sub: 'College of Nursing · Ground Floor', star: true,
      office: { name: 'Anatomy & Physiology Lab', text: 'Laboratory used for anatomy and physiology classes, accessible through the faculty exit hallway.' } },
    { file: 'con-05.jpg', title: 'Nursing Classroom 1',                      sub: 'College of Nursing · Ground Floor', star: true,
      office: { name: 'Nursing Classroom 1', text: 'Lecture room for College of Nursing classes.' } },
    { file: 'con-06.jpg', title: 'Nursing Classroom 2',                      sub: 'College of Nursing · Ground Floor', star: true,
      office: { name: 'Nursing Classroom 2', text: 'Lecture room for College of Nursing classes.' } },
    { file: 'con-07.jpg', title: 'Hallway (Toward CCIS Building)',           sub: 'College of Nursing · Ground Floor → CCIS Building' },
    { file: 'con-08.jpg', title: 'Hallway to 3rd Floor Stairs',              sub: 'College of Nursing · Ground Floor' },
    { file: 'con-09.jpg', title: 'Stairs to 3rd Floor',                      sub: 'College of Nursing · Ground Floor → 3rd Floor' },
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
    { file: 'admin-01.jpg', title: 'Pathway from Auxiliary Building',        sub: 'Auxiliary Building → Administration Building' },
    { file: 'admin-02.jpg', title: 'Approach to Admin Building',             sub: 'Auxiliary Building → Administration Building' },
    { file: 'admin-03.jpg', title: 'Administration Building Entrance',       sub: 'Auxiliary Building → Administration Building' },
    { file: 'admin-04.jpg', title: 'Records Office',                        sub: 'Administration Building · Ground Floor', star: true,
      office: { name: 'Records Office', text: 'Handles student and personnel records for the Administration Building.' } },
    { file: 'admin-05.jpg', title: 'Stairs to Admin Office',                 sub: 'Administration Building · Ground Floor → Upper Floor' },
    { file: 'admin-06.jpg', title: 'Stairwell Landing (Toward Admin Office)', sub: 'Administration Building · Upper Floor' },
  ],
};

// ============================================================
// Auxiliary Building (Student Council Building) Virtual Tour
// Same structure as CON_TOUR above. Only one panorama was
// provided for this building, so the viewer will show it with
// no Back/Next arrows (both are automatically hidden when there
// is nothing before/after the current node in `nodes`). Add more
// nodes here later the same way the other tours are built.
// ============================================================

// Lookup table so more buildings can register tours later.
export const TOURS = { ccis: CCIS_TOUR, con: CON_TOUR, president: ADMIN_TOUR,  };
export const hasTour = (id) => Boolean(TOURS[id]);