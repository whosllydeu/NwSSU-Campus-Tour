export const CONNECTIONS = [
  { from: 'pathway-library-registrar-01', to: 'lib-02', fromDir: 'back', toDir: 'back' },
  { from: 'pathway-library-registrar-11', to: 'pathway-ccis-alumni-01', fromDir: 'forward', toDir: 'back' },
  //{ from: 'pathway-library-registrar-10', to: 'con-02', fromDir: 'left', toDir: 'right' },
  { from: 'pathway-gate-coed-14', to: 'coed-40', fromYaw: -145, toDir: 'right', label: 'Walk to College of Education' },
  { from: 'pathway-ccis-alumni-27', to: 'pathway-gate-coed-25', fromDir: 'left', toDir: 'forward' },
  { from: 'pathway-gate-coed-17', to: 'pathway-ccis-alumni-21', fromDir: 'forward', toDir: 'left' },
  { from: 'pathway-ccis-alumni-09', to: 'ccis-08', fromDir: 'left', toDir: 'right' },
  { from: 'pathway-ccis-alumni-25', to: 'ccjs-06', fromDir: 'left', oneWay: true },
  { from: 'ccjs-06', to: 'pathway-ccis-alumni-26', fromDir: 'right', oneWay: true, label: 'Exit to Pathway' },
  { from: 'pathway-gate-cea-08', to: 'cea-25', fromDir: 'right', toDir: 'left', label: 'CEA Building 2' },
  { from: 'pathway-gate-cea-10', to: 'cea-02', fromDir: 'right', toDir: 'back', label: 'Enter College of Engineering & Architecture' },
  {
    from: 'pathway-gate-cea-12', to: 'com-01', fromDir: 'right', toDir: 'back',
    label: 'Walk to the Second Building of College of Management',
  },
  {
    from: 'pathway-gate-cea-12', to: 'pathway-com-sas-01', fromDir: 'forward', toDir: 'back',
    label: 'Continue on COM → SAS Pathway',
  },
  { from: 'pathway-com-sas-14', to: 'cat-09', fromDir: 'forward', toDir: 'back' },

  {
    from: 'pathway-com-sas-03', to: 'com-15', fromDir: 'right', toDir: 'back',
    label: 'First Building of College of Management',
  },
  { from: 'pathway-com-sas-07', to: 'pathway-library-registrar-01', fromYaw: -79, toDir: 'left', label: 'Walk to Library' },

  {
    from: 'pathway-gate-cea-01', to: 'pathway-ccis-alumni-02', fromDir: 'left', toDir: 'right',
    label: 'Walk toward Library / Registrar', returnLabel: 'Back to Main Gate',
  },

  {
    from: 'pathway-ccis-alumni-02', to: 'pathway-ccis-alumni-02b', fromDir: 'right', toDir: 'back',
    label: 'IMCO Corridor', returnLabel: 'Back to CCIS → Alumni Pathway',
  },

  {
    from: 'pathway-gate-coed-03', to: 'pathway-gate-cea-01', fromDir: 'back', oneWay: true,
    label: 'Back to Main Gate',
  },
];