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
    { file: 'ccjs-01.jpg', title: 'Quadrangle (Between Wings)',       sub: 'CCJS · Ground Floor' },
    { file: 'ccjs-02.jpg', title: 'Covered Parking Walkway',          sub: 'CCJS · Ground Floor' },
    { file: 'ccjs-03.jpg', title: 'Covered Parking Walkway',          sub: 'CCJS · Ground Floor' },
    { file: 'ccjs-04.jpg', title: 'CAS Faculty Room',                 sub: 'CCJS · Ground Floor', star: true,
      office: { name: 'CAS Faculty Room', text: 'Faculty room located along the ground-floor walkway of the building.' } },
    { file: 'ccjs-05.jpg', title: 'Stairwell Landing',                sub: 'CCJS · Ground Floor' },
    { file: 'ccjs-06.jpg', title: 'Ground Floor (Utility Room Area)', sub: 'CCJS · Ground Floor' },
    { file: 'ccjs-07.jpg', title: 'Ground Floor (Utility Room Area)', sub: 'CCJS · Ground Floor → 2nd Floor' },

    { file: 'ccjs-08.jpg', title: 'Stairwell (Going Up to 2nd Floor)', sub: 'CCJS · Ground Floor → 2nd Floor' },
    { file: 'ccjs-09.jpg', title: '2nd Floor Hallway',                 sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-10.jpg', title: 'Criminology Laboratory',            sub: 'CCJS · 2nd Floor', star: true,
      office: { name: 'Criminology Laboratory', text: 'Laboratory used for Criminology program classes and practicals.' } },
    { file: 'ccjs-11.jpg', title: 'ACAD 03',                           sub: 'CCJS · 2nd Floor', star: true,
      office: { name: 'ACAD 03', text: 'Faculty/academic room on the 2nd floor of the CCJS building.' } },
    { file: 'ccjs-12.jpg', title: 'ACAD 01 / DEVCOM Lab (Campus Radio)', sub: 'CCJS · 2nd Floor', star: true,
      office: { name: 'ACAD 01 / DEVCOM Lab', text: 'Academic room that also houses the campus radio station, DYNW 89.5 Kauswagan Radio.' } },
    { file: 'ccjs-13.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-14.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-15.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-16.jpg', title: '2nd Floor Hallway (Other Side)',    sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-17.jpg', title: 'Wash Area (2nd Floor, Other Side)', sub: 'CCJS · 2nd Floor' },
    { file: 'ccjs-18.jpg', title: 'Stairwell to 3rd Floor',            sub: 'CCJS · 2nd Floor → 3rd Floor' },

    { file: 'ccjs-19.jpg', title: 'Stairwell Landing (3rd Floor Arrival)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-20.jpg', title: 'ACAD 301',                             sub: 'CCJS · 3rd Floor', star: true,
      office: { name: 'ACAD 301', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-21.jpg', title: 'ACAD 302',                             sub: 'CCJS · 3rd Floor', star: true,
      office: { name: 'ACAD 302', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-22.jpg', title: 'ACAD 303',                             sub: 'CCJS · 3rd Floor', star: true,
      office: { name: 'ACAD 303', text: 'Academic room on the 3rd floor, with crime-scene investigation exhibit boards displayed outside the door.' } },
    { file: 'ccjs-23.jpg', title: 'ACAD 304',                             sub: 'CCJS · 3rd Floor', star: true,
      office: { name: 'ACAD 304', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-24.jpg', title: 'ACAD 305',                             sub: 'CCJS · 3rd Floor', star: true,
      office: { name: 'ACAD 305', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { file: 'ccjs-25.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-26.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-27.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-28.jpg', title: '3rd Floor Hallway (Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-29.jpg', title: '3rd Floor Hallway (End, Facing Teacher Education Building)', sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-30.jpg', title: 'Stairwell Landing (Near Toilets)',  sub: 'CCJS · 3rd Floor' },
    { file: 'ccjs-31.jpg', title: 'Toilets',                            sub: 'CCJS · 3rd Floor' },
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
export const TOURS = { ccis: CCIS_TOUR, con: CON_TOUR, president: ADMIN_TOUR, cat: CAT_TOUR, coed: COED_TOUR, ccjs: CCJS_TOUR};
export const hasTour = (id) => Boolean(TOURS[id]);