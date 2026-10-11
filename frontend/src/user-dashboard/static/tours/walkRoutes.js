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
