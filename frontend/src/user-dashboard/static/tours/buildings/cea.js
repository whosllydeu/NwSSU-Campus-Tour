// ============================================================
// Building tour: cea
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

// CEA branching (same behaviour as before):
// - cea-02 is the entry: forward jumps to Building 2 (cea-24), right
//   goes into the Building 1 ground-floor chain (cea-09).
// - cea-11 has a right turn into the stairwell (cea-18).
// - cea-14 / cea-22 / cea-32 / cea-36 are dead ends (next: null).
// - cea-31 is a left/right fork with no straight-ahead.
const CEA = {
  id: 'cea',
  title: 'College of Engineering & Architecture Building',
  subtitle: 'Building 1 & 2, Ground to 3rd Floor',
  folder: 'cea',
  nodes: [
    { id: 'cea-02', name: 'Entrance Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: -88, gps: GPS_TODO, next: 'cea-24', links: [{ nodeId: 'cea-09', dir: 'right' }] },
    // { id: 'cea-03', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-04', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-05', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-06', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-07', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-08', name: 'Hallway', caption: 'CEA Building 1 · Ground Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-09', name: 'Hallway (Back to Center)', caption: 'CEA Building 1 · Ground Floor', yaw: -87, gps: GPS_TODO },
    { id: 'cea-10', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 1 · Ground Floor → 2nd Floor', yaw: 65, gps: GPS_TODO },
    { id: 'cea-11', name: 'Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 67, gps: GPS_TODO, links: [{ nodeId: 'cea-18', dir: 'right' }] },
    { id: 'cea-12', name: 'Classrooms Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-13', name: 'Classrooms Hallway', caption: 'CEA Building 1 · 2nd Floor', yaw: 91, gps: GPS_TODO },
    // { id: 'cea-14', name: 'Classrooms Hallway (End)', caption: 'CEA Building 1 · 2nd Floor', yaw: 174, gps: GPS_TODO, next: null },
    // { id: 'cea-15', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-16', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-17', name: 'Classrooms Hallway (Other Side)', caption: 'CEA Building 1 · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-18', name: 'Stairwell to 3rd Floor', caption: 'CEA Building 1 · 2nd Floor → 3rd Floor', yaw: -39, gps: GPS_TODO, prev: 'cea-11' },
    { id: 'cea-19', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: -62, gps: GPS_TODO },
    { id: 'cea-20', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 129, gps: GPS_TODO },
    { id: 'cea-21', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 175, gps: GPS_TODO },
    { id: 'cea-22', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: -6, gps: GPS_TODO, next: null, prev: 'cea-20' },
    // { id: 'cea-23', name: 'Hallway', caption: 'CEA Building 1 · 3rd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-24', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: -46, gps: GPS_TODO, prev: 'cea-02' },
    { id: 'cea-25', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO },
    // { id: 'cea-26', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO },
    { id: 'cea-27', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 1, gps: GPS_TODO },
    { id: 'cea-28', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: -32, gps: GPS_TODO },
    { id: 'cea-29', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 2 · Ground Floor → 2nd Floor', yaw: -5, gps: GPS_TODO },
    { id: 'cea-30', name: 'Stairwell to 2nd Floor', caption: 'CEA Building 2 · Ground Floor → 2nd Floor', yaw: -40, gps: GPS_TODO },
    { id: 'cea-31', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO, next: null, links: [{ nodeId: 'cea-33', dir: 'left' }, { nodeId: 'cea-32', dir: 'right' }] }, // TODO yaw
    { id: 'cea-32', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 2, gps: GPS_TODO, next: null },
    { id: 'cea-33', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: -91, gps: GPS_TODO, prev: 'cea-31' },
    { id: 'cea-34', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 92, gps: GPS_TODO },
    { id: 'cea-35', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: -5, gps: GPS_TODO },
    { id: 'cea-36', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 2, gps: GPS_TODO, next: null },
    { id: 'cea-37', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-38', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-39', name: 'Hallway', caption: 'CEA Building 2 · 2nd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-40', name: 'Stairwell Going Down', caption: 'CEA Building 2 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-41', name: 'Stairwell Going Down', caption: 'CEA Building 2 · 2nd Floor → Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-42', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-43', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-44', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-45', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-46', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-47', name: 'Hallway Toward COM Building', caption: 'CEA Building 2 → College of Management (COM)', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-48', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-49', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-50', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-51', name: 'Ground Floor Area', caption: 'CEA Building 2 · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'cea-52', name: 'Parking Area', caption: 'CEA Building 2 · Exterior / Parking', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

export default CEA;
