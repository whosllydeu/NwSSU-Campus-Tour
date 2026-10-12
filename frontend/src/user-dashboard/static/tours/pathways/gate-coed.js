// ============================================================
// Outdoor pathway tour: path-gate-coed
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
const PATH_GATE_COED = {
  id: 'path-gate-coed',
  title: 'Gate → College of Education',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/gate-coed',
  ext: '.JPG',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-gate-coed-01', yaw: -177, gps: [12.07098, 124.59678] }, // TODO yaw
    { id: 'pathway-gate-coed-02', yaw: -177, gps: [12.07095, 124.59675] }, // TODO yaw
    { id: 'pathway-gate-coed-03', yaw: -177, gps: [12.07072, 124.59676] }, // TODO yaw
    { id: 'pathway-gate-coed-04', yaw: -177, gps: [12.07068, 124.59669] }, // TODO yaw
    { id: 'pathway-gate-coed-05', yaw: -177, gps: [12.07062, 124.59663] }, // TODO yaw
    { id: 'pathway-gate-coed-06', yaw: -177, gps: [12.07060, 124.59660] }, // TODO yaw
    { id: 'pathway-gate-coed-07', yaw: -177, gps: [12.07045, 124.59653] }, // TODO yaw
    { id: 'pathway-gate-coed-08', yaw: -177, gps: [12.07042, 124.59665] }, // TODO yaw
    { id: 'pathway-gate-coed-09', yaw: -177, gps: [12.07028, 124.59645] }, // TODO yaw
    { id: 'pathway-gate-coed-10', yaw: -177, gps: [12.07020, 124.59640] }, // TODO yaw
    { id: 'pathway-gate-coed-11', yaw: -177, gps: [12.07004, 124.59638] }, // TODO yaw
    { id: 'pathway-gate-coed-12', yaw: -177, gps: [12.07004, 124.59636] }, // TODO yaw
    // Opens facing the College of Education (-138°). The forward/back arrows
    // have their own yaw so they don't move with the view, and the forward
    // arrow sits well clear of the "Walk to College of Education" label (-145°).
    {
      id: 'pathway-gate-coed-13', yaw: -138, gps: [12.06992, 124.59633],
      next: null,
      prev: null,
      links: [
        { nodeId: 'pathway-gate-coed-14', yaw: -100, dir: 'forward' },
        { nodeId: 'pathway-gate-coed-12', yaw: 0, dir: 'back' },
      ],
    },
    { id: 'pathway-gate-coed-14', yaw: 172, gps: [12.06991, 124.59630] }, // TODO yaw
    { id: 'pathway-gate-coed-15', yaw: 0, gps: [12.06995, 124.59617] }, // TODO yaw
    // Junction: forward → photo 18 (main path), right arrow → photo 17 (side path)
    {
      id: 'pathway-gate-coed-16', yaw: 0, gps: [12.06996, 124.59614], // TODO yaw
      next: 'pathway-gate-coed-18',
      links: [{ nodeId: 'pathway-gate-coed-17', dir: 'right' }],
    },
    // Side path: back → photo 16; forward → CCIS → Alumni photo 21 (set in connections.js)
    { id: 'pathway-gate-coed-17', yaw: 5, gps: [12.07006, 124.59604], next: null }, // TODO yaw
    // Back arrow returns to photo 16 (photo 17 is a side path)
    { id: 'pathway-gate-coed-18', yaw: 0, gps: [12.06997, 124.59597], prev: 'pathway-gate-coed-16' }, // TODO yaw
    { id: 'pathway-gate-coed-19', yaw: 0, gps: [12.07001, 124.59595] }, // TODO yaw
    { id: 'pathway-gate-coed-20', yaw: 0, gps: [12.07004, 124.59581] }, // TODO yaw
    { id: 'pathway-gate-coed-21', yaw: 0, gps: [12.07008, 124.59583] }, // TODO yaw
    { id: 'pathway-gate-coed-22', yaw: 0, gps: [12.07010, 124.59570] }, // TODO yaw
    { id: 'pathway-gate-coed-23', yaw: 0, gps: [12.070111, 124.595592] }, // TODO yaw
    { id: 'pathway-gate-coed-24', yaw: 0, gps: [12.070169, 124.595609] }, // TODO yaw
    { id: 'pathway-gate-coed-25', yaw: 0, gps: [12.070254, 124.595648] }, // TODO yaw
  ],
};

export default PATH_GATE_COED;