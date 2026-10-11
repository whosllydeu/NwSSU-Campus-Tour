// ============================================================
// Building tour: con
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

const CON = {
  id: 'con',
  title: 'College of Nursing Building',
  subtitle: 'Ground Floor',
  folder: 'co_n',
  nodes: [
    { id: 'con-01', name: 'Entrance & Stairwell', caption: 'College of Nursing · Ground Floor', yaw: 26, gps: GPS_TODO },
    { id: 'con-02', name: 'Stairwell Landing', caption: 'College of Nursing · Ground Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'con-03', name: 'Hallway', caption: 'College of Nursing · Ground Floor', yaw: 102, gps: GPS_TODO },
    { id: 'con-04', name: 'Faculty Exit / Anatomy & Physiology Lab', caption: 'College of Nursing · Ground Floor', yaw: 95, gps: GPS_TODO, star: true,
      office: { name: 'Anatomy & Physiology Lab', text: 'Laboratory used for anatomy and physiology classes, accessible through the faculty exit hallway.' } },
    { id: 'con-05', name: 'Nursing Classroom 1', caption: 'College of Nursing · Ground Floor', yaw: 95, gps: GPS_TODO, star: true,
      office: { name: 'Nursing Classroom 1', text: 'Lecture room for College of Nursing classes.' } },
    { id: 'con-06', name: 'Nursing Classroom 2', caption: 'College of Nursing · Ground Floor', yaw: 76, gps: GPS_TODO, star: true,
      office: { name: 'Nursing Classroom 2', text: 'Lecture room for College of Nursing classes.' } },
    { id: 'con-07', name: 'Hallway (Toward CCIS Building)', caption: 'College of Nursing · Ground Floor → CCIS Building', yaw: 90, gps: GPS_TODO },
    { id: 'con-08', name: 'Hallway to 3rd Floor Stairs', caption: 'College of Nursing · Ground Floor', yaw: -23, gps: GPS_TODO },
    { id: 'con-09', name: 'Stairs to 3rd Floor', caption: 'College of Nursing · Ground Floor → 3rd Floor', yaw: -60, gps: GPS_TODO },
    { id: 'con-10', name: 'Central Supply Room', caption: 'College of Nursing · 3rd Floor', yaw: 0, gps: GPS_TODO, star: true,
      office: { name: 'Central Supply Room', text: 'Supply room located at the end of the 3rd floor hallway.' } }, // TODO yaw
  ],
};

export default CON;
