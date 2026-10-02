import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Closing the drawer makes UIContext call history.back() to remove the
  // drawer's history marker. If we navigate at the same time, that back()
  // undoes the navigation. So: close first, wait for the back() to finish,
  // then navigate.
  const handleNav = (e, to) => {
    e.preventDefault();
    closeDrawer();
    if (to === pathname) return;

    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.removeEventListener('popstate', onPop);
      setTimeout(() => navigate(to), 0);
    };
    const onPop = () => go();
    window.addEventListener('popstate', onPop);
    setTimeout(go, 400); // fallback if no history marker existed
  };

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
          <button className="drawer-x" onClick={closeDrawer} aria-label="Close menu">✕</button>
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
              className={`dl${pathname === l.to ? ' active' : ''}`}
              onClick={(e) => handleNav(e, l.to)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}