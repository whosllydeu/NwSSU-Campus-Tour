import { useUI } from './UIContext';

export const TourProvider = ({ children }) => children;

// eslint-disable-next-line react-refresh/only-export-components
export const useTour = () => {
  const { openTour, closeTour } = useUI();
  const open = (id, opts = null) => openTour(id, typeof opts === 'string' ? { startNode: opts } : opts || {});
  return { openTour: open, closeTour };
};