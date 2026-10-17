import { GPS_TODO } from '../shared';

const ADMIN = {
  id: 'president',
  title: 'Administration Building',
  subtitle: 'Ground Floor',
  folder: 'admin',
  nodes: [
    { id: 'admin-02', name: 'Approach to Admin Building', caption: 'Auxiliary Building → Administration Building', yaw: -89, gps: GPS_TODO },
    { id: 'admin-03', name: 'Administration Building Entrance', caption: 'Auxiliary Building → Administration Building', yaw: 0, gps: GPS_TODO },
    { id: 'admin-04', name: 'Records Office', caption: 'Administration Building · Ground Floor', yaw: 0, gps: GPS_TODO, star: true,
      office: { name: 'Records Office', text: 'Handles student and personnel records for the Administration Building.' } },
    { id: 'admin-05', name: 'Stairs to Admin Office', caption: 'Administration Building · Ground Floor → Upper Floor', yaw: 0, gps: GPS_TODO },
    { id: 'admin-06', name: 'Stairwell Landing (Toward Admin Office)', caption: 'Administration Building · Upper Floor', yaw: 0, gps: GPS_TODO },
  ],
};

export default ADMIN;
