import { createContext, useContext, useState } from "react";
import { TourOverlay } from "../components/SphereTour";
import { nwssuTourNodes } from "../static/tourNodes";

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  const [tour, setTour] = useState(null);

  const openTour = (buildingId, startNodeId = null) => {
    const nodes = nwssuTourNodes[buildingId];
    setTour({
      nodes,
      startNodeId
    });
  };

  const closeTour = () => {
    setTour(null);
  };

  return (
    <TourContext.Provider value={{ openTour, closeTour }}>
      {children}
      {tour && (
        <TourOverlay
          nodes={tour.nodes}
          startNodeId={tour.startNodeId}
          onClose={closeTour}
        />
      )}
    </TourContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTour = () => {
  return useContext(TourContext);
};