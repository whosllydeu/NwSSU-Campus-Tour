export const QUICK = [
  { id: 'library', icon: '📚', label: 'Library' },
  { id: 'registrar', icon: '📋', label: 'Registrar' },
  { id: 'cashier', icon: '💳', label: 'Cashier' },
  { id: 'canteen', icon: '🍽️', label: 'Canteen' },
  { id: 'president', icon: '🏛️', label: 'President' },
  { id: 'hotel', icon: '🏨', label: 'Hotel' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'alumni', icon: '🎓', label: 'Alumni' },
];

export const COLLEGES = [
  { id: 'cat',  color: '#2d5a27', code: 'CAT',  title: 'College of Agriculture', desc: 'Agricultural sciences, crop production, animal science & agri-business management' },
  { id: 'ccis', color: '#1a3a6b', code: 'CCIS', title: 'College of Computing & Information Sciences', desc: 'IT, Computer Science, Information Systems & Software Engineering programs' },
  { id: 'ccjs', color: '#8b1a1a', code: 'CCJS', title: 'College of Criminal Justice & Science', desc: 'Criminology, forensic science & criminal justice administration' },
  { id: 'coed', color: '#c8a84b', code: 'COED', title: 'College of Education', desc: 'Teacher education programs for elementary, secondary & special education' },
  { id: 'con',  color: '#1a6b5a', code: 'CON',  title: 'College of Nursing', desc: 'BS Nursing with clinical training, simulation labs & health sciences' },
  { id: 'com',  color: '#b5611a', code: 'COM',  title: 'College of Management', desc: 'Business administration, management, entrepreneurship & hospitality programs' },
  { id: 'cea',  color: '#4a1a6b', code: 'CEA',  title: 'College of Engineering & Architecture', desc: 'Civil, electrical, mechanical engineering & architecture programs' },
];

export const MINI_MAP = [
  { code: 'CAT',  left: '8%',  top: '12%', bg: '#2d5a27' },
  { code: 'CCIS', left: '29%', top: '10%', bg: '#1a3a6b' },
  { code: 'LIB',  left: '50%', top: '8%',  bg: '#555' },
  { code: 'COED', left: '68%', top: '11%', bg: '#c8a84b' },
  { code: 'CEA',  left: '85%', top: '10%', bg: '#4a1a6b' },
  { code: 'CON',  left: '9%',  top: '44%', bg: '#1a6b5a' },
  { code: 'COM',  left: '29%', top: '42%', bg: '#b5611a' },
  { code: 'ADM',  left: '47%', top: '40%', bg: '#2c3e50', big: true },
  { code: 'CCJS', left: '83%', top: '42%', bg: '#8b1a1a' },
];

/* 
  Mock data la ine pero an position property dapat sugad an implementation 
  para dire marubat sa map or mag error 

  pwede liwat an implementation is sugadsine
  position: [buildings.lat, buildings.long] 
  from useCampusData() na hook
*/
export const CAMPUS_BUILDING = [
  {
    abbr: "OVL",
    name: "NwSSU Oval",
    position: [12.071099, 124.596009]
  },
  {
    abbr: "COM-DO",
    name: "COM Dean's Office",
    position: [12.072248, 124.597205]
  },
  {
    abbr: "REG",
    name: "University Registrar",
    position: [12.071146, 124.596655]
  },
  {
    abbr: "SAS",
    name: "Student Affairs and Services",
    position: [12.071836, 124.595805]
  },
  {
    abbr: "COE",
    name: "College of Engineering",
    position: [12.071865, 124.597009],
  },
  {
    abbr: "COM",
    name: "College of Management",
    position: [12.072298, 124.59667],
  },
  {
    abbr: "CCJS",
    name: "College of Criminal Justice and Sciences",
    position: [12.070170, 124.595760],
  },
  {
    abbr: "COED",
    name: "College of Education",
    position: [12.069968, 124.595813],
  },
  {
    abbr: "CAT",
    name: "College of Agriculture and Technology",
    position: [12.071484, 124.595574],
  },
  {
    abbr: "CON",
    name: "College of Nursing",
    position: [12.071007, 124.596618],
  },
  {
    abbr: "CCIS",
    name: "College of Computing and Information Sciences",
    position: [12.070532, 124.59643],
  },
];