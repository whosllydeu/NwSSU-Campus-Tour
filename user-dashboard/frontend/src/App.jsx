import { Routes, Route, Navigate } from 'react-router-dom';
import { CampusDataProvider, useCampusData } from './context/CampusDataContext.jsx';
import { UIProvider } from './context/UIContext.jsx';

import Splash from './components/Splash.jsx';
import Navbar from './components/Navbar.jsx';
import Drawer from './components/Drawer.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import DetailScreen from './components/DetailScreen.jsx';
import PanoramaTour from './components/PanoramaTour.jsx';
import ARNav from './components/ARNav.jsx';
import Unavailable from './components/Unavailable.jsx';
import Lightbox from './components/Lightbox.jsx';
import Modal from './components/Modal.jsx';
import Toast from './components/Toast.jsx';

import Home from './pages/Home.jsx';
import Buildings from './pages/Buildings.jsx';
import Map from './pages/Map.jsx';
import Departments from './pages/Departments.jsx';
import Offices from './pages/Offices.jsx';
import About from './pages/About.jsx';
import ARNavigate from './pages/ARNavigate.jsx';

// 👇 new import
import AdminApp from './admin/AdminApp.jsx';

function AppShell() {
  const { isLoading, error } = useCampusData();

  if (isLoading) {
    return <div className="page-search-empty" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Loading campus data…</div>;
  }
  if (error) {
    return (
      <div className="page-search-empty" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Couldn't reach the campus database. Please check your connection and refresh.
      </div>
    );
  }

  return (
    <UIProvider>
      <Splash />
      <Navbar />
      <Drawer />
      <SearchPanel />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/map" element={<Map />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/offices" element={<Offices />} />
          <Route path="/about" element={<About />} />
          <Route path="/ar/:id" element={<ARNavigate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <DetailScreen />
      <PanoramaTour />
      <ARNav />
      <Unavailable />
      <Modal />
      <Lightbox />
      <Toast />
    </UIProvider>
  );
}

// 👇 the actual public site, unchanged, just pulled into its own component
function PublicSite() {
  return (
    <CampusDataProvider>
      <AppShell />
    </CampusDataProvider>
  );
}

// 👇 this is the only real change: split BEFORE CampusDataProvider ever mounts
export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  );
}