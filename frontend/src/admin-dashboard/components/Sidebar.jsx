import { NavLink } from 'react-router-dom';
import nwssuLogo from "../../assets/images/nwssu-logo.jpg";
const LOGO_STYLE = { width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%", display: "block" };
const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/buildings', label: 'Buildings', icon: '🏛️' },
  { to: '/admin/departments', label: 'Departments', icon: '🎓' },
  { to: '/admin/users', label: 'Users', icon: '🔐' },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: '📈' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`ad-sidebar${open ? ' open' : ''}`}>
      <div className="ad-sidebar-brand">
        <div className="brand-mark sm"><img src={nwssuLogo} alt="NwSSU logo" style={LOGO_STYLE} /></div>
        <div className="brand-info">
          <span className="brand-name">NWSSU</span>
          <span className="brand-sub">Admin Panel</span>
        </div>
      </div>

      <nav className="ad-sidebar-nav">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`}
          >
            <span className="ad-nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <a
        href={import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173/'}
        className="ad-sidebar-exit"
      >
        <span>← Back to Campus Tour</span>
      </a>
    </aside>
  );
}