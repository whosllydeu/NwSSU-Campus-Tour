import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getAR, AR_DESTINATIONS } from '../data/arDestinations.js';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '../data/data.js';

const UIContext = createContext(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within <UIProvider>');
  return ctx;
}

export function UIProvider({ children }) {
  const navigate = useNavigate();

  // ── Overlay state ──
  const [detail, setDetail] = useState(null);   // { kind:'building'|'dept', id }
  const [tour, setTour] = useState(null);         // building id with a 360 tour, e.g. 'ccis'
  const [arTarget, setArTarget] = useState(null); // { name, lat, lng } for AR navigation
  const [lightbox, setLightbox] = useState(null); // { src, caption }
  const [modal, setModal] = useState(null);       // { kind:'office'|'org', index }
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
      const exists = DEPARTMENTS.some((d) => d.id === id);
      if (exists) {
        setDetail({ kind: 'dept', id });
      } else {
        // Fallback mirrors the original: no dept entry → go to the list page.
        navigate('/departments');
      }
    },
    [navigate]
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  // ── Virtual tour overlay ──
  const openTour = useCallback((id) => setTour(id), []);
  const closeTour = useCallback(() => setTour(null), []);

  // ── AR navigation overlay ──
const openAR = useCallback((key) => {
  const name = (AR_DESTINATIONS[key] && AR_DESTINATIONS[key].name) || 'Destination';
  setArTarget({ key, name });
}, []);
 const closeAR = useCallback(() => setArTarget(null), []);
 
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
    const locked = Boolean(detail || lightbox || modal || tour || arTarget);
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [detail, lightbox, modal, tour, arTarget]);

  // ── Close overlays on Escape (mirrors the original keydown handlers) ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) closeLightbox();
      else if (detail) closeDetail();
      else if (modal) closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox, detail, modal, closeLightbox, closeDetail, closeModal]);

  const value = {
    detail, lightbox, modal, toast,
    tour, openTour, closeTour,
    arTarget, openAR, closeAR,
    searchQuery, setSearchQuery,
    drawerOpen, openDrawer, closeDrawer, toggleDrawer,
    openBuilding, openDept, closeDetail,
    openLightbox, closeLightbox,
    showOfficeModal, showOrgModal, closeModal,
    showToast,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}