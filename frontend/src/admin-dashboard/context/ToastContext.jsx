import { createContext, useContext, useState, useRef, useCallback } from 'react';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useUI must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}
