// ============================================================
// TourContext — compatibility shim.
//
// The app used to run TWO 360° systems: this context (opening a
// SphereTour overlay) and UIContext (opening PanoramaTour). They
// are now merged: UIContext owns the single tour state and
// PanoramaTour/SphereTour render it.
//
// This file is kept only so existing imports keep working
// (main.jsx uses <TourProvider>, BuildingInfoModal uses useTour()).
// Both now simply forward to UIContext. You can delete this file
// later after removing those two imports.
// ============================================================
import { useUI } from './UIContext';

export const TourProvider = ({ children }) => children;

// eslint-disable-next-line react-refresh/only-export-components
export const useTour = () => {
  const { openTour, closeTour } = useUI();
  // Old signature was openTour(buildingId, startNodeId) — still accepted.
  const open = (id, opts = null) => openTour(id, typeof opts === 'string' ? { startNode: opts } : opts || {});
  return { openTour: open, closeTour };
};