import { useEffect, useMemo, useState } from "react";
import "../stylesheets/map.css";
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
  RouteFitter, 
  selectedLocationIcon,
  TILELAYER_URL, 
  userLocationIcon,
  transformedObjectBuilding,
  VIRTUAL_LOCATIONS,
} from "../utils/map-leaflet";
import { campusRouter, formatDistance } from "../../utils/campusRouting";
import { Globe, LocateFixed, Network, Road } from "lucide-react";
import { Navbar } from "../components";
import { useCampusData } from "../context/DataContext";
import { planWalk } from "../static/nwssuTour";
import { useUI } from "../context/UIContext";
import BuildingInfoModal from "../components/BuildingInfoModal";

// How far (metres) a building/user position may be from a walkway and
// still be snapped onto it when the building has no entranceNodeId yet.
const MAX_SNAP_METERS = 60;

export default function Map() {
  const { buildings } = useCampusData();
  const { openUnavailable, openTour } = useUI();
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
    duration: null,
    steps: [],
    edgeIds: [],
  });
  // Graph mode: overlays the pedestrian graph (nodes + edges) for debugging.
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

  // "Walk there!" — opens the 360° tour on the best starting panorama
  // (nearest GPS-tagged node → the building you're at → Main Gate) and
  // guides you along the shortest chain of pathway panoramas into the
  // selected building's entrance node. Routes are configured in
  // WALK_ROUTES (static/tourNodes.js), not hard-coded here.
  const handleNavigateHere = () => {
    if (!selectedBuilding) {
      setAlertMsg({ message: "Select a destination building first." });
      return;
    }

    const plan = planWalk(selectedBuilding.id, {
      userLocation,
      originBuildingId,
    });

    if (!plan) {
      openUnavailable("A 360° walking route to this location isn't available yet.");
      return;
    }

    openTour(selectedBuilding.id, {
      startNode: plan.startNode,
      destinationNode: plan.arriveNode,
      destinationLabel: selectedBuilding.name,
    });
  }

  // Look up a building's graph entrance. transformedObjectBuilding() may
  // drop extra fields, so fall back to the raw building record.
  const getEntranceNodeId = (building) => {
    if (!building) return null;
    const raw = buildings.find((item) => item.id === building.id);
    return building.entranceNodeId ?? raw?.entranceNodeId ?? null;
  };

  // Turn a building or a raw position into something the router accepts:
  // { entranceNodeId } when the building has one, otherwise the position,
  // which the router snaps onto the nearest walkway.
  const toRouteEndpoint = (building, fallbackPosition) => {
    const entranceNodeId = getEntranceNodeId(building);
    if (entranceNodeId && campusRouter.getNode(entranceNodeId)) {
      return { entranceNodeId };
    }
    return fallbackPosition ?? building?.position ?? null;
  };

  const clearRoute = () =>
    setRoute({ coordinates: null, distance: null, duration: null, steps: [], edgeIds: [] });

  // On-campus routing is computed locally on the pedestrian graph (A*),
  // so it follows the real walkways and also works offline.
  const handleGetRoute = () => {
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

      const originBuilding = originBuildingId
        ? CAMPUS_BUILDING.find((item) => item.id === originBuildingId)
        : null;

      const result = campusRouter.route(
        toRouteEndpoint(originBuilding, userLocation),
        toRouteEndpoint(selectedBuilding),
        { maxDistance: MAX_SNAP_METERS }
      );

      if (!result.ok) {
        clearRoute();
        const where = result.which === "start" ? "Your starting point" : selectedBuilding.name;
        setAlertMsg({
          message:
            result.reason === "too-far"
              ? `${where} is not near a mapped campus walkway yet (${Math.round(result.snap?.distance ?? 0)} m away).`
              : result.message,
        });
        setLoader(null);
        return;
      }

      setRoute({
        coordinates: result.coordinates,
        distance: result.distance,
        duration: result.duration,
        steps: result.steps,
        edgeIds: result.edges.map((edge) => edge.id),
      });

      const snapNote =
        result.startSnap && result.startSnap.distance > 15
          ? ` Starting from the nearest walkway, ${Math.round(result.startSnap.distance)} m from you.`
          : "";
      setAlertMsg({
        success: true,
        message: `🚶 Route to ${selectedBuilding.name} found along campus walkways.${snapNote}`,
      });
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

              {/* Graph mode: pedestrian network overlay (drawn under the route) */}
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

            <button
              type="button"
              className={showGraph ? "destination-route-btn" : "get-location-btn"}
              onClick={() => setShowGraph((prev) => !prev)}
              aria-pressed={showGraph}
            ><Network size={18} style={{ marginRight: 6 }}/>{showGraph ? "Hide Graph" : "Show Graph"}</button>

            {showGraph && (
              <small style={{ display: 'block', marginTop: 6, opacity: 0.75 }}>
                Graph: {graphStats.nodeCount} nodes · {graphStats.edgeCount} edges · {graphStats.componentCount} connected component{graphStats.componentCount === 1 ? "" : "s"}
                {route.edgeIds.length > 0 && <> · route uses {route.edgeIds.join(" → ")}</>}
              </small>
            )}

            {route.coordinates && (
              <div className="route-info">
                <p><strong>Distance:</strong> {Math.round(route.distance)} meters</p>
                <p><strong>Time:</strong> {Math.max(1, Math.ceil(route.duration / 60))} minutes</p>

                {route.steps.length > 0 && (
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