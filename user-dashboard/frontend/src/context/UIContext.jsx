import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampusData } from './CampusDataContext.jsx';

const UIContext = createContext(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within <UIProvider>');
  return ctx;
}

export function UIProvider({ children }) {
  const navigate = useNavigate();
  const { departments, waypoints } = useCampusData();

  // ── Overlay state ──
  const [detail, setDetail] = useState(null);   // { kind:'building'|'dept', id }
  const [tour, setTour] = useState(null);         // building id with a 360 tour, e.g. 'ccis'
  const [arTarget, setArTarget] = useState(null); // { name, lat, lng } for AR navigation
  const [lightbox, setLightbox] = useState(null); // { src, caption }
  const [modal, setModal] = useState(null);       // { kind:'office'|'org', index }
  const [unavailable, setUnavailable] = useState(null); // { message } — full-screen "not ready yet" state
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toastTimer = useRef(null);

  // ── Mobile drawer ──
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  // ── Detail screen ──
  const openBuilding = useCallback((id) => setDetail({ kind: 'building', id }), []);

  const openDept = useCallback(
    (id) => {
      const exists = departments.some((d) => d.id === id);
      if (exists) {
        setDetail({ kind: 'dept', id });
      } else {
        // Fallback mirrors the original: no dept entry → go to the list page.
        navigate('/departments');
      }
    },
    [navigate, departments]
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  // ── Virtual tour overlay ──
  const openTour = useCallback((id) => setTour(id), []);
  const closeTour = useCallback(() => setTour(null), []);

  // ── AR navigation overlay ──
  // Name is looked up regardless of whether coordinates exist yet (mirrors
  // the original getAR() name lookup); resolveCoord separately gates
  // whether ARNav.jsx actually has something to point toward.
  const openAR = useCallback((key) => {
    const name = waypoints.find((w) => w.destination_key === key)?.display_name || 'Destination';
    setArTarget({ key, name });
  }, [waypoints]);
  const closeAR = useCallback(() => setArTarget(null), []);

  // ── "Currently unavailable" full-screen overlay ──
  // Used instead of a toast whenever the person taps something (Navigate
  // Here, Start Virtual Tour, etc.) that has no tour/AR data configured
  // for that place yet.
  const openUnavailable = useCallback((message) => {
    setUnavailable({ message: message || 'This feature is not available for this location yet.' });
  }, []);
  const closeUnavailable = useCallback(() => setUnavailable(null), []);

  // ── Lightbox ──
  const openLightbox = useCallback((src, caption = '') => setLightbox({ src, caption }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  // ── Office / Org modal ──
  const showOfficeModal = useCallback((index) => setModal({ kind: 'office', index }), []);
  const showOrgModal = useCallback((index) => setModal({ kind: 'org', index }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // ── Toast ──
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  // ── Body scroll lock while a full-screen overlay is open ──
  useEffect(() => {
    const locked = Boolean(detail || lightbox || modal || tour || arTarget || unavailable);
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [detail, lightbox, modal, tour, arTarget, unavailable]);

  // ── Close overlays on Escape (mirrors the original keydown handlers) ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) closeLightbox();
      else if (unavailable) closeUnavailable();
      else if (detail) closeDetail();
      else if (modal) closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox, detail, modal, unavailable, closeLightbox, closeDetail, closeModal, closeUnavailable]);

  // ── Trap the device/browser back button so it closes the topmost
  // overlay instead of leaving the app or changing pages. Overlays can
  // nest (e.g. AR is opened from inside a Detail screen, or from inside
  // an Office/Org modal), so this tracks the REAL order things were
  // opened in — a true stack — rather than a fixed priority guess.
  // Each nested open pushes one history entry (same URL, just a
  // marker); back pops exactly one layer at a time, so a single
  // overlay closes in one press and reveals the actual previous page
  // immediately, since the route underneath never changed.
  const overlayOrderRef = useRef([]);
  const prevOverlaysRef = useRef({});
  const fromPopRef = useRef(false);
  const skipPopRef = useRef(0);

  const overlays = {
    lightbox: Boolean(lightbox),
    modal: Boolean(modal),
    detail: Boolean(detail),
    tour: Boolean(tour),
    arTarget: Boolean(arTarget),
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
      // A close button/gesture removed an overlay that owns one or more
      // history entries. Move the browser history back to remove those
      // marker entries, but do not close the overlay underneath it when
      // the resulting popstate event fires.
      skipPopRef.current += popped;
      for (let i = 0; i < popped; i++) window.history.back();
    }
    fromPopRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlaysKey]);

  useEffect(() => {
    const closers = {
      lightbox: closeLightbox, modal: closeModal, detail: closeDetail,
      tour: closeTour, arTarget: closeAR, unavailable: closeUnavailable, drawerOpen: closeDrawer,
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
      // Nothing open — this is a normal route/history Back and React
      // Router is allowed to handle it.
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeLightbox, closeModal, closeDetail, closeTour, closeAR, closeUnavailable, closeDrawer]);

  const value = {
    detail, lightbox, modal, toast,
    tour, openTour, closeTour,
    arTarget, openAR, closeAR,
    unavailable, openUnavailable, closeUnavailable,
    searchQuery, setSearchQuery,
    drawerOpen, openDrawer, closeDrawer, toggleDrawer,
    openBuilding, openDept, closeDetail,
    openLightbox, closeLightbox,
    showOfficeModal, showOrgModal, closeModal,
    showToast,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}