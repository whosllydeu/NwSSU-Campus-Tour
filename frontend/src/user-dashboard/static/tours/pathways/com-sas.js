const PATH_COM_SAS = {
  id: 'path-com-sas',
  title: 'College of Management → SAS',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/com-sas',
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-com-sas-01', yaw: 0, gps: [12.07208, 124.59706] },
    { id: 'pathway-com-sas-02', yaw: 0, gps: [12.07219, 124.59700] },
    { id: 'pathway-com-sas-03', yaw: 0, gps: [12.07215, 124.59688] },
    { id: 'pathway-com-sas-04', yaw: 0, gps: [12.07201, 124.59674] },
    { id: 'pathway-com-sas-06', yaw: 0, gps: [12.07187, 124.59671] },
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
    { id: 'pathway-com-sas-08', yaw: 0, gps: [12.07188, 124.59638] },
    { id: 'pathway-com-sas-09', yaw: 0, gps: [12.07183, 124.59633] },
    { id: 'pathway-com-sas-10', yaw: 0, gps: [12.07182, 124.59622] },
    { id: 'pathway-com-sas-11', yaw: 0, gps: [12.07196, 124.59608] },
    { id: 'pathway-com-sas-12', yaw: 0, gps: [12.07177, 124.59604] },
    { id: 'pathway-com-sas-13', yaw: 0, gps: [12.07172, 124.59592] },
    { id: 'pathway-com-sas-14', yaw: 0, gps: [12.07154, 124.59590] },
  ],
};

export default PATH_COM_SAS;