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

// Lookup table so more buildings can register tours later.
export const TOURS = { ccis: CCIS_TOUR };
export const hasTour = (id) => Boolean(TOURS[id]);
