import { useCallback, useState } from "react";
import { Building2, Clock, Globe, Loader2, MapPin, X } from "lucide-react";
import "../stylesheets/map.css";
import "../stylesheets/gallery.css";
import "../stylesheets/building-panorama.css";
import { hasTour } from "../static/nwssuTour";
import { adminTourId } from "../utils/adminTours";
import { useUI } from "../context/UIContext";
import { useTour } from "../context/TourContext";
import { useCampusData } from "../context/DataContext";
import { resolveImage } from "../utils/assets";
import BuildingPanoramaViewer from "./BuildingPanoramaViewer";
import { getBuildingPanoramas, findBuildingTourId } from "../utils/panorama";

const BuildingInfoModal = ({ building, onClose, navigateLoading }) => {

  const { openUnavailable } = useUI();
  const { openTour } = useTour();
  const { departments } = useCampusData();
  const [mainErrored, setMainErrored] = useState(false);
  const [panoramaView, setPanoramaView] = useState(null);
  const [checkingPanoramas, setCheckingPanoramas] = useState(false);
  const closePanoramaView = useCallback(() => setPanoramaView(null), []);

  if (!building) {
    return null;
  }

  const mainPhoto = resolveImage(building.photo);
  const shownPhoto = mainErrored ? "" : mainPhoto;

  const inTour = async () => {
    if (checkingPanoramas) return;
    if (hasTour(adminTourId(building.id))) {
      openTour(adminTourId(building.id));
      return;
    }
    setCheckingPanoramas(true);
    let items;
    try {
      items = await getBuildingPanoramas(building);
    } catch {
      items = [];
    } finally {
      setCheckingPanoramas(false);
    }

    const tourId = findBuildingTourId(building, departments, hasTour);

    if (items.length > 0) {
      setPanoramaView({ buildingId: building.id, items });
    } else if (tourId) {
      openTour(tourId);
    } else {
      onClose();
      openUnavailable("Virtual Tour is currently not available for this location yet.");
    }
  };

  const activePanoramas = panoramaView && panoramaView.buildingId === building.id ? panoramaView.items : null;
  const opening = navigateLoading || checkingPanoramas;

  return (
    <div className="building-modal-overlay">
      <div className="building-modal" onClick={(event) => event.stopPropagation()}>
        <div className="building-modal-header">
          <div className="building-modal-title">
            <div
              className={`building-modal-icon${mainPhoto && !mainErrored ? " has-img" : ""}`}
              style={{ backgroundColor: building.color || "#2c3e50" }}
            >
              {mainPhoto && !mainErrored ? (
                <img className="bim-header-thumb" src={mainPhoto} alt="" aria-hidden="true" />
              ) : (
                <Building2 size={26} color="#fff" aria-hidden="true" />
              )}
            </div>
            <div>
              <span className="building-modal-abbr">{building.abbr}</span>
              <h2>{building.name}</h2>
            </div>
          </div>
          <button
            type="button"
            className="building-modal-close"
            onClick={onClose}
            aria-label="Close building information"
          >
            <X size={22}/>
          </button> 
        </div>
        <div className="building-modal-body">
          {shownPhoto && (
            <div className="building-modal-photo">
              <img
                src={shownPhoto}
                alt={building.name}
                onError={() => setMainErrored(true)}
              />
            </div>
          )}
          {building.desc && (
            <div className="building-modal-section">
              <h3>About</h3>
              <p>{building.desc}</p>
            </div>
          )}
          <div className="building-modal-info-grid">
            {building.location && (
              <div className="building-info-card">
                <MapPin size={18} />
                <div>
                  <span>Location</span>
                  <strong>{building.location}</strong>
                </div>
              </div>
            )}
            {building.hours && (
              <div className="building-info-card">
                <Clock size={18} />
                <div>
                  <span>Operating Hours</span>
                  <strong>{building.hours}</strong>
                </div>
              </div>
            )}
            {building.type && (
              <div className="building-info-card">
                <Building2 size={18} />
                <div>
                  <span>Type</span>
                  <strong>
                    {building.type.charAt(0).toUpperCase() +building.type.slice(1)}
                  </strong>
                </div>
              </div>
            )}
            <div className="building-info-card">
              <MapPin size={18} />
              <div>
                <span>Coordinates</span>
                <strong>{building.lat}, {building.lng}</strong>
              </div>
            </div>
          </div>
          {Array.isArray(building.offices) &&
            building.offices.length > 0 && (
              <section className="building-modal-section">
                <h3>Offices</h3>
                <div className="building-tag-list">
                  {building.offices.map(
                    (office, index) => (
                      <span
                        className="building-tag"
                        key={`${office}-${index}`}
                      >
                        {office}
                      </span>
                    )
                  )}
                </div>
              </section>
            )}
            {Array.isArray(building.programs) &&
              building.programs.length > 0 && (
              <section className="building-modal-section">
                <h3>Programs</h3>
                <div className="building-tag-list">
                  {building.programs.map(
                    (program, index) => (
                      <span
                        className="building-tag"
                        key={`${program}-${index}`}
                      >
                        {program}
                      </span>
                    )
                  )}
                </div>
              </section>
            )
          }
        </div>
        <div className="building-modal-footer">
          <button
            type="button"
            className="building-modal-navigate-btn"
            onClick={inTour}
            disabled={opening}
          >
            {checkingPanoramas ? <Loader2 size={18} className="bpv-spin" /> : <Globe size={18}/>}
            {opening ? "Opening..." : "Open 360 Tour"}
          </button>
        </div>
      </div>
      {activePanoramas && (
        <BuildingPanoramaViewer
          building={building}
          items={activePanoramas}
          onClose={closePanoramaView}
        />
      )}
    </div>
  );
}

export default BuildingInfoModal;