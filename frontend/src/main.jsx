import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DataProvider } from './user-dashboard/context/DataContext'
import { AuthProvider } from './admin-dashboard/context/AuthContext'
import { ToastProvider } from './admin-dashboard/context/ToastContext'
import { TourProvider } from './user-dashboard/context/TourContext'

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
