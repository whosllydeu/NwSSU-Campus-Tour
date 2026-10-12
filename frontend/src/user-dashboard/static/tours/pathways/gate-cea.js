// ============================================================
// Outdoor pathway tour: path-gate-cea
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
const PATH_GATE_CEA = {
  id: 'path-gate-cea',
  title: 'Gate → College of Engineering & Architecture',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/gate-cea',
  defaultName: 'Pathway',
  nodes: [
    // Main Gate: extra arrow (no pin) → Gate → College of Education photo 03
    {
      id: 'pathway-gate-cea-01', yaw: -9, gps: [12.07089, 124.59679],
      links: [{ nodeId: 'pathway-gate-coed-03', dir: 'back' }], // TODO tune if needed
    },
    { id: 'pathway-gate-cea-02', yaw: -9, gps: [12.07109, 124.59684] },
    { id: 'pathway-gate-cea-03', yaw: -9, gps: [12.07118, 124.59691] },
    { id: 'pathway-gate-cea-04', yaw: -9, gps: [12.07111, 124.59656] },
    { id: 'pathway-gate-cea-05', yaw: -9, gps: [12.07148, 124.59709] },
    { id: 'pathway-gate-cea-06', yaw: -9, gps: [12.07153, 124.59718] },
    { id: 'pathway-gate-cea-07', yaw: -9, gps: [12.07164, 124.59720] },
    { id: 'pathway-gate-cea-08', yaw: -9, gps: [12.07167, 124.59725] },
    { id: 'pathway-gate-cea-09', yaw: -9, gps: [12.07174, 124.59722] },
    { id: 'pathway-gate-cea-10', yaw: -9, gps: [12.07184, 124.59718] },
    { id: 'pathway-gate-cea-11', yaw: -9, gps: [12.07193, 124.59713] },
    { id: 'pathway-gate-cea-12', yaw: -9, gps: [12.07204, 124.59709] },
  ],
};

export default PATH_GATE_CEA;