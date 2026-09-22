import { useMemo, useState } from "react";
import "../styles/map.css";
import { MapContainer, Marker, TileLayer, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getWalkingRoute, RouteFitter, TILELAYER_ATTRIBUTION, TILELAYER_URL, userLocationIcon } from "../utils/map-leaflet";
import { LocateFixed, Road, SendHorizontal } from "lucide-react";
import { useUI } from "../context/UIContext.jsx";
import { useCampusData } from "../context/CampusDataContext.jsx";
import { hasTour } from '../data/nwssuTour.js';

/* 
  Mock data la ine pero an position property dapat sugad an implementation 
  para dire marubat sa map or mag error 

  pwede liwat an implementation is sugadsine
  position: [buildings.lat, buildings.long] 
  from useCampusData() na hook
*/
const campusBuildings = [
  {
    abbr: "OVL",
    name: "NwSSU Oval",
    position: [12.071099, 124.596009]
  },
  {
    abbr: "COM-DO",
    name: "COM Dean's Office",
    position: [12.072248, 124.597205]
  },
  {
    abbr: "REG",
    name: "University Registrar",
    position: [12.071146, 124.596655]
  },
  {
    abbr: "SAS",
    name: "Student Affairs and Services",
    position: [12.071836, 124.595805]
  },
  {
    abbr: "COE",
    name: "College of Engineering",
    position: [12.071865, 124.597009],
  },
  {
    abbr: "COM",
    name: "College of Management",
    position: [12.072298, 124.59667],
  },
  {
    abbr: "CCJS",
    name: "College of Criminal Justice and Sciences",
    position: [12.070170, 124.595760],
  },
  {
    abbr: "COED",
    name: "College of Education",
    position: [12.069968, 124.595813],
  },
  {
    abbr: "CAT",
    name: "College of Agriculture and Technology",
    position: [12.071484, 124.595574],
  },
  {
    abbr: "CON",
    name: "College of Nursing",
    position: [12.071007, 124.596618],
  },
  {
    abbr: "CCIS",
    name: "College of Computing and Information Sciences",
    position: [12.070532, 124.59643],
  },
];

