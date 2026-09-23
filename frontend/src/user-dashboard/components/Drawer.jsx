import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const LINKS = [
  { to: '/map', label: '🗺️ Campus Map' },
  { to: '/buildings', label: '🏛️ Buildings' },
  { to: '/departments', label: '🎓 Departments' },
  { to: '/offices', label: '🏢 Offices' },
  { to: '/about', label: 'ℹ️ About Us' },
];

export default function Drawer() {
  const { drawerOpen, closeDrawer, searchQuery, setSearchQuery } = useUI();

  return (
    <>
      <div
        className={`drawer-bg${drawerOpen ? ' show' : ''}`}
        id="drawerBg"
        onClick={closeDrawer}
      />
      <div className={`drawer${drawerOpen ? ' open' : ''}`} id="drawer">
        <div className="drawer-top">
          <div className="brand-mark sm">N</div>
          <span className="drawer-title">NWSSU Campus</span>
          <button className="drawer-x" onClick={closeDrawer}>✕</button>
        </div>

        <div className="drawer-search-row">
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="drawer-links">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              end={l.end}
              className="dl"
              onClick={closeDrawer}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
