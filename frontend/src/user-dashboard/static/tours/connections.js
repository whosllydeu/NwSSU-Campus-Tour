// ============================================================
// CONNECTIONS — explicit node → node links between tours.
// Works for pathway→pathway, pathway→building, building→pathway
// and building→building, at ANY node (not just first/last).
//
//   from / to      node ids
//   fromDir        where the arrow sits on the `from` photo:
//                  'forward' | 'back' | 'left' | 'right' (relative
//                  to that node's yaw)       — or fromYaw: 75 (exact)
//   toDir / toYaw  where the RETURN arrow sits on the `to` photo
//                  (default 'back')
//   oneWay: true   no return arrow
//   label          text on the floating pin (default "Enter <building>")
//
// Each connection is two-way unless oneWay is set, so a pathway can
// be walked in both directions without duplicating data.
// If a requested direction would overlap an existing arrow, the
// builder picks the next free side and logs a console warning in
// dev — replace the guess with an exact fromYaw/toYaw when tuning.
// All dirs marked TODO are best guesses until tuned on-site.
// ============================================================
export const CONNECTIONS = [
  // 1
  { from: 'pathway-library-registrar-01', to: 'lib-02', fromDir: 'back', toDir: 'back' },
  // 2
  { from: 'pathway-library-registrar-11', to: 'pathway-ccis-alumni-01', fromDir: 'forward', toDir: 'back' },
  // 3
  { from: 'pathway-library-registrar-10', to: 'con-02', fromDir: 'left', toDir: 'right' }, // TODO tune
  // 4 — "Walk to College of Education" pin on Gate→COED photo 13
  //     (-145° = on the building, 45° clear of the forward arrow at -100°)
  { from: 'pathway-gate-coed-13', to: 'coed-07', fromYaw: -145, toDir: 'right', label: 'Walk to College of Education' }, // TODO tune toDir
  // 5 — Gate→COED ends (photo 25) where CCIS→Alumni photo 27 is
  { from: 'pathway-ccis-alumni-27', to: 'pathway-gate-coed-25', fromDir: 'left', toDir: 'forward' }, // TODO tune fromDir
  // 5b — Gate→COED side path: photo 17's forward arrow leads to CCIS→Alumni photo 21
  { from: 'pathway-gate-coed-17', to: 'pathway-ccis-alumni-21', fromDir: 'forward', toDir: 'left' }, // TODO tune toDir
  // 6
  { from: 'pathway-ccis-alumni-09', to: 'ccis-08', fromDir: 'left', toDir: 'right' }, // TODO tune
  // 7 + 8 — enter CCJS from node 25, leave CCJS toward node 26
  { from: 'pathway-ccis-alumni-25', to: 'ccjs-06', fromDir: 'left', oneWay: true }, // TODO tune
  { from: 'ccjs-06', to: 'pathway-ccis-alumni-26', fromDir: 'right', oneWay: true, label: 'Exit to Pathway' }, // TODO tune
  // 9 — Main Gate (Gate→CEA photo 01) → Gate→COED photo 03 is a plain arrow
  //     (no pin); it is set in pathways/gate-cea.js.
  // 10
  { from: 'pathway-gate-cea-08', to: 'cea-25', fromDir: 'right', toDir: 'left' }, // TODO tune
  // 11
  { from: 'pathway-gate-cea-10', to: 'cea-02', fromDir: 'right', toDir: 'back' },
  // 12 — Gate→CEA ends at photo 12.
  //   a) into the FIRST building of College of Management (com-01 … com-10)
  {
    from: 'pathway-gate-cea-12', to: 'com-01', fromDir: 'right', toDir: 'back', // TODO tune
    label: 'Walk to the First Building of College of Management',
  },
  //   b) keep the outdoor path so "Walk there!" routes (e.g. to the Library) stay outside
  {
    from: 'pathway-gate-cea-12', to: 'pathway-com-sas-01', fromDir: 'forward', toDir: 'back',
    label: 'Continue on COM → SAS Pathway',
  },
  // 13
  { from: 'pathway-com-sas-14', to: 'cat-09', fromDir: 'forward', toDir: 'back' }, // TODO tune toDir

  // SECOND building of College of Management (com-14 … com-20).
  // (com-11 … com-13 are the road between the first and second building.)
  {
    from: 'pathway-com-sas-03', to: 'com-14', fromDir: 'right', toDir: 'back', // TODO tune toDir
    label: 'Second Building of College of Management',
  },
  // "Walk to Library" pin sits on the Library passage (yaw -79°, tuned on-site with 🧭)
  { from: 'pathway-com-sas-07', to: 'pathway-library-registrar-01', fromYaw: -79, toDir: 'left', label: 'Walk to Library' },

  // Main Gate ↔ CCIS → Alumni photo 02 (≈10 m apart). Same link the Map's
  // walkway graph uses (CONNECTOR#2: GATE-CEA:1 ↔ CCIS-ALUMNI:2), so a route
  // from the Gate toward the Library / Registrar / Nursing side can be walked
  // in 360° the same way the Map draws it.
  {
    from: 'pathway-gate-cea-01', to: 'pathway-ccis-alumni-02', fromDir: 'left', toDir: 'right', // TODO tune both on-site with 🧭
    label: 'Walk toward Library / Registrar', returnLabel: 'Back to Main Gate',
  },

  // Registrar waiting area (Library → Registrar photo 11) straight down the
  // corridor to the IMCO office photo. Same link as the Map's CONNECTOR#5,
  // so Nursing / Library → CCIS no longer zig-zags out to the road.
  {
    from: 'pathway-library-registrar-11', to: 'pathway-ccis-alumni-02b', fromDir: 'left', toDir: 'back', // TODO tune both on-site with 🧭
    label: 'Walk toward CCIS', returnLabel: 'Walk to Registrar / Library',
  },
];