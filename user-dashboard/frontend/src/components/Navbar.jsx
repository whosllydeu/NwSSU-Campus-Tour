import { NavLink, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';

const LINKS = [
  { to: '/map', label: 'Map' },
  { to: '/buildings', label: 'Buildings' },
  { to: '/departments', label: 'Departments' },
  { to: '/offices', label: 'Offices' },
  { to: '/about', label: 'About Us' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, drawerOpen, toggleDrawer } = useUI();

  return (
    <nav className="navbar" id="navbar">
      <div
        className="nav-brand"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
      >
        <div className="brand-mark">N</div>
        <div className="brand-info">
          <span className="brand-name">NWSSU</span>
          <span className="brand-sub">Campus Tour</span>
        </div>
      </div>

      <div className="nav-links" id="navLinks">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `nl${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
        <div className="nav-search-box">
          <span className="ns-icon">⌕</span>
          <input
            type="text"
            id="globalSearch"
            className="ns-input"
            placeholder="Search campus…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className={`hamburger${drawerOpen ? ' open' : ''}`}
          id="hamburger"
          aria-label="Toggle menu"
          onClick={toggleDrawer}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
