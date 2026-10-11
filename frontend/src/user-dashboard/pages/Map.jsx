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
} from "../utils/map-leaflet";
import { Globe, LocateFixed, Road } from "lucide-react";
import { Navbar } from "../components";
import { useCampusData } from "../context/DataContext";
import { planWalk, WALK_ROUTES } from "../static/nwssuTour";
import { useUI } from "../context/UIContext";
import BuildingInfoModal from "../components/BuildingInfoModal";
import { findBuildingTourId } from "../utils/panorama";

// DEV ONLY: pretend to stand somewhere on campus while testing at home.
// Put  VITE_TEST_LOCATION=12.071414,124.595566  in .env.local, restart
// `npm run dev`, and remove it again before deploying.
const TEST_LOCATION = (() => {
  const raw = import.meta.env.VITE_TEST_LOCATION;
  if (!raw) return null;
  const [lat, lng] = String(raw).split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
})();

const GEO_ERRORS = {
  1: "Location permission was denied. Allow location access in your browser settings.",
  2: "Your location could not be determined.",
  3: "Getting your location timed out.",
};

/** Asks the browser for the user's position. Resolves to [lat, lng]. */
function requestLocation() {
  if (TEST_LOCATION) return Promise.resolve(TEST_LOCATION);
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      (err) => reject(new Error(GEO_ERRORS[err.code] || "Unable to get your location.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function Map() {
  const { buildings, departments } = useCampusData();

  const { openUnavailable, openTour } = useUI();
  // Real buildings PLUS lightweight virtual locations (e.g. the Gate) —
  // so GPS detection, the sidebar list, and map markers all treat both
  // the same way for routing/pathway purposes.
  // Memoised so it only rebuilds when `buildings` changes — otherwise the
  // useMemo below (filteredBuildings) would recompute on every render.
  const CAMPUS_BUILDING = useMemo(
    () => [...transformedObjectBuilding(buildings), ...VIRTUAL_LOCATIONS],
    [buildings]
  );

  // WALK_ROUTES (tours/walkRoutes.js) are keyed by short ids like 'ccis'.
  // Buildings added from the Admin Dashboard get name-based ids, so also
  // try the linked department and the abbreviation (same lookup the
  // "Open 360 Tour" button uses).
  const walkRouteKey = (id) => {
    if (!id) return null;
    if (WALK_ROUTES[id]) return id;
    const full = buildings.find((b) => b.id === id) || CAMPUS_BUILDING.find((b) => b.id === id);
    return findBuildingTourId(full, departments, (key) => Boolean(WALK_ROUTES[key]));
  };

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile());
  const [modalBuilding, setModalBuilding] = useState(null);
  // Where userLocation came from: 'gps' (real current location) or
  // 'origin' (picked from the list — temporary testing tool).
  const [locationSource, setLocationSource] = useState(null);
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
      setLocationSource('origin');
      setAlertMsg({ success: true, message: `📍 Origin set to ${building.name}.` });
    } else {
      setSelectedBuilding(building);
    }
  };

  // Saves a location as the user's origin and detects which building it is at.
  const applyLocation = (location) => {
    const { building } = findBuildingAtLocation(location, CAMPUS_BUILDING);
    setUserLocation(location);
    setOriginBuildingId(building?.id || null);
    setLocationSource('gps');
    return building;
  };

  const getCurrentLocation = async () => {
    setLoader("location");
    try {
      const location = await requestLocation();
      const building = applyLocation(location);
      setAlertMsg({
        success: true,
        message: building
          ? `📍Location Detected: You are at ${building.name}. (${location[0].toFixed(6)}, ${location[1].toFixed(6)})`
          : `📍Location Detected: Not near a recognized location yet. Raw coordinates: ${location[0].toFixed(6)}, ${location[1].toFixed(6)}`,
      });
    } catch (error) {
      setAlertMsg({ message: error.message });
    } finally {
      setLoader(null);
    }
  };

  // "Walk there!" — opens the 360° tour on the best starting panorama
  // (nearest GPS-tagged node → the building you're at → Main Gate) and
  // guides you along the shortest chain of pathway panoramas into the
  // selected building's entrance node. Routes are configured in
  // WALK_ROUTES (static/tourNodes.js), not hard-coded here.
  const handleNavigateHere = async () => {
    if (!selectedBuilding) {
      setAlertMsg({ message: "Select a destination building first." });
      return;
    }

    // First-time visitors may not know where they are — if no origin was
    // set yet, quietly try GPS so the walk starts from the photo nearest
    // to them instead of always from the Gate.
    let location = userLocation;
    let originId = originBuildingId;
    if (!location && !originId) {
      setLoader("destination");
      try {
        location = await requestLocation();
        originId = applyLocation(location)?.id || null;
      } catch {
        location = null; // no permission / no GPS → fall back below
      } finally {
        setLoader(null);
      }
    }

    const plan = planWalk(walkRouteKey(selectedBuilding.id) || selectedBuilding.id, {
      userLocation: location,
      originBuildingId: walkRouteKey(originId),
    });

    if (!plan) {
      openUnavailable("A 360° walking route to this location isn't available yet.");
      return;
    }

    if (plan.startDistance !== null) {
      setAlertMsg({ success: true, message: `🚶 Starting from the 360° photo nearest to you (${Math.round(plan.startDistance)} m away).` });
    } else if (location) {
      setAlertMsg({ message: "No 360° photo with coordinates is close to you yet — starting from your origin / the Main Gate." });
    }

    openTour(selectedBuilding.id, {
      startNode: plan.startNode,
      destinationNode: plan.arriveNode,
      destinationLabel: selectedBuilding.name,
    });
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

              {/* Current location — "Walk there!" then starts from the 360°
                  photo nearest to where the user is standing. */}
              <div style={{ padding: '8px 12px 0' }}>
                <button
                  type="button"
                  className={
                    loader === "location"
                      ? "get-location-btn-loader"
                      : locationSource === "gps" ? "destination-route-btn" : "get-location-btn"
                  }
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={getCurrentLocation}
                  disabled={loader === "location"}
                >
                  <LocateFixed size={18} style={{ marginRight: 6 }} />
                  {loader === "location"
                    ? "Locating..."
                    : locationSource === "gps" ? "Using My Current Location ✓" : "Use My Current Location"}
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