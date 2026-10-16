import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DataProvider } from './user-dashboard/context/DataContext'
import { AuthProvider } from './admin-dashboard/context/AuthContext'
import { ToastProvider } from './admin-dashboard/context/ToastContext'
import { TourProvider } from './user-dashboard/context/TourContext'

// CampusTour is a plain web app (no PWA, no offline mode). Older versions
// installed a service worker; this removes it and its saved caches from
// browsers that visited before, so they always load the latest version.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => registrations.forEach((r) => r.unregister()))
    .catch(() => {});
}
if ('caches' in window) {
  caches.keys()
    .then((keys) => keys.forEach((key) => caches.delete(key)))
    .catch(() => {});
}
// Remove the campus data copy that older versions saved for offline use.
try {
  localStorage.removeItem('nwssu-campus-data-v1');
} catch {
  /* storage blocked — nothing to remove */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <AuthProvider>
        <ToastProvider>
          <TourProvider>
            <App/>
          </TourProvider>
        </ToastProvider>
      </AuthProvider>
    </DataProvider>
  </StrictMode>,
)