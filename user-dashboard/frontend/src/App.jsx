import { Routes, Route, Navigate } from 'react-router-dom';
import { UIProvider } from './context/UIContext.jsx';

import Splash from './components/Splash.jsx';
import Navbar from './components/Navbar.jsx';
import Drawer from './components/Drawer.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import DetailScreen from './components/DetailScreen.jsx';
import PanoramaTour from './components/PanoramaTour.jsx';
import ARNav from './components/ARNav.jsx';
import Lightbox from './components/Lightbox.jsx';
import Modal from './components/Modal.jsx';
import Toast from './components/Toast.jsx';

import Home from './pages/Home.jsx';
import Buildings from './pages/Buildings.jsx';
import Departments from './pages/Departments.jsx';
import Offices from './pages/Offices.jsx';
import About from './pages/About.jsx';
import ARNavigate from './pages/ARNavigate.jsx';

export default function App() {
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
          <Route path="/departments" element={<Departments />} />
          <Route path="/offices" element={<Offices />} />
          <Route path="/about" element={<About />} />
          <Route path="/ar/:id" element={<ARNavigate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global overlays — rendered once, driven by UIContext. */}
      <DetailScreen />
      <PanoramaTour />
      <ARNav />
      <Modal />
      <Lightbox />
      <Toast />
    </UIProvider>
  );
}
