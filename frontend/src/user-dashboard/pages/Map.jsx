import { useEffect, useMemo, useState } from "react";
import "../stylesheets/map.css";
import "../stylesheets/map-actions.css";
import {
  MapContainer,
  Marker,
  TileLayer,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
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
import { campusRouter, formatDistance } from "../../utils/campusRouting";
import { Globe, LocateFixed, Network, Road, RotateCcw } from "lucide-react";
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

const EMPTY_ROUTE = {
  coordinates: null,
  distance: null,
  duration: null,
  steps: [],
  edges: [],
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
  const [route, setRoute] = useState(EMPTY_ROUTE);
  // Graph mode: overlays the campus walkway graph (nodes + edges).
  const [showGraph, setShowGraph] = useState(false);
  const graphStats = useMemo(() => campusRouter.analyze(), []);

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

  // "Reset" — clears the route, origin, destination and messages so the
  // user can start a new trip from scratch.
  const handleReset = () => {
    setRoute(EMPTY_ROUTE);
    setSelectedBuilding(null);
    setUserLocation(null);
    setOriginBuildingId(null);
    setLocationSource(null);
    setPickMode("destination");
    setSearch("");
    setAlertMsg({ success: false, message: "" });
  };

  const hasTripState = Boolean(route.coordinates || selectedBuilding || userLocation);

  // A new origin or destination makes the drawn route outdated, so every
  // handler that changes them also clears the route (no effect needed).
  const handleBuildingClick = (building) => {
    setRoute(EMPTY_ROUTE);
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
    setRoute(EMPTY_ROUTE);
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

  // "Walk there!" — opens the 360° tour on the PATHWAY photo closest to
  // the user's origin (GPS / test location, or the picked origin
  // building's coordinates) that can actually reach the destination,
  // then guides along the shortest chain of photos to the destination's
  // arrival photo. Main Gate is only used when there is no origin at all.
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
    let source = locationSource;
    if (!location && !originId) {
      setLoader("destination");
      try {
        location = await requestLocation();
        originId = applyLocation(location)?.id || null;
        source = "gps";
      } catch {
        location = null; // no permission / no GPS → fall back below
      } finally {
        setLoader(null);
      }
    }

    const plan = planWalk(walkRouteKey(selectedBuilding.id) || selectedBuilding.id, {
      userLocation: location,
      originBuildingId: walkRouteKey(originId),
      destinationLatLng: selectedBuilding.position,
      destinationName: selectedBuilding.name,
    });

    if (!plan) {
      openUnavailable("A 360° walking route to this location isn't available yet.");
      return;
    }

    const originBuilding = originId ? CAMPUS_BUILDING.find((b) => b.id === originId) : null;
    const nearWhat = source === "origin" && originBuilding ? originBuilding.name : "you";
    const arriveNote =
      plan.arriveDistance !== null
        ? ` (the 360° walk ends on the pathway ${Math.round(plan.arriveDistance)} m from it)`
        : "";
    const stepsText = `${plan.steps} ${plan.steps === 1 ? "step" : "steps"} to ${selectedBuilding.name}${arriveNote}`;

    if (plan.startSource === "gps") {
      const meters = Math.round(plan.startDistance);
      setAlertMsg(
        plan.withinThreshold
          ? {
              success: true,
              message: `🚶 Starting at ${plan.startLabel}, the 360° photo nearest ${nearWhat === "you" ? "to you" : nearWhat} (${meters} m away) · ${stepsText}.`,
            }
          : {
              message: `📍 The closest 360° photo is ${meters} m away at ${plan.startLabel}. Starting there · ${stepsText}.`,
            }
      );
    } else {
      const reason = location
        ? "No 360° pathway photo with coordinates leads to this building yet"
        : "Your location is unknown";
      setAlertMsg({ message: `${reason} — starting from ${plan.startLabel} · ${stepsText}.` });
    }

    openTour(selectedBuilding.id, {
      startNode: plan.startNode,
      destinationNode: plan.arriveNode,
      destinationLabel: selectedBuilding.name,
    });
  }

  // A building's walkway entrance, if one is set. transformedObjectBuilding()
  // copies entranceNodeId, but also check the raw record to be safe.
  const getEntranceNodeId = (building) => {
    if (!building) return null;
    const raw = buildings.find((item) => item.id === building.id);
    return building.entranceNodeId ?? raw?.entranceNodeId ?? null;
  };

  // What the router should start/end at: the building's entrance node when
  // it has one, otherwise a position that gets snapped to the nearest walkway.
  const toRouteEndpoint = (building, fallbackPosition) => {
    const entranceNodeId = getEntranceNodeId(building);
    if (entranceNodeId && campusRouter.getNode(entranceNodeId)) {
      return { entranceNodeId };
    }
    return fallbackPosition ?? building?.position ?? null;
  };

  // On-campus route along the real walkways (computed in the browser).
  const handleGetRoute = async () => {
    if (!userLocation) {
      setAlertMsg({ message: "Please get your current location first" });
      return;
    }

    if (!selectedBuilding) {
      setAlertMsg({ message: "Please select a destination building." });
      return;
    }

    setLoader("destination");
    try {
      // A building picked as the origin starts from its entrance;
      // a real GPS position is snapped onto the nearest walkway.
      const originBuilding =
        locationSource === "origin"
          ? CAMPUS_BUILDING.find((item) => item.id === originBuildingId)
          : null;

      const result = await getWalkingRoute(
        toRouteEndpoint(originBuilding, userLocation),
        toRouteEndpoint(selectedBuilding)
      );
      setRoute(result);

      const snapNote =
        result.startSnap && result.startSnap.distance > 15
          ? ` Starting from the nearest walkway, ${Math.round(result.startSnap.distance)} m from you.`
          : "";
      setAlertMsg({
        success: true,
        message: `🚶 Route to ${selectedBuilding.name} found along campus walkways.${snapNote}`,
      });
    }
    catch (error) {
      setRoute(EMPTY_ROUTE);
      setAlertMsg({ message: error.message });
    }
    finally {
      setLoader(null);
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
                      setRoute(EMPTY_ROUTE);
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
                      setRoute(EMPTY_ROUTE);
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

              {/* Graph mode: campus walkway network (drawn under the route) */}
              {showGraph && (
                <>
                  {campusRouter.graph.edges.map((edge) => (
                    <Polyline
                      key={edge.id}
                      positions={edge.geometry}
                      interactive={false}
                      pathOptions={{
                        color: edge.connector ? "#dc2626" : "#64748b",
                        weight: 3,
                        opacity: 0.8,
                        dashArray: edge.connector ? "6 6" : null,
                      }}
                    />
                  ))}

                  {campusRouter.graph.nodes.map((node) => (
                    <CircleMarker
                      key={node.id}
                      center={node.coord}
                      radius={5}
                      pathOptions={{
                        color: "#0f172a",
                        weight: 2,
                        fillColor: node.kind === "intersection" ? "#f59e0b" : "#ffffff",
                        fillOpacity: 1,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -4]}>
                        {node.id} ({node.kind})
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </>
              )}

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
                  {showGraph && (
                    <Polyline
                      positions={route.coordinates}
                      interactive={false}
                      pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.9 }}
                    />
                  )}
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

            <div className="map-btn-row">
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

            <div className="map-btn-row">
              <button
                type="button"
                className={showGraph ? "destination-route-btn" : "get-location-btn"}
                onClick={() => setShowGraph((prev) => !prev)}
                aria-pressed={showGraph}
              ><Network size={18} style={{ marginRight: 6 }}/>{showGraph ? "Hide Graph" : "Show Graph"}</button>

              <button
                type="button"
                className="get-location-btn"
                onClick={handleReset}
                disabled={!hasTripState || loader === "destination"}
                title="Clear the route, origin and destination"
                style={{ opacity: hasTripState ? 1 : 0.6 }}
              ><RotateCcw size={18} style={{ marginRight: 6 }}/>Reset Route</button>
            </div>

            {showGraph && (
              <small style={{ display: 'block', marginTop: 6, opacity: 0.75 }}>
                Graph: {graphStats.nodeCount} nodes · {graphStats.edgeCount} edges · {graphStats.componentCount} connected component{graphStats.componentCount === 1 ? "" : "s"}
              </small>
            )}

            {route.coordinates && (
              <div className="route-info">
                <p><strong>Distance:</strong> {Math.round(route.distance)} meters</p>
                <p><strong>Time:</strong> {Math.max(1, Math.ceil(route.duration / 60))} minutes</p>

                {route.steps?.length > 0 && (
                  <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {route.steps.map((step, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>
                        {step.instruction}
                        {step.distance > 0 && <small> ({formatDistance(step.distance)})</small>}
                      </li>
                    ))}
                  </ol>
                )}
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