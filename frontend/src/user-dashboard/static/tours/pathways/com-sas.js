// ============================================================
// Outdoor pathway tour: path-com-sas
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
const PATH_COM_SAS = {
  id: 'path-com-sas',
  title: 'College of Management → SAS',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/com-sas',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-com-sas-01', yaw: 0, gps: [12.07208, 124.59706] }, // TODO yaw
    { id: 'pathway-com-sas-02', yaw: 0, gps: [12.07219, 124.59700] }, // TODO yaw
    { id: 'pathway-com-sas-03', yaw: 0, gps: [12.07215, 124.59688] }, // TODO yaw
    { id: 'pathway-com-sas-04', yaw: 0, gps: [12.07201, 124.59674] }, // TODO yaw
    { id: 'pathway-com-sas-06', yaw: 0, gps: [12.07187, 124.59671] }, // TODO yaw
    // Opens facing the Library passage (-79°). The forward/back arrows are
    // pinned to their old positions so changing `yaw` doesn't move them.
    {
      id: 'pathway-com-sas-07',
      yaw: -79,
      gps: [12.07204, 124.59650],
      next: null,
      prev: null,
      links: [
        { nodeId: 'pathway-com-sas-08', yaw: 0, dir: 'forward' },
        { nodeId: 'pathway-com-sas-06', yaw: 180, dir: 'back' },
      ],
    },
    { id: 'pathway-com-sas-08', yaw: 0, gps: [12.07188, 124.59638] }, // TODO yaw
    { id: 'pathway-com-sas-09', yaw: 0, gps: [12.07183, 124.59633] }, // TODO yaw
    { id: 'pathway-com-sas-10', yaw: 0, gps: [12.07182, 124.59622] }, // TODO yaw
    { id: 'pathway-com-sas-11', yaw: 0, gps: [12.07196, 124.59608] }, // TODO yaw
    { id: 'pathway-com-sas-12', yaw: 0, gps: [12.07177, 124.59604] }, // TODO yaw
    { id: 'pathway-com-sas-13', yaw: 0, gps: [12.07172, 124.59592] }, // TODO yaw
    { id: 'pathway-com-sas-14', yaw: 0, gps: [12.07154, 124.59590] }, // TODO yaw
  ],
};

export default PATH_COM_SAS;