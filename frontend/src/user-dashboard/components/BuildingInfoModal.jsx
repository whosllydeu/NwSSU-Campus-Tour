import { useCallback, useState } from "react";
import { Building2, Clock, Globe, Loader2, MapPin, X } from "lucide-react";
import "../stylesheets/map.css";
import "../stylesheets/gallery.css";
import "../stylesheets/building-panorama.css";
import { hasTour } from "../static/nwssuTour";
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
  // Standalone viewer for this building's uploaded panoramas.
  const [panoramaView, setPanoramaView] = useState(null); // { buildingId, items }
  const [checkingPanoramas, setCheckingPanoramas] = useState(false);
  const closePanoramaView = useCallback(() => setPanoramaView(null), []);

  if (!building) {
    return null;
  }

  const mainPhoto = resolveImage(building.photo);
  const shownPhoto = mainErrored ? "" : mainPhoto;

  // "Open 360 Tour":
  //  1. panoramas uploaded for THIS building (Admin → Buildings) open in a
  //     standalone viewer — only this building, no pathway links;
  //  2. otherwise the building's existing tour from static/tourNodes.js
  //     (found by building id, linked department or abbreviation);
  //  3. otherwise the "not available" screen.
  const inTour = async () => {
    if (checkingPanoramas) return;
    setCheckingPanoramas(true);
    let items;
    try {
      items = await getBuildingPanoramas(building);
    } catch {
      items = [];
    } finally {
      setCheckingPanoramas(false);
    }

    // Same lookup the Departments page uses, so both buttons agree.
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
        {/* HEADER */}
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
          {/* CLOSE BUTTON */}
          <button
            type="button"
            className="building-modal-close"
            onClick={onClose}
            aria-label="Close building information"
          >
            <X size={22}/>
          </button> 
        </div>
        {/* BODY */}
        <div className="building-modal-body">
          {/* PHOTO */}
          {shownPhoto && (
            <div className="building-modal-photo">
              <img
                src={shownPhoto}
                alt={building.name}
                onError={() => setMainErrored(true)}
              />
            </div>
          )}
          {/* Additional images / panoramas are not listed here — they open
              in the 360° tour via "Open 360 Tour", so a building with many
              panoramas doesn't flood this popup. */}
          {/* DESCRIPTION */}
          {building.desc && (
            <div className="building-modal-section">
              <h3>About</h3>
              <p>{building.desc}</p>
            </div>
          )}
          {/* LOCATION */}
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
            {/* HOURS */}
            {building.hours && (
              <div className="building-info-card">
                <Clock size={18} />
                <div>
                  <span>Operating Hours</span>
                  <strong>{building.hours}</strong>
                </div>
              </div>
            )}
            {/* TYPE */}
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
            {/* COORDINATES */}
            <div className="building-info-card">
              <MapPin size={18} />
              <div>
                <span>Coordinates</span>
                <strong>{building.lat}, {building.lng}</strong>
              </div>
            </div>
          </div>
          {/* OFFICES */}
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
            {/* PROGRAMS */}
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
        {/* FOOTER */}
        {/* <div className="building-modal-footer"></div> */}
        <div className="building-modal-footer">
          {/* <button
            type="button"
            className="building-modal-route-btn"
            onClick={onRoute}
            disabled={routeLoading}
          >
            <Road size={18} />
            {routeLoading ? "Getting Route..." : "Get Destination Route"}
          </button> */}
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