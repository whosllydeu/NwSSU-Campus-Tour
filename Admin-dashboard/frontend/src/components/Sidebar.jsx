import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/buildings', label: 'Buildings', icon: '🏛️' },
  { to: '/admin/departments', label: 'Departments', icon: '🎓' },
  { to: '/admin/offices', label: 'Offices', icon: '🏢' },
  { to: '/admin/organizations', label: 'Organizations', icon: '👥' },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: '📈' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`ad-sidebar${open ? ' open' : ''}`}>
      <div className="ad-sidebar-brand">
        <div className="brand-mark sm">N</div>
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

      {/* Now a separate app, so this is a real link to wherever the
          public site is hosted — set VITE_PUBLIC_SITE_URL in .env
          (see .env.example). Falls back to the local dev server. */}
      <a
        href={import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173/'}
        className="ad-sidebar-exit"
      >
        <span>← Back to Campus Tour</span>
      </a>
    </aside>
  );
}
