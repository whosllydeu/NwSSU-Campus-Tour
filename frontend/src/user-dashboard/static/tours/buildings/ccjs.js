// ============================================================
// Building tour: ccjs
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

const CCJS = {
  id: 'ccjs',
  title: 'College of Criminal Justice & Science Building',
  subtitle: 'Ground to 3rd Floor',
  folder: 'ccjs',
  nodes: [
    { id: 'ccjs-01', name: 'Quadrangle (Between Wings)', caption: 'CCJS · Ground Floor', yaw: -31, gps: GPS_TODO },
    { id: 'ccjs-02', name: 'Covered Parking Walkway', caption: 'CCJS · Ground Floor', yaw: -31, gps: GPS_TODO },
    { id: 'ccjs-03', name: 'Covered Parking Walkway', caption: 'CCJS · Ground Floor', yaw: -1, gps: GPS_TODO },
    { id: 'ccjs-04', name: 'CAS Faculty Room', caption: 'CCJS · Ground Floor', yaw: -1, gps: GPS_TODO, star: true,
      office: { name: 'CAS Faculty Room', text: 'Faculty room located along the ground-floor walkway of the building.' } },
    { id: 'ccjs-05', name: 'Stairwell Landing', caption: 'CCJS · Ground Floor', yaw: 85, gps: GPS_TODO },
    { id: 'ccjs-06', name: 'Ground Floor (Utility Room Area)', caption: 'CCJS · Ground Floor', yaw: 86, gps: GPS_TODO },
    // { id: 'ccjs-07', name: 'Ground Floor (Utility Room Area)', caption: 'CCJS · Ground Floor → 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-08', name: 'Stairwell (Going Up to 2nd Floor)', caption: 'CCJS · Ground Floor → 2nd Floor', yaw: 14, gps: GPS_TODO },
    { id: 'ccjs-09', name: '2nd Floor Hallway', caption: 'CCJS · 2nd Floor', yaw: -92, gps: GPS_TODO },
    { id: 'ccjs-10', name: 'Criminology Laboratory', caption: 'CCJS · 2nd Floor', yaw: -93, gps: GPS_TODO, star: true,
      office: { name: 'Criminology Laboratory', text: 'Laboratory used for Criminology program classes and practicals.' } },
    { id: 'ccjs-11', name: 'ACAD 03', caption: 'CCJS · 2nd Floor', yaw: -91, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 03', text: 'Faculty/academic room on the 2nd floor of the CCJS building.' } },
    { id: 'ccjs-12', name: 'ACAD 01 / DEVCOM Lab (Campus Radio)', caption: 'CCJS · 2nd Floor', yaw: -95, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 01 / DEVCOM Lab', text: 'Academic room that also houses the campus radio station, DYNW 89.5 Kauswagan Radio.' } },
    { id: 'ccjs-13', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-14', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: -6, gps: GPS_TODO },
    { id: 'ccjs-15', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: 0, gps: GPS_TODO },
    { id: 'ccjs-16', name: '2nd Floor Hallway (Other Side)', caption: 'CCJS · 2nd Floor', yaw: -2, gps: GPS_TODO },
    { id: 'ccjs-17', name: 'Wash Area (2nd Floor, Other Side)', caption: 'CCJS · 2nd Floor', yaw: 94, gps: GPS_TODO },
    { id: 'ccjs-18', name: 'Stairwell to 3rd Floor', caption: 'CCJS · 2nd Floor → 3rd Floor', yaw: 16, gps: GPS_TODO },
    { id: 'ccjs-19', name: 'Stairwell Landing (3rd Floor Arrival)', caption: 'CCJS · 3rd Floor', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'ccjs-20', name: 'ACAD 301', caption: 'CCJS · 3rd Floor', yaw: -88, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 301', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-21', name: 'ACAD 302', caption: 'CCJS · 3rd Floor', yaw: -91, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 302', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-22', name: 'ACAD 303', caption: 'CCJS · 3rd Floor', yaw: -90, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 303', text: 'Academic room on the 3rd floor, with crime-scene investigation exhibit boards displayed outside the door.' } },
    { id: 'ccjs-23', name: 'ACAD 304', caption: 'CCJS · 3rd Floor', yaw: -92, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 304', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-24', name: 'ACAD 305', caption: 'CCJS · 3rd Floor', yaw: -96, gps: GPS_TODO, star: true,
      office: { name: 'ACAD 305', text: 'Academic room on the 3rd floor of the CCJS building.' } },
    { id: 'ccjs-25', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -93, gps: GPS_TODO },
    { id: 'ccjs-26', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -4, gps: GPS_TODO },
    { id: 'ccjs-27', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -4, gps: GPS_TODO },
    { id: 'ccjs-28', name: '3rd Floor Hallway (Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -2, gps: GPS_TODO },
    { id: 'ccjs-29', name: '3rd Floor Hallway (End, Facing Teacher Education Building)', caption: 'CCJS · 3rd Floor', yaw: -3, gps: GPS_TODO },
    { id: 'ccjs-30', name: 'Stairwell Landing (Near Toilets)', caption: 'CCJS · 3rd Floor', yaw: -92, gps: GPS_TODO },
    { id: 'ccjs-31', name: 'Toilets', caption: 'CCJS · 3rd Floor', yaw: 180, gps: GPS_TODO },
  ],
};

export default CCJS;
