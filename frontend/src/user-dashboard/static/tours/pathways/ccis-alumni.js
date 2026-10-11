// ============================================================
// Outdoor pathway tour: path-ccis-alumni
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

// NOTE: the connection list calls this pathway "ccis-alumni", but the
// image files on disk are still named pathway-coed-alumni-XX.JPG
// inside pathways/coed-alumni/. `fileFor` maps the new ids onto the
// existing files, so no image needs renaming. If you rename the
// folder/files later, delete `fileFor` and set folder accordingly.
const PATH_CCIS_ALUMNI = {
  id: 'path-ccis-alumni',
  aliases: ['path-coed-alumni'],
  title: 'CCIS → Alumni Building',
  subtitle: 'Outdoor Pathway',
  folder: 'pathways/coed-alumni',
  fileFor: (id) => `${id.replace('pathway-ccis-alumni', 'pathway-coed-alumni')}.JPG`,
  defaultName: 'Pathway',
  nodes: [
    { id: 'pathway-ccis-alumni-01', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-02', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-03', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-04', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-05', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-06', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-07', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-08', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-09', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-10', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-11', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-12', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-13', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-14', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-15', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-16', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-17', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-18', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-19', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-20', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-21', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-22', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-23', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-24', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-25', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-26', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-27', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-28', yaw: 0, gps: GPS_TODO }, // TODO yaw
    { id: 'pathway-ccis-alumni-29', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

export default PATH_CCIS_ALUMNI;
