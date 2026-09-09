// ============================================================
// seed.mjs — loads the real NwSSU Campus Tour data into Supabase.
//
// Uses the SERVICE ROLE key (bypasses RLS) so this only ever runs
// from your machine / CI, never from the browser. Safe to re-run —
// every insert is an upsert keyed on the table's natural unique
// column, so running it twice won't create duplicates.
//
// Usage:
//   npm install
//   npm run seed
// ============================================================
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEPARTMENTS = [
  {
    "id": "cat",
    "name": "College of Agriculture and Technology",
    "abbr": "CAT",
    "color": "#2d5a27",
    "photo": "images/cat_logo.jpg",
    "programs": [
      "BS Agriculture (Crop Science)",
      "BS Agriculture (Animal Science)",
      "BS Agricultural Engineering",
      "BS Horticulture",
      "BS Agri-Business Management"
    ],
    "faculty": [
      "Dr. Ramon Villanueva - Dean",
      "Prof. Josefina Delos Santos - Crop Science",
      "Dr. Eduardo Balmaceda - Animal Science",
      "Prof. Leila Navarro - Horticulture",
      "Dr. Arnaldo Tupas - Agricultural Engineering",
      "Prof. Gloria Castillo - Agri-Business"
    ],
    "officers": [
      "Mr. Carlo Santos - President, CAT SSC",
      "Ms. Maricel Reyes - Vice President",
      "Mr. John Bautista - Secretary",
      "Ms. Rina Cruz - Treasurer"
    ],
    "organizations": [
      "Agricultural Science Society (AGRISCI)",
      "Future Farmers of NWSSU (FFN)",
      "Horticulture Club",
      "Agri-Entrepreneurs Association"
    ]
  },
  {
    "id": "ccis",
    "name": "College of Computing & Information Sciences",
    "abbr": "CCIS",
    "color": "#1a3a6b",
    "photo": "images/Me.jpg",
    "programs": [
      "BS Computer Science",
      "BS Information Technology",
      "BS Information Systems",
      "BS Software Engineering"
    ],
    "faculty": [
      "Dr. Michelle Tan - Dean",
      "Prof. Rodel Bautista - Computer Science",
      "Dr. Arvin Dela Cruz - Networking",
      "Prof. Sandra Lee - Information Systems",
      "Prof. Mia Villanueva - Software Engineering",
      "Prof. Noel Aquino - Cybersecurity"
    ],
    "officers": [
      "Ms. Yvonne Natividad - President, CCIS SSC",
      "Mr. Allan Reyes - Vice President",
      "Ms. Tina Gomez - Secretary",
      "Mr. Marco Tan - Treasurer"
    ],
    "organizations": [
      "Computing Society (CompSoc)",
      "Developers' League of NWSSU (DLN)",
      "Cybersecurity & Networking Club (CNC)",
      "AI & Data Science Club"
    ]
  },
  {
    "id": "ccjs",
    "name": "College of Criminal Justice & Science",
    "abbr": "CCJS",
    "color": "#8b1a1a",
    "photo": "images/ccjs_logo.png",
    "programs": [
      "BS Criminology"
    ],
    "faculty": [
      "Prof. Roberto Legaspi - Dean",
      "SPO2 (Ret.) Amado Ferrer - Police Science",
      "Prof. Cecilia Mangubat - Criminalistics",
      "Atty. Dario Guzman - Criminal Law",
      "Prof. Nora Alcantara - Forensic Science"
    ],
    "officers": [
      "Mr. Jason Cortez - President, CCJS SSC",
      "Ms. Maribel Santos - Vice President",
      "Mr. Ricky Flores - Secretary",
      "Ms. Donna Cruz - Treasurer"
    ],
    "organizations": [
      "Criminology Society of NWSSU (CSN)",
      "NWSSU Criminalistics Club",
      "Law and Order Forum"
    ]
  },
  {
    "id": "coed",
    "name": "College of Education",
    "abbr": "COED",
    "color": "#c8a84b",
    "photo": "images/coed_logo.jpg",
    "programs": [
      "Bachelor of Elementary Education (BEEd)",
      "Bachelor of Secondary Education (BSEd) - English",
      "Bachelor of Secondary Education (BSEd) - Math",
      "Bachelor of Secondary Education (BSEd) - Science",
      "Bachelor of Special Needs Education (BSNEd)"
    ],
    "faculty": [
      "Dr. Paz Enriquez - Dean",
      "Prof. Eduardo Salazar - Educational Psychology",
      "Dr. Gloria Reyes - Curriculum & Instruction",
      "Prof. Hermie Dela Rosa - Math Education",
      "Prof. Connie Navarro - Science Education",
      "Prof. Roderick Espinosa - English Education"
    ],
    "officers": [
      "Ms. Kristine Alonzo - President, COED SSC",
      "Mr. Julius Mendoza - Vice President",
      "Ms. Clarice Bernal - Secretary",
      "Mr. Ryan Aquino - Treasurer"
    ],
    "organizations": [
      "Education Students Society (ESS)",
      "Math Teachers Club",
      "Future Science Educators",
      "COED Dance Troupe"
    ]
  },
  {
    "id": "con",
    "name": "College of Nursing",
    "abbr": "CON",
    "color": "#1a6b5a",
    "photo": "images/con_logo.jpg",
    "programs": [
      "BS Nursing"
    ],
    "faculty": [
      "Dr. Lourdes Catalan - Dean",
      "Prof. Alma Hernandez - Medical-Surgical Nursing",
      "Dr. Estela Jimenez - Maternal & Child Nursing",
      "Prof. Vincent Baysa - Community Health Nursing",
      "Prof. Cynthia Abad - Mental Health Nursing"
    ],
    "officers": [
      "Ms. Jennifer Ramos - President, CON SSC",
      "Mr. Lorenzo Santiago - Vice President",
      "Ms. Carla Vizcarra - Secretary",
      "Ms. Bianca Marcos - Treasurer"
    ],
    "organizations": [
      "Nursing Students Association (NSA)",
      "NWSSU Student Nurses' Guild",
      "Community Health Volunteers"
    ]
  },
  {
    "id": "com",
    "name": "College of Management",
    "abbr": "COM",
    "color": "#b5611a",
    "photo": "images/com_logo.png",
    "programs": [
      "BS Business Administration (Marketing)",
      "BS Business Administration (Management)",
      "BS Accountancy",
      "BS Hotel and Restaurant Management",
      "BS Entrepreneurship",
      "BS Tourism Management"
    ],
    "faculty": [
      "Dr. Shirley Villafuerte - Dean",
      "Prof. Domingo Tagle - Business Management",
      "CPA Rowena Manlangit - Accountancy",
      "Prof. Arlene Tan - Marketing",
      "Chef Roberto Abrea - HRM",
      "Prof. Glenda Soliman - Tourism"
    ],
    "officers": [
      "Mr. Marco Delgado - President, COM SSC",
      "Ms. Patricia Tuazon - Vice President",
      "Ms. Rhea Magpayo - Secretary",
      "Mr. Vincent Castillo - Treasurer"
    ],
    "organizations": [
      "Junior Entrepreneurs Society (JES)",
      "Junior Philippine Institute of Accountants (JPIA)",
      "Hotel and Restaurant Management Society (HRMS)",
      "Tourism Students Circle"
    ]
  },
  {
    "id": "cea",
    "name": "College of Engineering & Architecture",
    "abbr": "CEA",
    "color": "#4a1a6b",
    "photo": "images/cea_logo.jpg",
    "programs": [
      "BS Civil Engineering",
      "BS Electrical Engineering",
      "BS Mechanical Engineering",
      "BS Architecture",
      "BS Electronics Engineering"
    ],
    "faculty": [
      "Engr. Dante Padua - Dean",
      "Engr. Mario Alvarado - Civil Engineering",
      "Engr. Ernesto Quizon - Electrical Engineering",
      "Engr. Cecilio Bravo - Mechanical Engineering",
      "Arch. Florencia Reyes - Architecture",
      "Engr. Bobby Palma - Electronics Engineering"
    ],
    "officers": [
      "Mr. Francis Dimaunahan - President, CEA SSC",
      "Ms. Ria Mañibo - Vice President",
      "Mr. Aldrin Soriano - Secretary",
      "Mr. Jefferson Pascual - Treasurer"
    ],
    "organizations": [
      "Society of Civil Engineering Students (SCES)",
      "Electrical Engineering Society",
      "Mechanical Engineering Club",
      "Architecture Students Guild (ASG)",
      "Institute of Electronics Engineering Students"
    ]
  }
];