const Map = () => {

  const { openTour, openUnavailable } = useUI();
  const { buildings } = useCampusData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loader, setLoader] = useState(null);
  const [alertMsg, setAlertMsg] = useState({
    success: false,
    message: ""
  });
  const [route, setRoute] = useState({
    coordinates: null,
    distance: null,
    duration: null
  });

  const filteredBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return campusBuildings;
    }

    return campusBuildings.filter(
      (building) =>
        building.abbr.toLowerCase().includes(query) ||
        building.name.toLowerCase().includes(query)
    );
  }, [search]);

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
  };

  const getCurrentLocation = () => {
    try {
      setLoader("location");
      if (!navigator.geolocation) {
        return alert("Geolocation is not supported by this browser");
      }

      navigator.geolocation.getCurrentPosition(
        // Success getting location
        (position) => {
          const location = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(location);
          setAlertMsg({
            success: true,
            message: "Your location has been detected"
          });
          setLoader(null);
        },
        // Error
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              alert("Location permission was denied.");
              break;

            case err.POSITION_UNAVAILABLE:
              alert("Your location could not be determined.");
              break;

            case err.TIMEOUT:
              alert("Getting your location timed out.");
              break;

            default:
              alert("Unable to get your location.");
          }
          setLoader(null);
        },
        // Gps Options
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    } 
    catch (error) {
      alert(error);  
    }
  }

  const handleNavigateHere = () => {
    if (!selectedBuilding) {
      setAlertMsg({ message: "Please select a destination building first." });
      return;
    }

    // campusBuildings above is mock data keyed by abbr only; look up the
    // matching real building record (from useCampusData) to get its real
    // id, since that's what the tour data (ccisTour.js) is keyed by.
    const match = buildings.find((b) => b.abbr === selectedBuilding.abbr);

    if (match && hasTour(match.id)) {
      openTour(match.id);
    } else {
      openUnavailable("Virtual tour is currently not available for this location yet.");
    }
  };

  const handleGetRoute = async () => {
    setLoader("destination");
    try {
      if (!userLocation) {
        setAlertMsg({ message: "Please get your current location first" });
        setLoader(null);
        return;
      }

      if (!selectedBuilding) {
        setAlertMsg({ message: "Please select a destination building." });
        setLoader(null);
        return;
      }

      const result = await getWalkingRoute(userLocation, selectedBuilding.position);
      setRoute(result);
      setLoader(null);
    } 
    catch (error) {
      setLoader(null);
      alert(error);  
    }
  }

  return (
    <main className={`container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="map-sidebar">
        <div className="sidebar-header">
          {isSidebarOpen && (
            <div className="sidebar-title">
              <span>Campus Buildings</span>
              <small>{campusBuildings.length} buildings</small>
            </div>
          )}

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? "x" : "≡"}
          </button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="building-search">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                placeholder="Search buildings..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="building-list">
              {filteredBuildings.length > 0 ? (
                filteredBuildings.map((building) => (
                  <button
                    type="button"
                    key={building.abbr}
                    className={`building-item ${
                      selectedBuilding?.abbr === building.abbr
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleBuildingClick(building)}
                  >
                    <span className="building-abbr">{building.abbr}</span>

                    <span className="building-info">
                      <strong>{building.name}</strong>
                      <small>{String(building.position)}</small>
                    </span>
                  </button>
                ))
              ) : (
                <div className="no-results">
                  <span>⌕</span>
                  <strong>No buildings found</strong>
                  <small>Try a different search.</small>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      <section className="map-content">
        <div className="map-placeholder">
          <MapContainer
            center={[12.07113, 124.59621]}
            zoom={18}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution={TILELAYER_ATTRIBUTION}
              url={TILELAYER_URL}
            />

            {selectedBuilding && (
              <Marker position={selectedBuilding.position}>
                <Popup>
                  <strong>{selectedBuilding.name}</strong>
                </Popup>
              </Marker>
            )}

            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>Your Current Location</Popup>
              </Marker>
            )}

            {route.coordinates && (
              <>
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: "#2563eb",
                    weight: 6,
                    opacity: 0.85,
                  }}
                />
                
                <RouteFitter route={route.coordinates}/>
              </>
            )}
          </MapContainer>
        </div>

        <figure className="map-action-card">
          {alertMsg.message && (
            <div
              className={`map-alert ${
                alertMsg.success ? "map-alert-success" : "map-alert-error"
              }`}
            >
              {alertMsg.message}
            </div>
          )}

          <button
            type="button"
            className={loader === "location" ? "get-location-btn-loader" : "get-location-btn"}
            onClick={getCurrentLocation}
            disabled={loader === "location"}
          ><LocateFixed style={{ marginRight: 6 }} size={18}/> {loader === "location" ? "Locating..." : `Get My Location`}</button>

          <button
            type="button"
            className={loader === "destination" ? "destination-route-btn-loader" : "destination-route-btn"}
            onClick={handleGetRoute}
            disabled={loader === "destination"}
          ><Road size={18} style={{ marginRight: 6 }}/> {loader === "destination" ? "Getting Destination Route" : "Get Destination Route"}</button>

          <button
            type="button"
            className={loader === "destination" ? "destination-route-btn-loader" : "destination-route-btn"}
            onClick={handleNavigateHere}
            disabled={loader === "destination"}
          ><SendHorizontal size={18} style={{ marginRight: 6 }}/>Navigate Here</button>

          {route.coordinates && (
            <div className="route-info">
              <p><strong>Distance:</strong> {Math.round(route.distance)} meters</p>
              <p><strong>Time:</strong> {Math.ceil(route.duration / 60)} minutes</p>
            </div>
          )}
        </figure>
      </section>
    </main>
  );
};

export default Map;