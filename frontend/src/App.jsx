import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
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
import OfflineBanner from "./user-dashboard/components/OfflineBanner";

// User side: the address bar always stays "https://nwssu-campustour.vercel.app"
// (pages are tracked in memory, so /map, /about … never show).
// Admin side: opening /admin/... keeps normal URLs so admins can still
// type the address, bookmark it, and refresh.
const isAdminUrl = window.location.pathname.startsWith("/admin");
const Router = isAdminUrl ? BrowserRouter : MemoryRouter;

// If someone opens an old link like /map, start on that page but clean the
// address bar back to "/".
const startPath = isAdminUrl ? undefined : window.location.pathname || "/";
if (!isAdminUrl && window.location.pathname !== "/") {
  window.history.replaceState(null, "", "/");
}
const routerProps = isAdminUrl ? {} : { initialEntries: [startPath] };

const App = () => {
  return (
    <Router {...routerProps}>
      <UIProvider>
        <Routes>
          {/* User Routes Start */}
          <Route path="/" element={<Home/>}/>
          <Route path="/map" element={<Map/>}/>
          <Route path="/buildings" element={<Buildings/>}/>
          <Route path="/departments" element={<Departments/>}/>
          <Route path="/about" element={<About/>}/>
          {/* User Routes End */}

          {/* Admin Routes Start */}
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
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Unknown paths: admin side → dashboard, user side → home */}
          <Route path="*" element={<Navigate to={isAdminUrl ? "/admin" : "/"} replace />} />
          {/* Admin Routes End */}
        </Routes>
        
        {/* UI Components Start */}
        <Splash/>
        <Drawer/>
        <SearchPanel/>
        <DetailScreen/>
        <PanoramaTour/>
        <Unavailable/>
        <Lightbox/>
        <Toast/>
        <OfflineBanner/>
        {/* UI Components End */}
      </UIProvider>
    </Router>
  );
}

export default App;