// ============================================================
// Building tour: library
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

const LIBRARY = {
  id: 'library',
  aliases: ['lib'],
  title: 'NwSSU Library',
  subtitle: '',
  folder: 'library',
  nodes: [
    { id: 'lib-02', name: 'Stairwell Landing', caption: 'NwSSU Library', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'lib-03', name: 'Hallway', caption: 'NwSSU Library', yaw: 102, gps: GPS_TODO },
    { id: 'lib-01', name: 'Entrance & Stairwell', caption: 'NwSSU Library', yaw: 26, gps: GPS_TODO },
  ],
};

export default LIBRARY;
