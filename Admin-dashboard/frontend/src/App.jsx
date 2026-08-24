import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import Toast from './components/Toast.jsx';

import Overview from './pages/Overview.jsx';
import BuildingsAdmin from './pages/BuildingsAdmin.jsx';
import DepartmentsAdmin from './pages/DepartmentsAdmin.jsx';
import OfficesAdmin from './pages/OfficesAdmin.jsx';
import OrganizationsAdmin from './pages/OrganizationsAdmin.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="buildings" element={<BuildingsAdmin />} />
          <Route path="departments" element={<DepartmentsAdmin />} />
          <Route path="offices" element={<OfficesAdmin />} />
          <Route path="organizations" element={<OrganizationsAdmin />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* This app is admin-only now — anything else (including "/")
            lands on the dashboard. */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toast />
    </ToastProvider>
  );
}
