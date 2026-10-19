import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { UIProvider } from "./user-dashboard/context/UIContext";

import Home from "./user-dashboard/pages/Home";
import Map from "./user-dashboard/pages/Map";
import Buildings from "./user-dashboard/pages/Buildings";
import Departments from "./user-dashboard/pages/Departments";
import About from "./user-dashboard/pages/About";

import Login from "./admin-dashboard/pages/Login";
import Overview from "./admin-dashboard/pages/Overview";
import BuildingsAdmin from "./admin-dashboard/pages/BuildingsAdmin";
import DepartmentsAdmin from "./admin-dashboard/pages/DepartmentsAdmin";
import ToursAdmin from "./admin-dashboard/pages/ToursAdmin";
import Users from "./admin-dashboard/pages/Users";
import Reports from "./admin-dashboard/pages/Reports";
import Settings from "./admin-dashboard/pages/Settings";

import ProtectedRoute from "./admin-dashboard/guard/ProtectedRoute";

import {
  Splash,
  Drawer,
  SearchPanel,
  DetailScreen,
  PanoramaTour,
  Unavailable,
  Lightbox,
  Toast,
} from "./user-dashboard/components";
import AdminLayout from "./admin-dashboard/components/AdminLayout";

const isAdminUrl = window.location.pathname.startsWith("/admin");

// Both sides use an in-memory router, so the address bar stays clean:
// "/" for visitors and "/admin" for the dashboard, whatever page is open.
const startPath = window.location.pathname || "/";
const cleanPath = isAdminUrl ? "/admin" : "/";
if (window.location.pathname !== cleanPath) {
  window.history.replaceState(null, "", cleanPath);
}
const routerProps = { initialEntries: [startPath] };

const App = () => {
  return (
    <MemoryRouter {...routerProps}>
      <UIProvider>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/map" element={<Map/>}/>
          <Route path="/buildings" element={<Buildings/>}/>
          <Route path="/departments" element={<Departments/>}/>
          <Route path="/about" element={<About/>}/>

          <Route path="/admin/login" element={<Login/>}/>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview/>} />
            <Route path="buildings" element={<BuildingsAdmin />} />
            <Route path="departments" element={<DepartmentsAdmin />} />
            <Route path="tours" element={<ToursAdmin />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to={isAdminUrl ? "/admin" : "/"} replace />} />
        </Routes>
        
        <Splash/>
        <Drawer/>
        <SearchPanel/>
        <DetailScreen/>
        <PanoramaTour/>
        <Unavailable/>
        <Lightbox/>
        <Toast/>
      </UIProvider>
    </MemoryRouter>
  );
}

export default App;