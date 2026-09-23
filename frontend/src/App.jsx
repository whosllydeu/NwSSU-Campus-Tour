import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UIProvider } from "./user-dashboard/context/UIContext";

import Home from "./user-dashboard/pages/Home";
import Map from "./user-dashboard/pages/Map";
import Buildings from "./user-dashboard/pages/Buildings";
import Departments from "./user-dashboard/pages/Departments";
import Offices from "./user-dashboard/pages/Offices";
import About from "./user-dashboard/pages/About";

import Login from "./admin-dashboard/pages/Login";
import Overview from "./admin-dashboard/pages/Overview";
import BuildingsAdmin from "./admin-dashboard/pages/BuildingsAdmin";
import DepartmentsAdmin from "./admin-dashboard/pages/DepartmentsAdmin";
import OrganizationsAdmin from "./admin-dashboard/pages/OrganizationsAdmin";
import OfficesAdmin from "./admin-dashboard/pages/OfficesAdmin";
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
  Modal,
  Toast,
} from "./user-dashboard/components";
import AdminLayout from "./admin-dashboard/components/AdminLayout";

const App = () => {
  return (
    <BrowserRouter>
      <UIProvider>
        <Routes>
          {/* User Routes Start */}
          <Route path="/" element={<Home/>}/>
          <Route path="/map" element={<Map/>}/>
          <Route path="/buildings" element={<Buildings/>}/>
          <Route path="/departments" element={<Departments/>}/>
          <Route path="/offices" element={<Offices/>}/>
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
            <Route path="offices" element={<OfficesAdmin />} />
            <Route path="organizations" element={<OrganizationsAdmin />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* This app is admin-only now — anything else (including "/")
              lands on the dashboard, which itself redirects to login
              if there's no authenticated admin session. */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
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
        <Modal/>
        <Toast/>
        {/* UI Components End */}
      </UIProvider>
    </BrowserRouter>
  );
}

export default App;