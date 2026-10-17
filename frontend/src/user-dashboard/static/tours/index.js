import CAT from './buildings/cat';
import CCIS from './buildings/ccis';
import CON from './buildings/nursing';
import ADMIN from './buildings/admin';
import COED from './buildings/coed';
import CCJS from './buildings/ccjs';
import CEA from './buildings/cea';
import COM from './buildings/com';
import LIBRARY from './buildings/library';
import PATH_GATE_COED from './pathways/gate-coed';
import PATH_CCIS_ALUMNI from './pathways/ccis-alumni';
import PATH_GATE_CEA from './pathways/gate-cea';
import PATH_LIBRARY_REGISTRAR from './pathways/library-registrar';
import PATH_COM_SAS from './pathways/com-sas';

export const BUILDING_TOURS = [
  CAT, CCIS, CON, ADMIN, COED, CCJS, CEA, COM, LIBRARY,
];

export const PATHWAY_TOURS = [
  PATH_GATE_COED, PATH_CCIS_ALUMNI, PATH_GATE_CEA, PATH_LIBRARY_REGISTRAR, PATH_COM_SAS,
];

export const TOUR_DEFS = [...BUILDING_TOURS, ...PATHWAY_TOURS];

export { CONNECTIONS } from './connections';
export { WALK_DEFAULT_START, WALK_ROUTES, PATH_LINKS } from './walkRoutes';