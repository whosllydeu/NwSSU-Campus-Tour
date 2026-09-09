import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || profile?.email || 'Administrator';
  const initial = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <header className="ad-topbar">
      <button className="ad-menu-btn" aria-label="Toggle admin menu" onClick={onMenuClick}>
        <span /><span /><span />
      </button>
      <div className="ad-topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="ad-topbar-admin">
        <div className="ad-admin-avatar">{initial}</div>
        <div className="ad-admin-meta">
          <span className="ad-admin-name">{displayName}</span>
          <span className="ad-admin-role">{profile?.role === 'admin' ? 'Administrator' : 'NWSSU CampusTour'}</span>
        </div>
        <button className="btn-ghost btn-sm ad-logout-btn" onClick={handleLogout}>
          ⏻ Logout
        </button>
      </div>
    </header>
  );
}