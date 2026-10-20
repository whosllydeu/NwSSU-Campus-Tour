import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Landmark, GraduationCap, Compass, Users, ChartColumn, Settings,
} from 'lucide-react';
import nwssuLogo from '../../assets/images/nwssu-logo.jpg';

const LINKS = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/buildings', label: 'Buildings', Icon: Landmark },
  { to: '/admin/departments', label: 'Departments', Icon: GraduationCap },
  { to: '/admin/tours', label: '360° Tours', Icon: Compass },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/reports', label: 'Reports', Icon: ChartColumn },
];

const linkClass = ({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`;

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`ad-sidebar${open ? ' open' : ''}`}>
      <div className="ad-sidebar-brand">
        <img src={nwssuLogo} alt="NwSSU logo" className="ad-brand-logo" />
        <div className="ad-brand-text">
          <span className="ad-brand-name">CampusTour</span>
          <span className="ad-brand-sub">NwSSU Admin</span>
        </div>
      </div>

      <nav className="ad-sidebar-nav">
        {LINKS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClass}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ad-sidebar-bottom">
        <NavLink to="/admin/settings" onClick={onNavigate} className={linkClass}>
          <Settings size={18} aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}