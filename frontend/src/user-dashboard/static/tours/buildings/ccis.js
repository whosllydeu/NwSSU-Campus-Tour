// ============================================================
// Building tour: ccis
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

const CCIS = {
  id: 'ccis',
  title: 'CCIS Building',
  subtitle: 'Ground Floor',
  folder: 'ccis',
  nodes: [
    { id: 'ccis-01', name: 'Stairwell to Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-02', name: 'Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-03', name: 'Management Information System (MIS) Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'MIS Office', text: 'The Management Information System (MIS) Office handles the college’s records, enrollment data, and information systems.' } },
    { id: 'ccis-04', name: 'CCIS Faculty Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO,
      office: { name: 'CCIS Faculty Office', text: 'Workspace for CCIS faculty, used for consultations and program coordination.' } },
    { id: 'ccis-05', name: 'Hallway', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-06', name: 'Faculty Room', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'Faculty Room', text: 'The CCIS Faculty Room — staff workspace and student consultation area.' } },
    { id: 'ccis-07', name: 'CCIS Dean\'s Office', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO, star: true,
      office: { name: 'CCIS Dean\'s Office', text: 'Office of the College Dean, College of Computing and Information Sciences.' } },
    { id: 'ccis-08', name: 'Middle Stairwell Landing', caption: 'CCIS · Ground Floor', yaw: -5, gps: GPS_TODO },
    { id: 'ccis-09', name: 'Conference Room (to Middle Stairwell)', caption: 'CCIS · Ground Floor → 2nd Floor', yaw: -5, gps: GPS_TODO },
  ],
};

export default CCIS;
