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
    { id: 'pathway-ccis-alumni-01', yaw: 0, gps: [12.07086, 124.59671] }, // TODO yaw
    { id: 'pathway-ccis-alumni-02', yaw: 0, gps: [12.07091, 124.59670] }, // TODO yaw
    // IMCO office corridor, stairs ahead — between photos 02 and 03.
    // Image: public/panoramas/pathways/coed-alumni/pathway-coed-alumni-02b.jpg
    {
      id: 'pathway-ccis-alumni-02b', yaw: 0, gps: [12.0709285, 124.5965891], // TODO yaw
      file: 'pathway-coed-alumni-02b.jpg',
    },
    { id: 'pathway-ccis-alumni-03', yaw: 0, gps: [12.07066, 124.59669] }, // TODO yaw
    { id: 'pathway-ccis-alumni-04', yaw: 0, gps: [12.07064, 124.59673] }, // TODO yaw
    { id: 'pathway-ccis-alumni-05', yaw: 0, gps: [12.07067, 124.59642] }, // TODO yaw
    { id: 'pathway-ccis-alumni-06', yaw: 0, gps: [12.07068, 124.59644] }, // TODO yaw
    { id: 'pathway-ccis-alumni-07', yaw: 0, gps: [12.07068, 124.59644] }, // TODO yaw
    { id: 'pathway-ccis-alumni-08', yaw: 0, gps: [12.07064, 124.59634] }, // TODO yaw
    { id: 'pathway-ccis-alumni-09', yaw: 0, gps: [12.07066, 124.59638] }, // TODO yaw
    { id: 'pathway-ccis-alumni-10', yaw: 0, gps: [12.07067, 124.59639] }, // TODO yaw
    { id: 'pathway-ccis-alumni-11', yaw: 0, gps: [12.07067, 124.59640] }, // TODO yaw
    { id: 'pathway-ccis-alumni-12', yaw: 0, gps: [12.07042, 124.59633] }, // TODO yaw
    { id: 'pathway-ccis-alumni-13', yaw: 0, gps: [12.07022, 124.59619] }, // TODO yaw
    { id: 'pathway-ccis-alumni-14', yaw: 0, gps: [12.07019, 124.59620] }, // TODO yaw
    { id: 'pathway-ccis-alumni-15', yaw: 0, gps: [12.07008, 124.59616] }, // TODO yaw
    { id: 'pathway-ccis-alumni-16', yaw: 0, gps: [12.06989, 124.59621] }, // TODO yaw
    { id: 'pathway-ccis-alumni-17', yaw: 0, gps: [12.06996, 124.59617] }, // TODO yaw
    { id: 'pathway-ccis-alumni-18', yaw: 0, gps: [12.07000, 124.59625] }, // TODO yaw
    { id: 'pathway-ccis-alumni-19', yaw: 0, gps: [12.07002, 124.59626] }, // TODO yaw
    { id: 'pathway-ccis-alumni-20', yaw: 0, gps: [12.07003, 124.59626] }, // TODO yaw
    { id: 'pathway-ccis-alumni-21', yaw: 0, gps: [12.07011, 124.59601] }, // TODO yaw
    { id: 'pathway-ccis-alumni-22', yaw: 0, gps: [12.07027, 124.59592] }, // TODO yaw
    { id: 'pathway-ccis-alumni-23', yaw: 0, gps: [12.07025, 124.59584] }, // TODO yaw
    { id: 'pathway-ccis-alumni-24', yaw: 0, gps: [12.07021, 124.59576] }, // TODO yaw
    { id: 'pathway-ccis-alumni-25', yaw: 0, gps: [12.07034, 124.59573] }, // TODO yaw
    { id: 'pathway-ccis-alumni-26', yaw: 0, gps: [12.07034, 124.59563] }, // TODO yaw
    { id: 'pathway-ccis-alumni-27', yaw: 0, gps: [12.07037, 124.59555] }, // TODO yaw
    { id: 'pathway-ccis-alumni-28', yaw: 0, gps: [12.07039, 124.59548] }, // TODO yaw
    { id: 'pathway-ccis-alumni-29', yaw: 0, gps: GPS_TODO }, // TODO yaw
  ],
};

export default PATH_CCIS_ALUMNI;