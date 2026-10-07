import { useEffect, useMemo, useState } from "react";
import "../stylesheets/map.css";
import { MapContainer, Marker, TileLayer, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { 
  allLocationIcon, 
  findBuildingAtLocation, 
  getWalkingRoute, 
  RouteFitter, 
  selectedLocationIcon,
  TILELAYER_URL, 
  userLocationIcon,
  transformedObjectBuilding,
  VIRTUAL_LOCATIONS,
  findNearestPanorama
} from "../utils/map-leaflet";
import { Globe, LocateFixed, Road, Footprints } from "lucide-react";
import { Navbar } from "../components";
import { useCampusData } from "../context/DataContext";
import { hasTour, findDirectPathway } from "../static/nwssuTour";
import { useUI } from "../context/UIContext";
import BuildingInfoModal from "../components/BuildingInfoModal";
import { nwssuTourNodes } from "../static/tourNodes";
import { useTour } from "../context/TourContext";

export default function Map() {
  const { buildings } = useCampusData();
  const { openUnavailable } = useUI();
  const { openTour } = useTour();
  // Real buildings PLUS lightweight virtual locations (e.g. the Gate) —
  // so GPS detection, the sidebar list, and map markers all treat both
  // the same way for routing/pathway purposes.
  const CAMPUS_BUILDING = [...transformedObjectBuilding(buildings), ...VIRTUAL_LOCATIONS];

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile());
  const [modalBuilding, setModalBuilding] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  // Which building the current userLocation corresponds to, if any —
  // set either from GPS detection or from manually picking a building
  // as the origin. Needed to look up a direct pathway tour for "Walk There".
  const [originBuildingId, setOriginBuildingId] = useState(null);
  // 'destination' (default, existing behavior) or 'origin' — controls
  // what clicking a building in the sidebar list does. This is really
  // just a manual override/testing tool now — normally "My Location"
  // alone is enough to set your origin automatically.
  const [pickMode, setPickMode] = useState("destination");
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
      return CAMPUS_BUILDING;
    }

    return CAMPUS_BUILDING.filter(
      (building) =>
        building.abbr.toLowerCase().includes(query) ||
        building.name.toLowerCase().includes(query)
    );
  }, [CAMPUS_BUILDING, search]);

  useEffect(() => {
    console.log(selectedBuilding);
  }, [selectedBuilding]);

  const handleBuildingClick = (building) => {
    if (pickMode === "origin") {
      setUserLocation(building.position);
      setOriginBuildingId(building.id);
      setAlertMsg({ success: true, message: `📍 Origin set to ${building.name}.` });
    } else {
      setSelectedBuilding(building);
    }
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
          const testLocation = [12.071414, 124.595566];
          const { building } = findBuildingAtLocation(location, CAMPUS_BUILDING);
          setUserLocation(testLocation);
          setOriginBuildingId(building?.id || null);
          setAlertMsg({
            success: true,
        message: building
          ? `📍Location Detected: You are at ${building.name}. (${location[0].toFixed(6)}, ${location[1].toFixed(6)})`
          : `📍Location Detected: Not near a recognized location yet. Raw coordinates: ${location[0].toFixed(6)}, ${location[1].toFixed(6)}`
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
    if (!userLocation) {
      setAlertMsg({ message: "Please get your current location first" });
      return;
    }

    const { building } = findBuildingAtLocation(userLocation, CAMPUS_BUILDING);
    if (!building) {
      setAlertMsg({ message: "Make sure you are on the university campus." });
      return;
    }

    const match = buildings.find((b) => b.id === building.id);

    if (match && hasTour(match.id)) {
      
      const nodes = nwssuTourNodes[match.id];

      const nearest = findNearestPanorama(
        userLocation,
        nodes
      );

      if (!nearest) {
        openUnavailable(
          "No panorama location is available for this tour yet."
        );
        return;
      }

      console.log(
        `Nearest panorama: ${nearest.node.id} (${nearest.distance.toFixed(2)}m away)`
      );

      openTour(
        match.id,
        nearest.node.id
      );
    } else {
      openUnavailable("Virtual Tour is currently not available for this location yet.");
    }
  }

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

  // Direct pathway tour (if any) between the current origin building
  // and the selected destination building. null when no origin
  // building is known, or no direct pathway connects the two.
  const pathwayMatch = useMemo(() => {
    if (!originBuildingId || !selectedBuilding) return null;
    return findDirectPathway(originBuildingId, selectedBuilding.id);
  }, [originBuildingId, selectedBuilding]);

  const handleWalkThere = () => {
    if (!pathwayMatch) return;
    openTour(pathwayMatch.pathwayId, { reverse: pathwayMatch.reverse, startFile: pathwayMatch.startFile });
  };

  return (
    <>
      <Navbar/>
      <main className={`container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <aside className="map-sidebar">
          <div className="sidebar-header">
            {isSidebarOpen && (
              <div className="sidebar-title">
                <span>Campus Buildings</span>
                <small>{CAMPUS_BUILDING.length} buildings</small>
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
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px 0' }}>
                <button
                  type="button"
                  className={pickMode === "destination" ? "destination-route-btn" : "get-location-btn"}
                  onClick={() => setPickMode("destination")}
                >
                  🎯 Pick Destination
                </button>
                <button
                  type="button"
                  className={pickMode === "origin" ? "destination-route-btn" : "get-location-btn"}
                  onClick={() => setPickMode("origin")}
                >
                  📍 Pick Origin
                </button>
              </div>

              <div className="building-search">
                <span className="search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search buildings..."
                  value={search}
                  onChange={(event) => {
                    const inputValue = event.target.value;
                    setSearch(inputValue);
                    if (!inputValue.trim()) {
                      setSelectedBuilding(null);
                    }
                  }}
                />

                {search && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => {
                      setSearch("");
                      setSelectedBuilding(null);
                    }}
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
                      key={building.id}
                      className={`building-item ${
                        selectedBuilding?.id === building.id || originBuildingId === building.id
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
                url={TILELAYER_URL}
              />

              {filteredBuildings.map((building) => {
                const isSelected = selectedBuilding?.id === building.id;

                return (
                  <Marker
                    key={building.id}
                    position={building.position}
                    icon={isSelected ? selectedLocationIcon : allLocationIcon}
                    eventHandlers={{
                      click: () => {
                        const campusBuilding = buildings.find(
                          (item) => item.id === building.id
                        );

                        if (campusBuilding) {
                          setModalBuilding(campusBuilding);
                        }
                      },
                    }}
                  />
                );
              })}

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

            <div style={{ display: 'flex', alignItems: 'center', columnGap: 6 }}>
              <button
                type="button"
                className={loader === "location" ? "get-location-btn-loader" : "get-location-btn"}
                onClick={getCurrentLocation}
                disabled={loader === "location"}
              ><LocateFixed style={{ marginRight: 6 }} size={18}/> {loader === "location" ? "Locating..." : `My Location`}</button>

              <button
                type="button"
                className={loader === "destination" ? "destination-route-btn-loader" : "destination-route-btn"}
                onClick={handleGetRoute}
                disabled={loader === "destination"}
              ><Road size={18} style={{ marginRight: 6 }}/> {loader === "destination" ? "Getting Route" : "Get Route"}</button>
            </div>

            <button
              type="button"
              className={loader === "destination" ? "navigate-btn-loader" : "navigate-btn"}
              disabled={loader === "destination"}
              onClick={handleNavigateHere}
            ><Globe size={18} style={{ marginRight: 6 }}/>Walk there!</button>

            {route.coordinates && (
              <div className="route-info">
                <p><strong>Distance:</strong> {Math.round(route.distance)} meters</p>
                <p><strong>Time:</strong> {Math.ceil(route.duration / 60)} minutes</p>
              </div>
            )}

            {route.coordinates && pathwayMatch && (
              <button
                type="button"
                className="navigate-btn"
                onClick={handleWalkThere}
              ><Footprints size={18} style={{ marginRight: 6 }}/>Walk There</button>
            )}

            {route.coordinates && !pathwayMatch && originBuildingId && (
              <p style={{ fontSize: 12, opacity: 0.7, margin: '6px 0 0' }}>
                A 360° walking pathway isn't available for this route yet.
              </p>
            )}
          </figure>
        </section>
      </main>
      {modalBuilding && (
        <BuildingInfoModal
          building={modalBuilding}
          onClose={() => setModalBuilding(null)}
          // onNavigate={handleNavigateHere}
          navigateLoading={loader === "navigation"}
        />
      )}
    </>
  );
};