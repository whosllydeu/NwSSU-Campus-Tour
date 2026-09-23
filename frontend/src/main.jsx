import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DataProvider } from './user-dashboard/context/DataContext'
import { AuthProvider } from './admin-dashboard/context/AuthContext'
import { ToastProvider } from './admin-dashboard/context/ToastContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <AuthProvider>
        <ToastProvider>
          <App/>
        </ToastProvider>
      </AuthProvider>
    </DataProvider>
  </StrictMode>,
)
