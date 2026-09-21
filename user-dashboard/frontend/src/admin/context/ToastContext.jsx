import { createContext, useContext, useState, useRef, useCallback } from 'react';

// ============================================================
// The admin dashboard only ever needed `toast` + `showToast`
// out of the public site's much larger UIContext (overlays,
// drawers, AR, lightbox, etc. don't apply here). This gives the
// admin pages the exact same `useUI()` shape they already call,
// without pulling in the public-site context or its dependencies.
// ============================================================

const ToastContext = createContext(null);

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
