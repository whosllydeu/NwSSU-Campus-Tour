import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import Toast from './components/Toast.jsx';
import Login from './pages/Login.jsx';

import Overview from './pages/Overview.jsx';
import BuildingsAdmin from './pages/BuildingsAdmin.jsx';
import DepartmentsAdmin from './pages/DepartmentsAdmin.jsx';
import OfficesAdmin from './pages/OfficesAdmin.jsx';
import OrganizationsAdmin from './pages/OrganizationsAdmin.jsx';
import Locations from './pages/Locations.jsx';
import Users from './pages/Users.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public — the only route reachable without a session. */}
          <Route path="/admin/login" element={<Login />} />

          {/* Everything else under /admin requires an authenticated admin. */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="buildings" element={<BuildingsAdmin />} />
            <Route path="departments" element={<DepartmentsAdmin />} />
            <Route path="offices" element={<OfficesAdmin />} />
            <Route path="organizations" element={<OrganizationsAdmin />} />
            <Route path="locations" element={<Locations />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* This app is admin-only now — anything else (including "/")
              lands on the dashboard, which itself redirects to login
              if there's no authenticated admin session. */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        <Toast />
      </ToastProvider>
    </AuthProvider>
  );
}