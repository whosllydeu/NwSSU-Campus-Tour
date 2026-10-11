// ============================================================
// Building tour: president
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

const ADMIN = {
  id: 'president',
  title: 'Administration Building',
  subtitle: 'Ground Floor',
  folder: 'admin',
  nodes: [
    // { id: 'admin-01', name: 'Pathway from Auxiliary Building', caption: 'Auxiliary Building → Administration Building', yaw: 0, gps: GPS_TODO },
    { id: 'admin-02', name: 'Approach to Admin Building', caption: 'Auxiliary Building → Administration Building', yaw: -89, gps: GPS_TODO },
    { id: 'admin-03', name: 'Administration Building Entrance', caption: 'Auxiliary Building → Administration Building', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'admin-04', name: 'Records Office', caption: 'Administration Building · Ground Floor', yaw: 0, gps: GPS_TODO, star: true,
      office: { name: 'Records Office', text: 'Handles student and personnel records for the Administration Building.' } }, // TODO yaw
    { id: 'admin-05', name: 'Stairs to Admin Office', caption: 'Administration Building · Ground Floor → Upper Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'admin-06', name: 'Stairwell Landing (Toward Admin Office)', caption: 'Administration Building · Upper Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

export default ADMIN;
