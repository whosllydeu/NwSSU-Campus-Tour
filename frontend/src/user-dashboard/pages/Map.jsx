import { useEffect, useMemo, useRef, useState } from "react";
import "../stylesheets/map.css";
import "../stylesheets/map-actions.css";
import {
  MapContainer,
  Marker,
  TileLayer,
  LayersControl,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  allLocationIcon,
  findBuildingAtLocation,
  getWalkingRoute,
  RouteFitter,
  selectedLocationIcon,
  TILELAYER_URL,
  TILELAYER_ATTRIBUTION,
  SATELLITE_URL,
  SATELLITE_ATTRIBUTION,
  userLocationIcon,
  transformedObjectBuilding,
  VIRTUAL_LOCATIONS,
} from "../utils/map-leaflet";
import { campusRouter, formatDistance } from "../../utils/campusRouting";
import { ChevronDown, ChevronUp, Globe, LocateFixed, Navigation, Network, Road, RotateCcw } from "lucide-react";
import { LiveFollower, routeProgress } from "../utils/liveTracking";
import { Navbar } from "../components";
import { useCampusData } from "../context/DataContext";
import { planWalk, setWalkCorridor, WALK_ROUTES } from "../static/nwssuTour";
import { useUI } from "../context/UIContext";
import BuildingInfoModal from "../components/BuildingInfoModal";
import { findBuildingTourId } from "../utils/panorama";

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
  const CAMPUS_BUILDING = useMemo(
    () => [...transformedObjectBuilding(buildings), ...VIRTUAL_LOCATIONS],
    [buildings]
  );

  const walkRouteKey = (id) => {
    if (!id) return null;
    if (WALK_ROUTES[id]) return id;
    const full = buildings.find((b) => b.id === id) || CAMPUS_BUILDING.find((b) => b.id === id);
    return findBuildingTourId(full, departments, (key) => Boolean(WALK_ROUTES[key]));
  };

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile());
  const [modalBuilding, setModalBuilding] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [originBuildingId, setOriginBuildingId] = useState(null);
  const [pickMode, setPickMode] = useState("destination");
  const [loader, setLoader] = useState(null);
  const [alertMsg, setAlertMsg] = useState({
    success: false,
    message: ""
  });
  const [route, setRoute] = useState(EMPTY_ROUTE);
  const [tracking, setTracking] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [accuracy, setAccuracy] = useState(null);
  const lastReroute = useRef(0);
  const arrivedRef = useRef(false);
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

  const handleReset = () => {
    setTracking(false);
    setRoute(EMPTY_ROUTE);
    setWalkCorridor(null);
    setSelectedBuilding(null);
    setUserLocation(null);
    setOriginBuildingId(null);
    setLocationSource(null);
    setPickMode("destination");
    setSearch("");
    setAlertMsg({ success: false, message: "" });
  };

  const hasTripState = Boolean(route.coordinates || selectedBuilding || userLocation);

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

  const handleNavigateHere = async () => {
    if (!selectedBuilding) {
      setAlertMsg({ message: "Select a destination building first." });
      return;
    }

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
        location = null;
      } finally {
        setLoader(null);
      }
    }

    const originBuilding = originId ? CAMPUS_BUILDING.find((b) => b.id === originId) : null;

    let mapRoute;
    try {
      const gate = VIRTUAL_LOCATIONS.find((v) => v.id === "gate");
      const start =
        source === "origin" && originBuilding
          ? toRouteEndpoint(originBuilding, location)
          : location ?? toRouteEndpoint(gate);
      mapRoute = await getWalkingRoute(start, toRouteEndpoint(selectedBuilding));
    } catch {
      mapRoute = null;
    }
    setRoute(mapRoute ?? EMPTY_ROUTE);
    setWalkCorridor(mapRoute?.coordinates ?? null);

    const plan = planWalk(walkRouteKey(selectedBuilding.id) || selectedBuilding.id, {
      userLocation: location,
      originBuildingId: walkRouteKey(originId),
      destinationLatLng: selectedBuilding.position,
      destinationName: selectedBuilding.name,
      routeCoordinates: mapRoute?.coordinates ?? null,
      startFromOrigin: source === "origin",
    });

    if (!plan) {
      openUnavailable("A 360° walking route to this location isn't available yet.");
      return;
    }

    const nearWhat = source === "origin" && originBuilding ? originBuilding.name : "you";
    const arriveNote =
      plan.arriveDistance !== null
        ? ` (the 360° walk ends on the pathway ${Math.round(plan.arriveDistance)} m from it)`
        : "";
    const stepsText = `${plan.steps} ${plan.steps === 1 ? "step" : "steps"} to ${selectedBuilding.name}${arriveNote}`;

    if (plan.startSource === "origin") {
      setAlertMsg({
        success: true,
        message: `🚶 Starting at ${originBuilding?.name || "your starting building"} (${plan.startLabel}) · ${stepsText}.`,
      });
    } else if (plan.startSource === "gps") {
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

  const getEntranceNodeId = (building) => {
    if (!building) return null;
    const raw = buildings.find((item) => item.id === building.id);
    return building.entranceNodeId ?? raw?.entranceNodeId ?? null;
  };

  const toRouteEndpoint = (building, fallbackPosition) => {
    const entranceNodeId = getEntranceNodeId(building);
    if (entranceNodeId && campusRouter.getNode(entranceNodeId)) {
      return { entranceNodeId };
    }
    return fallbackPosition ?? building?.position ?? null;
  };

  // ---------- Live tracking ----------
  useEffect(() => {
    if (!tracking) return undefined;
    if (!navigator.geolocation) {
      Promise.resolve().then(() => {
        setTracking(false);
        setAlertMsg({ message: "Geolocation is not supported by this browser." });
      });
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        setLocationSource("gps");
      },
      (err) => {
        setAlertMsg({ message: GEO_ERRORS[err.code] || "Unable to get your location." });
        if (err.code === 1) setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [tracking]);

  const progress = useMemo(
    () => (tracking && route.coordinates ? routeProgress(route.coordinates, userLocation) : null),
    [tracking, route.coordinates, userLocation],
  );

  // Arrival message, and a new route if the user walks away from the line.
  useEffect(() => {
    if (!tracking || !progress || !selectedBuilding || !userLocation) return;
    if (progress.remaining <= 10) {
      if (!arrivedRef.current) {
        arrivedRef.current = true;
        Promise.resolve().then(() =>
          setAlertMsg({ success: true, message: `✅ You have arrived at ${selectedBuilding.name}.` }),
        );
      }
      return;
    }
    arrivedRef.current = false;
    const now = Date.now();
    if (progress.offRoute > 25 && now - lastReroute.current > 10000) {
      lastReroute.current = now;
      getWalkingRoute(userLocation, toRouteEndpoint(selectedBuilding))
        .then((result) => {
          setRoute(result);
          setAlertMsg({ success: true, message: "🔄 You left the route — a new route was found from where you are." });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, progress, selectedBuilding, userLocation]);

  const toggleTracking = () => {
    if (tracking) {
      setTracking(false);
      setAccuracy(null);
      setAlertMsg({ success: true, message: "Live tracking stopped." });
      return;
    }
    arrivedRef.current = false;
    setTracking(true);
    setAlertMsg({
      success: true,
      message: route.coordinates
        ? "📡 Live tracking on — the remaining distance updates as you walk."
        : "📡 Live tracking on — your position updates as you walk. Pick a destination and tap Get Route.",
    });
  };

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
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Satellite">
                  <TileLayer
                    url={SATELLITE_URL}
                    attribution={SATELLITE_ATTRIBUTION}
                    maxNativeZoom={18}
                    maxZoom={21}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Map">
                  <TileLayer
                    url={TILELAYER_URL}
                    attribution={TILELAYER_ATTRIBUTION}
                    maxNativeZoom={19}
                    maxZoom={21}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

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
                  >
                    <Tooltip direction="top" offset={[0, -36]}>
                      {building.name}
                    </Tooltip>
                  </Marker>
                );
              })}

              {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon}>
                  <Popup>{tracking ? "You are here (live)" : "Your Current Location"}</Popup>
                </Marker>
              )}

              {tracking && userLocation && accuracy && (
                <Circle
                  center={userLocation}
                  radius={accuracy}
                  interactive={false}
                  pathOptions={{ color: "#1a73e8", weight: 1, fillColor: "#1a73e8", fillOpacity: 0.12 }}
                />
              )}

              {tracking && userLocation && <LiveFollower position={userLocation} />}

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

                  {!tracking && <RouteFitter route={route.coordinates}/>}
                </>
              )}
            </MapContainer>
          </div>

          <figure className={`map-action-card${panelOpen ? '' : ' is-collapsed'}`}>
            <button
              type="button"
              className="mac-toggle"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-label={panelOpen ? "Hide map controls" : "Show map controls"}
            >
              <span className="mac-grip" aria-hidden="true" />
              {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              <span>
                {panelOpen
                  ? "Hide controls"
                  : route.coordinates
                    ? `Show controls · ${Math.round(progress ? progress.remaining : route.distance)} m`
                    : "Show controls"}
              </span>
            </button>

            <div className="mac-body" hidden={!panelOpen}>
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
              className={tracking ? "destination-route-btn" : "get-location-btn"}
              style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
              onClick={toggleTracking}
              aria-pressed={tracking}
            ><Navigation size={18} style={{ marginRight: 6 }}/>{tracking ? "Stop Live Tracking" : "Start Live Tracking"}</button>

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
                {progress ? (
                  <>
                    <p><strong>Remaining:</strong> {Math.round(progress.remaining)} meters</p>
                    <p><strong>Time left:</strong> {Math.max(1, Math.ceil(progress.remaining / 1.3 / 60))} minutes</p>
                    {accuracy && <p><small>GPS accuracy: ±{Math.round(accuracy)} m</small></p>}
                  </>
                ) : (
                  <>
                    <p><strong>Distance:</strong> {Math.round(route.distance)} meters</p>
                    <p><strong>Time:</strong> {Math.max(1, Math.ceil(route.duration / 60))} minutes</p>
                  </>
                )}

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
            </div>
          </figure>
        </section>
      </main>
      {modalBuilding && (
        <BuildingInfoModal
          building={modalBuilding}
          onClose={() => setModalBuilding(null)}
          navigateLoading={loader === "navigation"}
        />
      )}

    </>
  );
};