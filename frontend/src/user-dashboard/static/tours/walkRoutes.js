export const WALK_DEFAULT_START = 'pathway-gate-cea-01';

export const WALK_ROUTES = {
  cat:       { pathway: 'path-com-sas',           arriveNode: 'cat-09' },
  cea:       { pathway: 'path-gate-cea',          arriveNode: 'cea-02' },
  coed:      { pathway: 'path-gate-coed',         arriveNode: 'coed-40' },
  ccis:      { pathway: 'path-ccis-alumni',       arriveNode: 'ccis-08' },
  ccjs:      { pathway: 'path-ccis-alumni',       arriveNode: 'ccjs-06' },
 // con:       { pathway: 'path-library-registrar', arriveNode: 'con-02' },
  library:   { pathway: 'path-library-registrar', arriveNode: 'lib-02' },
  com:       { pathway: 'path-com-sas',           arriveNode: 'com-01' },
  registrar: { pathway: 'path-library-registrar', arriveNode: 'pathway-library-registrar-11' },
  alumni:    { pathway: 'path-ccis-alumni',       arriveNode: 'pathway-ccis-alumni-29' },
  gate:      { pathway: 'path-gate-cea',          arriveNode: 'pathway-gate-cea-01' },
};

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
