import { useState } from "react";
import {
  Map as MapIcon,
  Globe,
  Footprints,
  Building2,
  WifiOff,
  MapPin,
  Navigation,
  GraduationCap,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Navbar } from "../components";
import { img } from "../utils/assets";
import "../stylesheets/about.css";

// ── Team ────────────────────────────────────────────────────
// Put each member's photo in  src/assets/images/  using the file
// name below (square photos look best, e.g. 400×400). Until a photo
// exists, the card shows the member's initials instead.
const TEAM = [
  { 
    name: "John Lloyd Timan", 
    role: "Programmer / Leader", 
    photo: "team-timan.jpg",
    bio: "'' Lead by example, lift others as you climb, and never stop moving forward. ''",
  },
  
  { 
    name: "Kim Lloyd C. Billate", 
    role: "Documenter", 
    photo: "team-billate.jpg",
    bio: "'' You never know how strong you are until being strong is your only choice. ''",
 },
    
    
    {
      name: "Fritz Anthony A. Teoxon",
      role: "Researcher",
      photo: "team-teoxon.jpg",
      bio: "'' Success is not final, and failure is not the end. What matters is having the courage to continue. ''",
    },
    

    {
      name: "Strawberry A. Ejoc",
      role: "Researcher",
      photo: "team-ejoc.jpg",
      bio: `"The worst enemy to creativity is self-doubt."\n — Sylvia Plath`,
    },

  { name: "Zj M. Mananguite", 
    role: "Documenter", 
    photo: "team-mananguite.jpg",
    bio: "'' Every step of learning brings me closer to my goals. ''",
  },

];
// To add a bio for another member, give them a  bio: "..."  liune like above.

// ── Contact ─────────────────────────────────────────────────
// Fill in your team's links. Leave a value as "" to hide that icon.
// Clicking a card opens that account / app directly.
const CONTACT = {
  email: "timanjohnlloyd@gmail.com",      // e.g. "nwssu.campustour@gmail.com"
  phone: "+63 991 185 7880",      // e.g. "09123456789"
  facebook: "https://www.facebook.com/Imllyd.lwky",   // full link, e.g. "https://facebook.com/yourpage"
  instagram: "",  // full link, e.g. "https://instagram.com/yourpage"
  messenger: "",  // e.g. "https://m.me/yourpage"
  address: "Northwest Samar State University, Rueda St., Calbayog City, Samar",
};

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
  </svg>
);
const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const CONTACT_ITEMS = [
  { key: "email", icon: Mail, label: "Email", href: (v) => `mailto:${v}` },
  { key: "phone", icon: Phone, label: "Call / Text", href: (v) => `tel:${v.replace(/\s+/g, "")}` },
  { key: "facebook", icon: FacebookIcon, label: "Facebook", href: (v) => v, text: () => "Visit our page" },
  { key: "instagram", icon: InstagramIcon, label: "Instagram", href: (v) => v, text: () => "Follow us" },
  { key: "messenger", icon: MessageCircle, label: "Messenger", href: (v) => v, text: () => "Chat with us" },
  {
    key: "address", icon: MapPin, label: "Address",
    href: (v) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`,
  },
].filter((item) => CONTACT[item.key]);

const FEATURES = [
  {
    icon: MapIcon,
    title: "Campus Map & Walking Routes",
    text: "Find any building and get a walking route that follows the real campus walkways, with distance and walking time.",
  },
  {
    icon: Globe,
    title: "360° Virtual Tour",
    text: "Walk the outdoor pathways and look inside buildings in 360° before you even arrive on campus.",
  },
  {
    icon: Footprints,
    title: "“Walk there!” Guide",
    text: "Starts from the 360° photo nearest you and follows the green arrows, step by step, to your destination.",
  },
  {
    icon: Building2,
    title: "Buildings & Departments",
    text: "See each building’s offices, programs, and photos, and every college and department in one place.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    text: "Once opened, the map and campus routes keep working even without a stable internet connection.",
  },
];

const STEPS = [
  { icon: MapPin, title: "Set where you are", text: "Tap “My Location”, or pick your starting building from the list." },
  { icon: Building2, title: "Choose a destination", text: "Search or tap the building, office, or department you need." },
  { icon: Navigation, title: "Go", text: "Tap “Get Route” for the map, or “Walk there!” for the 360° guided walk." },
];

const initials = (name) =>
  name
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join("")
    .toUpperCase();

function MemberPhoto({ member }) {
  const src = img(member.photo);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="about-avatar about-avatar--initials" aria-hidden="true">{initials(member.name)}</div>;
  }
  return (
    <img
      className="about-avatar"
      src={src}
      alt={member.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function About() {
  return (
    <>
      <Navbar />
      <main className="about-page">
        {/* Intro */}
        <section className="about-hero">
          <span className="about-eyebrow">About the System</span>
          <h1>NwSSU Campus Tour</h1>
          <p>
            A web-based campus guide for Northwest Samar State University. It helps new students,
            transferees, parents, and visitors find buildings, offices, and departments, see them in
            360° before going, and walk there on the campus pathways, without needing to ask for directions.
          </p>
        </section>

        {/* Features */}
        <section className="about-section">
          <h2>What you can do</h2>
          <div className="about-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="about-card">
                <span className="about-card-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How to use */}
        <section className="about-section">
          <h2>How to use it</h2>
          <ol className="about-steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="about-step">
                <span className="about-step-num">{i + 1}</span>
                <div>
                  <h3><Icon size={18} /> {title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Project */}
        <section className="about-section about-project">
          <span className="about-card-icon"><GraduationCap size={22} /></span>
          <div>
            <h2>About the project</h2>
            <p>
              NwSSU Campus Tour is a capstone project of Bachelor of Science in Information Technology & Bachelor of Science in Information System
              students at Northwest Samar State University, Calbayog City, Samar. It runs in any web
              browser on a phone or computer, with no app to install. The walking routes and 360° photo
              locations were mapped on foot around the campus, so directions follow paths people
              actually use.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="about-section">
          <h2>Meet the team</h2>
          <div className="about-team">
            {TEAM.map((member) => (
              <article key={member.name} className="about-member">
                <MemberPhoto member={member} />
                <h3>{member.name}</h3>
                <span className="about-role">{member.role}</span>
                {member.bio && <p className="about-bio">{member.bio}</p>}
              </article>
            ))}
          </div>
          <p className="about-thanks">
            Special thanks to our capstone adviser, the NwSSU administration, and every office and
            college that allowed us to photograph and map their buildings.
          </p>
        </section>

        {/* Contact */}
        {CONTACT_ITEMS.length > 0 && (
          <section className="about-section">
            <h2>Contact us</h2>
            <p className="about-contact-intro">
              Have a question, found a mistake on the map, or want to suggest a feature? Reach out to the team.
            </p>
            <div className="about-contact">
              {CONTACT_ITEMS.map(({ key, icon: Icon, label, href, text }) => {
                const value = CONTACT[key];
                const link = href(value);
                const external = link.startsWith("http");
                return (
                  <a
                    key={key}
                    href={link}
                    className="about-card about-contact-item"
                    aria-label={label}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <span className="about-card-icon"><Icon size={20} /></span>
                    <div>
                      <span className="about-contact-label">{label}</span>
                      <strong>{text ? text(value) : value}</strong>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <footer className="about-footer">
          <p>© {new Date().getFullYear()} NwSSU Campus Tour · BSIT | BSIS Capstone Project</p>
          <p>
            Map data ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </footer>
      </main>
    </>
  );
}
