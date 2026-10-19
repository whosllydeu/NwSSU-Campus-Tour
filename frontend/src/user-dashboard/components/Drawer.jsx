import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import nwssuLogo from "../../assets/images/nwssu-logo.jpg";
const LOGO_STYLE = { width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%", display: "block" };
const LINKS = [
  { to: '/map', label: '🗺️ Campus Map' },
  { to: '/buildings', label: '🏛️ Buildings' },
  { to: '/departments', label: '🎓 Departments' },
  { to: '/about', label: 'ℹ️ About Us' },
];

export default function Drawer() {
  const { drawerOpen, closeDrawer, searchQuery, setSearchQuery } = useUI();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
    setTimeout(go, 400);
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
          <div className="brand-mark sm"><img src={nwssuLogo} alt="NwSSU logo" style={LOGO_STYLE} /></div>
          <span className="drawer-title">NWSSU Campus</span>
          <button className="drawer-x" onClick={closeDrawer} aria-label="Close menu">✕</button>
        </div>

        <div className="drawer-search-row">
          <input
            type="text"
            id="drawerSearch"
            name="drawerSearch"
            autoComplete="off"
            aria-label="Search"
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