const BUILDINGS = [
  {
    "id": "cat",
    "name": "College of Agriculture Building",
    "abbr": "CAT",
    "type": "academic",
    "color": "#2d5a27",
    "emoji": "🌾",
    "lat": 12.071696,
    "lng": 124.596408,
    "photo": "images/cat_logo.jpg",
    "description": "Home of the College of Agriculture and Technology, offering programs in agricultural sciences, crop production, animal science, and agri-business management. The building features modern laboratories, demonstration farms, and classrooms.",
    "location": "North Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Faculty Room",
      "Agricultural Laboratory",
      "Student Affairs",
      "Research Center"
    ],
    "programs": [
      "BS Agriculture",
      "BS Agricultural Engineering",
      "BS Horticulture"
    ],
    "department_id": "cat"
  },
  {
    "id": "ccis",
    "name": "College of Computing & Information Sciences Building",
    "abbr": "CCIS",
    "type": "academic",
    "color": "#1a3a6b",
    "emoji": "💻",
    "lat": 12.070807,
    "lng": 124.595565,
    "photo": "images/Me.jpg",
    "description": "State-of-the-art building equipped with modern computer laboratories, networking rooms, and smart classrooms. Hosts the newest college at NWSSU, offering technology-focused programs to prepare students for the digital economy.",
    "location": "North-Central Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Computer Lab 1",
      "Computer Lab 2",
      "Networking Lab",
      "Faculty Room",
      "CCIS Student Council"
    ],
    "programs": [
      "BS Computer Science",
      "BS Information Technology",
      "BS Information Systems"
    ],
    "department_id": "ccis"
  },
  {
    "id": "ccjs",
    "name": "College of Criminal Justice & Science Building",
    "abbr": "CCJS",
    "type": "academic",
    "color": "#8b1a1a",
    "emoji": "⚖️",
    "lat": 12.071319,
    "lng": 124.595193,
    "photo": "images/ccjs_logo.png",
    "description": "Training ground for future law enforcement professionals and criminologists. Features a moot court, forensic science laboratory, and simulation rooms for practical police science training.",
    "location": "East Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Forensic Lab",
      "Moot Court Room",
      "Faculty Room",
      "CCJS Student Council"
    ],
    "programs": [
      "BS Criminology"
    ],
    "department_id": "ccjs"
  },
  {
    "id": "coed",
    "name": "College of Education Building",
    "abbr": "COED",
    "type": "academic",
    "color": "#c8a84b",
    "emoji": "🎓",
    "lat": 12.071157,
    "lng": 124.595094,
    "photo": "images/coed_logo.jpg",
    "description": "Dedicated to training future educators with a focus on pedagogical excellence. Features demonstration classrooms, a micro-teaching facility, and a curriculum resource center to support teacher education programs.",
    "location": "North-East Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Curriculum Center",
      "Micro-Teaching Lab",
      "Faculty Room",
      "COED Student Council"
    ],
    "programs": [
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education",
      "Bachelor of Special Needs Education"
    ],
    "department_id": "coed"
  },
  {
    "id": "con",
    "name": "College of Nursing Building",
    "abbr": "CON",
    "type": "academic",
    "color": "#1a6b5a",
    "emoji": "🏥",
    "lat": 12.07078,
    "lng": 124.595888,
    "photo": "images/con_logo.jpg",
    "description": "A modern nursing building featuring state-of-the-art simulation laboratories, skill stations, and clinical training facilities. Prepares students for both local and international nursing careers.",
    "location": "West Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Nursing Skills Lab",
      "Simulation Room",
      "Faculty Room",
      "CON Student Council",
      "Clinical Training Office"
    ],
    "programs": [
      "BS Nursing"
    ],
    "department_id": "con"
  },
  {
    "id": "com",
    "name": "College of Management Building",
    "abbr": "COM",
    "type": "academic",
    "color": "#b5611a",
    "emoji": "📊",
    "lat": 12.070753,
    "lng": 124.596979,
    "photo": "images/com_logo.png",
    "description": "Hub for business and management education at NWSSU. Equipped with business simulation rooms, accounting labs, and a mini-hotel training facility for hospitality management students.",
    "location": "Central-West Wing, Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "Accounting Lab",
      "Business Simulation Room",
      "Faculty Room",
      "COM Student Council"
    ],
    "programs": [
      "BS Business Administration",
      "BS Accountancy",
      "BS Hotel and Restaurant Management",
      "BS Entrepreneurship"
    ],
    "department_id": "com"
  },
  {
    "id": "cea",
    "name": "College of Engineering & Architecture Building",
    "abbr": "CEA",
    "type": "academic",
    "color": "#4a1a6b",
    "emoji": "🏗️",
    "lat": 12.070456,
    "lng": 124.596557,
    "photo": "images/cea_logo.jpg",
    "description": "Engineering and Architecture hub featuring specialized labs, drafting rooms, a materials testing laboratory, and a CAD center. Prepares students for professional engineering and architectural licensure examinations.",
    "location": "North-East Campus",
    "hours": null,
    "offices": [
      "Dean's Office",
      "CAD Laboratory",
      "Materials Testing Lab",
      "Drafting Room",
      "Faculty Room",
      "CEA Student Council"
    ],
    "programs": [
      "BS Civil Engineering",
      "BS Electrical Engineering",
      "BS Mechanical Engineering",
      "BS Architecture"
    ],
    "department_id": "cea"
  },
  {
    "id": "library",
    "name": "University Library",
    "abbr": "LIB",
    "type": "facility",
    "color": "#445566",
    "emoji": "📚",
    "lat": 12.070861,
    "lng": 124.596508,
    "photo": null,
    "description": "The NWSSU Library serves as the primary resource center for students, faculty, and staff. It houses thousands of books, periodicals, local and foreign journals, theses, dissertations, and digital resources via the library management system.",
    "location": "Central Campus",
    "hours": "Mon–Fri: 7:00 AM – 9:00 PM | Sat: 8:00 AM – 5:00 PM",
    "offices": [
      "Reference Section",
      "Circulation Desk",
      "Periodicals Section",
      "Digital Library Section",
      "Filipiniana Section",
      "Thesis & Dissertation Section"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "registrar",
    "name": "Registrar's Office Building",
    "abbr": "REG",
    "type": "admin",
    "color": "#334455",
    "emoji": "📋",
    "lat": 12.071588,
    "lng": 124.59678,
    "photo": null,
    "description": "The Office of the University Registrar handles all student records, enrollment, transcript of records, certifications, and other academic documents. Students must present a valid NWSSU ID for document requests.",
    "location": "Central Campus, Ground Floor",
    "hours": "Mon–Fri: 8:00 AM – 5:00 PM",
    "offices": [
      "Registrar Office",
      "Records Section",
      "Certification Desk",
      "Enrollment Counter"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "cashier",
    "name": "Cashier's Office Building",
    "abbr": "CASH",
    "type": "admin",
    "color": "#334455",
    "emoji": "💳",
    "lat": 12.071184,
    "lng": 124.596607,
    "photo": null,
    "description": "The Cashier's Office handles all financial transactions including tuition payment, miscellaneous fees, scholarship disbursements, and other university-related payments.",
    "location": "Central Campus, Ground Floor",
    "hours": "Mon–Fri: 8:00 AM – 5:00 PM",
    "offices": [
      "Cashier Windows 1–4",
      "Scholarship Desk",
      "Finance Records"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "president",
    "name": "Administration Building",
    "abbr": "ADMIN",
    "type": "admin",
    "color": "#2c3e50",
    "emoji": "🏛️",
    "lat": 12.071453,
    "lng": 124.596532,
    "photo": null,
    "description": "The main administrative hub of NWSSU, housing the Office of the University President, Vice Presidents, Human Resources, and key administrative offices. The nerve center of the university's operations and strategic direction.",
    "location": "Central Campus",
    "hours": "Mon–Fri: 8:00 AM – 5:00 PM",
    "offices": [
      "Office of the President",
      "VP Academic Affairs",
      "VP Administration & Finance",
      "Human Resources",
      "Planning & Development",
      "Research & Extension",
      "International Linkages",
      "Public Relations"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "alumni",
    "name": "Alumni Building",
    "abbr": "ALU",
    "type": "facility",
    "color": "#556677",
    "emoji": "🎓",
    "lat": 12.071831,
    "lng": 124.595615,
    "photo": null,
    "description": "The Alumni Building serves as the headquarters of the NWSSU Alumni Association and hosts reunions, alumni networking events, career fairs, and development programs for graduates.",
    "location": "South Wing, Campus",
    "hours": "Mon–Fri: 8:00 AM – 5:00 PM",
    "offices": [
      "Alumni Affairs Office",
      "Career Services",
      "Event Hall"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "sociocultural",
    "name": "Socio-Cultural Building",
    "abbr": "SCB",
    "type": "facility",
    "color": "#556677",
    "emoji": "🎭",
    "lat": 12.070672,
    "lng": 124.596309,
    "photo": null,
    "description": "Dedicated to the arts, culture, and social development programs of NWSSU. Features an auditorium, rehearsal spaces, and exhibit areas for the university's cultural troupes and events.",
    "location": "South-Central Campus",
    "hours": "Mon–Sat: 8:00 AM – 8:00 PM",
    "offices": [
      "Cultural Office",
      "Auditorium",
      "Rehearsal Rooms",
      "Exhibit Area"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "studentcouncil",
    "name": "Student Council Building",
    "abbr": "SC",
    "type": "facility",
    "color": "#556677",
    "emoji": "⭐",
    "lat": 12.070645,
    "lng": 124.596508,
    "photo": null,
    "description": "Home of the NWSSU Supreme Student Council and various student organization offices. A hub of student governance, leadership development, and extracurricular activities.",
    "location": "South-Central Campus",
    "hours": "Mon–Sat: 8:00 AM – 6:00 PM",
    "offices": [
      "Supreme Student Council Office",
      "Student Organizations Room",
      "Student Affairs Office"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "hotel",
    "name": "NWSSU Hotel & Restaurant",
    "abbr": "HTL",
    "type": "facility",
    "color": "#556677",
    "emoji": "🏨",
    "lat": 12.070834,
    "lng": 124.596855,
    "photo": null,
    "description": "A fully operational training hotel and restaurant managed by COM students under faculty supervision. Provides real-world hospitality experience while offering affordable accommodation and dining to university guests.",
    "location": "South Wing, Campus",
    "hours": "Daily: 7:00 AM – 10:00 PM",
    "offices": [
      "Front Desk",
      "Training Restaurant",
      "Housekeeping",
      "Kitchen Training Area"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "canteen",
    "name": "University Canteen",
    "abbr": "CAN",
    "type": "facility",
    "color": "#556677",
    "emoji": "🍽️",
    "lat": 12.070726,
    "lng": 124.596111,
    "photo": null,
    "description": "The main dining facility of NWSSU serving affordable Filipino meals to students, faculty, and staff. Multiple food stalls offer a variety of local dishes, snacks, and beverages throughout the day.",
    "location": "South-East Campus",
    "hours": "Mon–Sat: 6:30 AM – 7:00 PM",
    "offices": [
      "Canteen Management Office",
      "Food Stalls 1–8",
      "Catering Services"
    ],
    "programs": [],
    "department_id": null
  },
  {
    "id": "sports",
    "name": "Sports Complex",
    "abbr": "SC",
    "type": "facility",
    "color": "#2d5a27",
    "emoji": "⚽",
    "lat": 12.071319,
    "lng": 124.595813,
    "photo": null,
    "description": "NWSSU's Sports Complex features a basketball gymnasium, volleyball courts, a track oval, and open fields for various sports. Home of the university's athletics programs and intramural competitions.",
    "location": "South-West Campus",
    "hours": "Mon–Fri: 5:00 AM – 9:00 PM | Weekends: 6:00 AM – 8:00 PM",
    "offices": [
      "Sports Coordinator's Office",
      "Gym",
      "Equipment Room",
      "Athletics Office"
    ],
    "programs": [],
    "department_id": null
  }
];

const OFFICES = [
  {
    "slug": "office-of-the-university-president",
    "name": "Office of the University President",
    "icon": "🏛️",
    "location": "Admin Building, 2nd Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "images/o.jpg",
    "description": "Oversees all university operations and strategic direction."
  },
  {
    "slug": "vp-for-academic-affairs",
    "name": "VP for Academic Affairs",
    "icon": "🎓",
    "location": "Admin Building, 2nd Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "images/e.jpg",
    "description": "Manages academic programs, curriculum, and faculty."
  },
  {
    "slug": "vp-for-administration-finance",
    "name": "VP for Administration & Finance",
    "icon": "💼",
    "location": "Admin Building, 2nd Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Handles university finances, infrastructure, and administration."
  },
  {
    "slug": "university-registrar",
    "name": "University Registrar",
    "icon": "📋",
    "location": "Registrar Building, Ground Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Student records, enrollment, transcripts, and certifications."
  },
  {
    "slug": "cashier-s-office",
    "name": "Cashier's Office",
    "icon": "💳",
    "location": "Cashier Building, Ground Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Payment of tuition, fees, and financial assistance."
  },
  {
    "slug": "human-resources-office",
    "name": "Human Resources Office",
    "icon": "👥",
    "location": "Admin Building, 1st Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Faculty and staff recruitment, benefits, and records."
  },
  {
    "slug": "student-affairs-office",
    "name": "Student Affairs Office",
    "icon": "🎒",
    "location": "Student Council Building",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Student organizations, discipline, welfare, and activities."
  },
  {
    "slug": "osas-office-of-student-affairs",
    "name": "OSAS (Office of Student Affairs)",
    "icon": "🤝",
    "location": "Central Campus",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Coordinates student life programs and services."
  },
  {
    "slug": "guidance-counseling-office",
    "name": "Guidance & Counseling Office",
    "icon": "💬",
    "location": "Central Campus",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Personal, academic, and career counseling for students."
  },
  {
    "slug": "health-services-clinic",
    "name": "Health Services / Clinic",
    "icon": "🏥",
    "location": "Near Admin Building",
    "hours": "Mon–Fri 7AM–5PM",
    "photo": "https://images.unsplash.com/photo-1758691462878-6edc3d3da1be?q=70&w=1000&auto=format&fit=crop",
    "description": "Free basic medical services for students and staff."
  },
  {
    "slug": "library-office",
    "name": "Library Office",
    "icon": "📚",
    "location": "Library Building",
    "hours": "Mon–Fri 7AM–9PM, Sat 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1760166699654-5d0e10f51994?q=70&w=1000&auto=format&fit=crop",
    "description": "Access to books, journals, digital resources."
  },
  {
    "slug": "planning-development-office",
    "name": "Planning & Development Office",
    "icon": "📐",
    "location": "Admin Building",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Campus infrastructure, planning, and development."
  },
  {
    "slug": "research-extension-office",
    "name": "Research & Extension Office",
    "icon": "🔬",
    "location": "Admin Building, 3rd Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Research programs, community extension, and publications."
  },
  {
    "slug": "international-studies-linkages",
    "name": "International Studies & Linkages",
    "icon": "🌏",
    "location": "Admin Building",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "International partnerships, exchange programs, and linkages."
  },
  {
    "slug": "public-relations-office",
    "name": "Public Relations Office",
    "icon": "📣",
    "location": "Admin Building, Ground Floor",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "University communications, events, and media relations."
  },
  {
    "slug": "supreme-student-council",
    "name": "Supreme Student Council",
    "icon": "⭐",
    "location": "Student Council Building",
    "hours": "Mon–Sat 8AM–6PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "Student government body representing all NWSSU students."
  },
  {
    "slug": "sports-coordinator-s-office",
    "name": "Sports Coordinator's Office",
    "icon": "🏆",
    "location": "Sports Complex",
    "hours": "Mon–Fri 8AM–5PM",
    "photo": "https://images.unsplash.com/photo-1746173098013-6ae3c31e073f?q=70&w=1000&auto=format&fit=crop",
    "description": "University sports teams, intramurals, and athletic programs."
  },
  {
    "slug": "nwssu-hotel-restaurant",
    "name": "NWSSU Hotel & Restaurant",
    "icon": "🏨",
    "location": "HTL Building",
    "hours": "Daily 7AM–10PM",
    "photo": "https://images.unsplash.com/photo-1758193783649-13371d7fb8dd?q=70&w=1000&auto=format&fit=crop",
    "description": "Training hotel and restaurant for HRM students."
  }
];

const ORGANIZATIONS = [
  {
    "name": "Agricultural Science Society",
    "abbr": "AGRISCI",
    "college_abbr": "CAT",
    "president": "Carlo Santos",
    "vp": "Maricel Reyes",
    "secretary": "John Bautista"
  },
  {
    "name": "Future Farmers of NWSSU",
    "abbr": "FFN",
    "college_abbr": "CAT",
    "president": "Rina Cruz",
    "vp": "Paul Flores",
    "secretary": "Grace Soriano"
  },
  {
    "name": "Computing Society",
    "abbr": "CompSoc",
    "college_abbr": "CCIS",
    "president": "Yvonne Natividad",
    "vp": "Allan Reyes",
    "secretary": "Tina Gomez"
  },
  {
    "name": "Developers' League of NWSSU",
    "abbr": "DLN",
    "college_abbr": "CCIS",
    "president": "Marco Tan",
    "vp": "Sandra Lee",
    "secretary": "Efren Santos"
  },
  {
    "name": "Cybersecurity & Networking Club",
    "abbr": "CNC",
    "college_abbr": "CCIS",
    "president": "Arvin Dela Cruz",
    "vp": "Mia Villanueva",
    "secretary": "Noel Aquino"
  },
  {
    "name": "Criminology Society of NWSSU",
    "abbr": "CSN",
    "college_abbr": "CCJS",
    "president": "Jason Cortez",
    "vp": "Lydia Santos",
    "secretary": "Roger Bello"
  },
  {
    "name": "Education Students Society",
    "abbr": "ESS",
    "college_abbr": "COED",
    "president": "Kristine Alonzo",
    "vp": "Joseph dela Rosa",
    "secretary": "Annie Cruz"
  },
  {
    "name": "Nursing Students Association",
    "abbr": "NSA",
    "college_abbr": "CON",
    "president": "Jennifer Ramos",
    "vp": "Renz Santiago",
    "secretary": "Carla Vizcarra"
  },
  {
    "name": "Junior Entrepreneurs Society",
    "abbr": "JES",
    "college_abbr": "COM",
    "president": "Marco Delgado",
    "vp": "Patricia Tuazon",
    "secretary": "Rhea Magpayo"
  },
  {
    "name": "Junior Phil. Institute of Accountants",
    "abbr": "JPIA",
    "college_abbr": "COM",
    "president": "Diana Castillo",
    "vp": "Rodney Cruz",
    "secretary": "Mona Fernandez"
  },
  {
    "name": "Hotel & Restaurant Mgmt. Society",
    "abbr": "HRMS",
    "college_abbr": "COM",
    "president": "Anna Lim",
    "vp": "Kevin Ramos",
    "secretary": "Grace Tan"
  },
  {
    "name": "Society of Civil Engineering Students",
    "abbr": "SCES",
    "college_abbr": "CEA",
    "president": "Francis Dimaunahan",
    "vp": "Ria Mañibo",
    "secretary": "Aldrin Soriano"
  },
  {
    "name": "Architecture Students Guild",
    "abbr": "ASG",
    "college_abbr": "CEA",
    "president": "Leo Santos",
    "vp": "Cora Reyes",
    "secretary": "Mark Flores"
  },
  {
    "name": "NWSSU Supreme Student Council",
    "abbr": "SSC",
    "college_abbr": "University-Wide",
    "president": "Alvin Dimaculangan",
    "vp": "Gemma Soriano",
    "secretary": "Neil Castro"
  },
  {
    "name": "NWSSU Cultural & Arts Troupe",
    "abbr": "CAT-Troupe",
    "college_abbr": "University-Wide",
    "president": "Jessa Flores",
    "vp": "Romeo Garcia",
    "secretary": "Ana Mercado"
  },
  {
    "name": "NWSSU Dance Company",
    "abbr": "NDC",
    "college_abbr": "University-Wide",
    "president": "Charlene Santos",
    "vp": "Bobby Cruz",
    "secretary": "Lara Reyes"
  }
];

const AR_WAYPOINTS = [
  {
    "destination_key": "cat",
    "display_name": "College of Agriculture (CAT)",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "ccis",
    "display_name": "CCIS Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "ccjs",
    "display_name": "CCJS Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "coed",
    "display_name": "College of Education (COED)",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "con",
    "display_name": "College of Nursing (CON)",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "com",
    "display_name": "College of Management (COM)",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "cea",
    "display_name": "College of Engineering & Arch (CEA)",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "library",
    "display_name": "University Library",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "registrar",
    "display_name": "Registrar's Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "cashier",
    "display_name": "Cashier's Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "president",
    "display_name": "Administration Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "alumni",
    "display_name": "Alumni Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "sociocultural",
    "display_name": "Socio-Cultural Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "studentcouncil",
    "display_name": "Student Council Building",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "hotel",
    "display_name": "NWSSU Hotel & Restaurant",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "canteen",
    "display_name": "University Canteen",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "sports",
    "display_name": "Sports Complex",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "office-of-the-university-president",
    "display_name": "Office of the University President",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "vp-for-academic-affairs",
    "display_name": "VP for Academic Affairs",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "vp-for-administration-finance",
    "display_name": "VP for Administration & Finance",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "university-registrar",
    "display_name": "University Registrar",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "cashier-s-office",
    "display_name": "Cashier's Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "human-resources-office",
    "display_name": "Human Resources Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "student-affairs-office",
    "display_name": "Student Affairs Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "osas-office-of-student-affairs",
    "display_name": "OSAS",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "guidance-counseling-office",
    "display_name": "Guidance & Counseling Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "health-services-clinic",
    "display_name": "Health Services / Clinic",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "library-office",
    "display_name": "Library Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "planning-development-office",
    "display_name": "Planning & Development Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "research-extension-office",
    "display_name": "Research & Extension Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "international-studies-linkages",
    "display_name": "International Studies & Linkages",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "public-relations-office",
    "display_name": "Public Relations Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "supreme-student-council",
    "display_name": "Supreme Student Council",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "sports-coordinator-s-office",
    "display_name": "Sports Coordinator's Office",
    "lat": null,
    "lng": null
  },
  {
    "destination_key": "nwssu-hotel-restaurant",
    "display_name": "NWSSU Hotel & Restaurant",
    "lat": null,
    "lng": null
  }
];

async function upsert(table, rows, conflictColumn) {
  if (!rows.length) return;
  const { error, count } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: false, count: 'exact' });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${table}: ${rows.length} rows upserted`);
}

async function main() {
  console.log('Seeding NwSSU Campus Tour data into Supabase...\n');
  // Departments first — buildings reference them via department_id.
  await upsert('departments', DEPARTMENTS, 'id');
  await upsert('buildings', BUILDINGS, 'id');
  await upsert('offices', OFFICES, 'slug');
  await upsert('organizations', ORGANIZATIONS, 'abbr');
  await upsert('ar_waypoints', AR_WAYPOINTS, 'destination_key');
  console.log('\nDone.');
}

main();
