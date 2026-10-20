import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { AdminProvider } from '../context/AdminContext.jsx';
import '../styles/admin.css';
import '../styles/admin-flat.css';
import '../styles/admin-light.css';
import '../styles/admin-modern.css';

const TITLES = {
  '/admin': null, // the dashboard has its own welcome banner
  '/admin/buildings': { title: 'Buildings', subtitle: 'Manage campus building records' },
  '/admin/departments': { title: 'Departments', subtitle: 'Manage college & department records' },
  '/admin/tours': { title: '360° Tours', subtitle: 'Edit the arrows of the built-in 360° tours' },
  '/admin/users': { title: 'Users', subtitle: 'Manage accounts & admin access' },
  '/admin/reports': { title: 'Reports & Analytics', subtitle: 'Insights across the campus dataset' },
  '/admin/settings': { title: 'Settings', subtitle: 'System information & data controls' },
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = location.pathname in TITLES ? TITLES[location.pathname] : { title: 'Admin', subtitle: '' };

  useEffect(() => {
    document.body.classList.add('admin-flat', 'admin-modern');
    return () => document.body.classList.remove('admin-flat', 'admin-modern');
  }, []);

  return (
    <AdminProvider>
      <div className="ad-shell">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        {sidebarOpen && <div className="ad-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        <div className="ad-main">
          <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />
          <div className="ad-content">
            {meta && (
              <div className="ad-page-head">
                <h1>{meta.title}</h1>
                {meta.subtitle && <p>{meta.subtitle}</p>}
              </div>
            )}
            <Outlet />
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}