import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampusData } from './DataContext';

const UIContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within <UIProvider>');
  return ctx;
}

export function UIProvider({ children }) {
  const navigate = useNavigate();
  const { departments } = useCampusData();

  const [detail, setDetail] = useState(null);
  const [tour, setTour] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [unavailable, setUnavailable] = useState(null);
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toastTimer = useRef(null);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  const openBuilding = useCallback((id) => setDetail({ kind: 'building', id }), []);

  const openDept = useCallback(
    (id) => {
      const exists = departments.some((d) => d.id === id);
      if (exists) {
        setDetail({ kind: 'dept', id });
      } else {
        navigate('/departments');
      }
    },
    [navigate, departments]
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  const openTour = useCallback((id, opts = {}) => {
    setTour({
      id,
      startNode: opts.startNode || opts.startFile || null,
      destinationNode: opts.destinationNode || null,
      destinationLabel: opts.destinationLabel || null,
    });
  }, []);
  const closeTour = useCallback(() => setTour(null), []);

  const openUnavailable = useCallback((message) => {
    setUnavailable({ message: message || 'This feature is not available for this location yet.' });
  }, []);
  const closeUnavailable = useCallback(() => setUnavailable(null), []);

  const openLightbox = useCallback((src, caption = '') => setLightbox({ src, caption }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    const locked = Boolean(detail || lightbox || tour || unavailable);
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [detail, lightbox, tour, unavailable]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) closeLightbox();
      else if (unavailable) closeUnavailable();
      else if (detail) closeDetail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox, detail, unavailable, closeLightbox, closeDetail, closeUnavailable]);

  const overlayOrderRef = useRef([]);
  const prevOverlaysRef = useRef({});
  const fromPopRef = useRef(false);
  const skipPopRef = useRef(0);

  const overlays = {
    lightbox: Boolean(lightbox),
    detail: Boolean(detail),
    tour: Boolean(tour),
    unavailable: Boolean(unavailable),
    drawerOpen,
  };
  const overlaysKey = Object.values(overlays).join(',');

  useEffect(() => {
    const prev = prevOverlaysRef.current;
    let pushed = 0;
    let popped = 0;
    for (const key of Object.keys(overlays)) {
      const now = overlays[key];
      const before = prev[key] || false;
      if (now && !before) {
        overlayOrderRef.current.push(key);
        pushed += 1;
      } else if (!now && before) {
        overlayOrderRef.current = overlayOrderRef.current.filter((k) => k !== key);
        popped += 1;
      }
    }
    prevOverlaysRef.current = overlays;

    for (let i = 0; i < pushed; i++) window.history.pushState({ appOverlay: true }, '');
    if (popped > 0 && pushed === 0 && !fromPopRef.current) {
      skipPopRef.current += popped;
      for (let i = 0; i < popped; i++) window.history.back();
    }
    fromPopRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlaysKey]);

  useEffect(() => {
    const closers = {
      lightbox: closeLightbox, detail: closeDetail,
      tour: closeTour, unavailable: closeUnavailable, drawerOpen: closeDrawer,
    };
    const onPopState = () => {
      if (skipPopRef.current > 0) {
        skipPopRef.current -= 1;
        return;
      }

      fromPopRef.current = true;
      const order = overlayOrderRef.current;
      const topKey = order[order.length - 1];
      if (topKey && closers[topKey]) closers[topKey]();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeLightbox, closeDetail, closeTour, closeUnavailable, closeDrawer]);

  const value = {
    detail, lightbox, toast,
    tour, openTour, closeTour,
    unavailable, openUnavailable, closeUnavailable,
    searchQuery, setSearchQuery,
    drawerOpen, openDrawer, closeDrawer, toggleDrawer,
    openBuilding, openDept, closeDetail,
    openLightbox, closeLightbox,
    showToast,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}