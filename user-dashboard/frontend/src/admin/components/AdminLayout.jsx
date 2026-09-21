import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { AdminProvider } from '../context/AdminContext.jsx';
import '../styles/admin.css';

const TITLES = {
  '/admin': { title: 'Dashboard', subtitle: 'Overview of the campus tour system' },
  '/admin/buildings': { title: 'Buildings', subtitle: 'Manage campus building records' },
  '/admin/departments': { title: 'Departments', subtitle: 'Manage college & department records' },
  '/admin/offices': { title: 'Offices', subtitle: 'Manage administrative office records' },
  '/admin/organizations': { title: 'Organizations', subtitle: 'Manage student organizations' },
  '/admin/users': { title: 'Users', subtitle: 'Manage accounts & admin access' },
  '/admin/reports': { title: 'Reports & Analytics', subtitle: 'Insights across the campus dataset' },
  '/admin/settings': { title: 'Settings', subtitle: 'System information & data controls' },
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = TITLES[location.pathname] || { title: 'Admin', subtitle: '' };

  return (
    <AdminProvider>
      <div className="ad-shell">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        {sidebarOpen && <div className="ad-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        <div className="ad-main">
          <Topbar title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen((o) => !o)} />
          <div className="ad-content">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}