import { buildTourGraph } from '../utils/tourGraph';
import {
  TOUR_DEFS,
  CONNECTIONS,
  WALK_DEFAULT_START,
  WALK_ROUTES,
  PATH_LINKS,
} from './tours';

export { CONNECTIONS, WALK_DEFAULT_START, WALK_ROUTES, PATH_LINKS, TOUR_DEFS };

export const TOUR_GRAPH = buildTourGraph(TOUR_DEFS, CONNECTIONS);

export const nwssuTourNodes = Object.fromEntries(
  Object.values(TOUR_GRAPH.tours).map((t) => [t.id, t.nodeIds.map((id) => TOUR_GRAPH.byId[id])])
);
