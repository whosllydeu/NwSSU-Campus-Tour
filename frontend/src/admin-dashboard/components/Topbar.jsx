import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, LogOut, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAdmin } from '../context/AdminContext.jsx';

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
});

export default function Topbar({ onMenuClick }) {
  const { profile, logout } = useAuth();
  const { buildings, departments } = useAdmin();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const displayName = profile?.full_name || profile?.email || 'Administrator';
  const initial = displayName.charAt(0).toUpperCase();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const match = (r) => `${r.abbr || ''} ${r.name || ''}`.toLowerCase().includes(q);
    return [
      ...buildings.filter(match).map((b) => ({ id: `b-${b.id}`, name: b.name, kind: 'Building', to: '/admin/buildings' })),
      ...departments.filter(match).map((d) => ({ id: `d-${d.id}`, name: d.name, kind: 'Department', to: '/admin/departments' })),
    ].slice(0, 7);
  }, [query, buildings, departments]);

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  const go = (to) => {
    setQuery('');
    navigate(to);
  };

  return (
    <header className="ad-topbar">
      <button className="ad-menu-btn" aria-label="Toggle admin menu" onClick={onMenuClick}>
        <span /><span /><span />
      </button>

      <div className="ad-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          id="adminSearch"
          name="adminSearch"
          placeholder="Search buildings or colleges…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {focused && query.trim() && (
          <div className="ad-search-results">
            {results.length === 0 ? (
              <div className="ad-search-empty">No matches</div>
            ) : results.map((r) => (
              <button key={r.id} type="button" onMouseDown={() => go(r.to)}>
                <span>{r.name}</span>
                <small>{r.kind}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ad-date-chip">
        <CalendarDays size={15} aria-hidden="true" />
        <span>{TODAY}</span>
      </div>

      <div className="ad-topbar-admin">
        <a
          href={import.meta.env.VITE_PUBLIC_SITE_URL || '/'}
          className="ad-round-btn"
          title="Open the Campus Tour"
          aria-label="Open the Campus Tour"
        >
          <ExternalLink size={16} />
        </a>
        <div className="ad-admin-meta">
          <span className="ad-admin-name">{displayName}</span>
          <span className="ad-admin-role">{profile?.role === 'admin' ? 'Administrator' : 'NwSSU CampusTour'}</span>
        </div>
        <div className="ad-admin-avatar">{initial}</div>
        <button type="button" className="ad-round-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
