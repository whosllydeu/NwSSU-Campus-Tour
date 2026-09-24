import { Building2, Clock, MapPin, Road, SendHorizontal, X } from "lucide-react";
import "../stylesheets/map.css";

const BuildingInfoModal = ({ building, onClose, onRoute, onNavigate, routeLoading, navigateLoading }) => {

  if (!building) {
    return null;
  }

  return (
    <div className="building-modal-overlay">
      <div className="building-modal" onClick={(event) => event.stopPropagation()}>
        {/* HEADER */}
        <div className="building-modal-header">
          <div className="building-modal-title">
            <div className="building-modal-icon" style={{ backgroundColor: building.color || "#2c3e50" }}>
              {building.emoji || "🏢"}
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
          {building.photo && (
            <div className="building-modal-photo">
              <img
                src={building.photo}
                alt={building.name}
              />
            </div>
          )}
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
        <div className="building-modal-footer">
          <button
            type="button"
            className="building-modal-route-btn"
            onClick={onRoute}
            disabled={routeLoading}
          >
            <Road size={18} />
            {routeLoading ? "Getting Route..." : "Get Destination Route"}
          </button>
          <button
            type="button"
            className="building-modal-navigate-btn"
            onClick={onNavigate}
            disabled={navigateLoading}
          >
            <SendHorizontal size={18} />
            {navigateLoading ? "Opening..." : "Navigate Here"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuildingInfoModal;