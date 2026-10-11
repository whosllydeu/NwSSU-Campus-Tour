// ============================================================
// Building tour: cat
// One tour per file — edit ONLY this file to fix this tour.
// Format, angles and the 🧭 tuning guide: see ../../tourNodes.js
// Registered in ../index.js · cross-tour links live in ../connections.js
// ============================================================
import { GPS_TODO } from '../shared';

// ── CAT — the reference tour. Links are hand-authored exactly as
// in the original CAT graph (old ids building-1…18 → cat-01…18).
const CAT = {
  id: 'cat',
  title: 'College of Agriculture & Technology Building',
  subtitle: 'Ground & 2nd Floor',
  folder: 'cat',
  sequential: false,
  nodes: [
    { id: 'cat-01', name: 'Covered Walkway (Near Bleachers)', caption: 'CAT · Ground Floor', yaw: 3, gps: [12.071104, 124.595427],
      links: [
        { nodeId: 'cat-02', position: { yaw: '0deg', pitch: '0deg' } }, // pitch was "180deg" (invalid) — set to 0
      ] },
    { id: 'cat-02', name: 'Covered Walkway (Near Bleachers)', caption: 'CAT · Ground Floor', yaw: -7, gps: [12.071246, 124.595470],
      links: [
        { nodeId: 'cat-01', position: { yaw: '180deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-03', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071311, 124.595526],
      links: [
        { nodeId: 'cat-02', position: { yaw: '-90deg', pitch: '0deg' } },
        { nodeId: 'cat-18', position: { yaw: '0deg', pitch: '0deg' } },
        { nodeId: 'cat-04', position: { yaw: '90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-04', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071353, 124.595529],
      links: [
        { nodeId: 'cat-05', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '-90deg', pitch: '0deg' } }, // added: back link was missing
      ] },
    { id: 'cat-05', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: [12.071443, 124.595596],
      links: [
        { nodeId: 'cat-06', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-06', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-07', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-05', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-07', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-08', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-06', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-08', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 95, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-09', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-07', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-09', name: 'Ground Floor Area', caption: 'CAT · Ground Floor', yaw: 99, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-08', position: { yaw: '-90deg', pitch: '0deg' } },
        { nodeId: 'cat-10', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-10', name: 'Ground Floor Area', caption: 'CAT · Ground Floor → 2nd Floor', yaw: 95, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-09', position: { yaw: '-40deg', pitch: '0deg' } },
        { nodeId: 'cat-11', position: { yaw: '40deg', pitch: '0deg' } },
      ] },
    { id: 'cat-11', name: '2nd Floor Landing', caption: 'CAT · 2nd Floor', yaw: -90, gps: GPS_TODO, // yaw follows its link to cat-12
      links: [
        { nodeId: 'cat-10', position: { yaw: '0deg', pitch: '0deg' } },
        { nodeId: 'cat-12', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-12', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-11', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-13', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-13', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-12', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-14', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-14', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -12, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-13', position: { yaw: '-180deg', pitch: '0deg' } },
        { nodeId: 'cat-15', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-15', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-14', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-16', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-16', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -93, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-15', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-17', position: { yaw: '-90deg', pitch: '0deg' } },
      ] },
    { id: 'cat-17', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: -90, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-16', position: { yaw: '90deg', pitch: '0deg' } },
        { nodeId: 'cat-18', position: { yaw: '0deg', pitch: '0deg' } },
      ] },
    { id: 'cat-18', name: '2nd Floor Hallway', caption: 'CAT · 2nd Floor', yaw: 40, gps: GPS_TODO,
      links: [
        { nodeId: 'cat-17', position: { yaw: '-40deg', pitch: '0deg' } },
        { nodeId: 'cat-03', position: { yaw: '40deg', pitch: '0deg' } },
      ] },
  ],
};

export default CAT;
