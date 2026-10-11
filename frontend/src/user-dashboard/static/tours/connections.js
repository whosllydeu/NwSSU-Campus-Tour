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
  // 4
  { from: 'pathway-gate-coed-14', to: 'coed-07', fromDir: 'left', toDir: 'right' }, // TODO tune toDir
  // 5
  { from: 'pathway-ccis-alumni-27', to: 'pathway-gate-coed-25', fromDir: 'left', toDir: 'forward' }, // TODO tune fromDir
  // 6
  { from: 'pathway-ccis-alumni-09', to: 'ccis-08', fromDir: 'left', toDir: 'right' }, // TODO tune
  // 7 + 8 — enter CCJS from node 25, leave CCJS toward node 26
  { from: 'pathway-ccis-alumni-25', to: 'ccjs-06', fromDir: 'left', oneWay: true }, // TODO tune
  { from: 'ccjs-06', to: 'pathway-ccis-alumni-26', fromDir: 'right', oneWay: true, label: 'Exit to Pathway' }, // TODO tune
  // 9
  { from: 'pathway-gate-cea-01', to: 'pathway-gate-coed-03', fromDir: 'back', toDir: 'right' }, // TODO tune toDir
  // 10
  { from: 'pathway-gate-cea-08', to: 'cea-25', fromDir: 'right', toDir: 'left' }, // TODO tune
  // 11
  { from: 'pathway-gate-cea-10', to: 'cea-02', fromDir: 'right', toDir: 'back' },
  // 12
  { from: 'pathway-gate-cea-14', to: 'pathway-com-sas-01', fromDir: 'forward', toDir: 'back' },
  // 13
  { from: 'pathway-com-sas-14', to: 'cat-09', fromDir: 'forward', toDir: 'back' }, // TODO tune toDir

  // Carried over from the old NODE_OVERRIDES (not in the new list).
  // Delete these two lines if they are no longer correct.
  { from: 'pathway-com-sas-03', to: 'com-01', fromDir: 'left', toDir: 'back', label: 'Enter College of Management' },
  { from: 'pathway-com-sas-07', to: 'pathway-library-registrar-01', fromDir: 'right', toDir: 'left', label: 'Walk to Library' },
];
