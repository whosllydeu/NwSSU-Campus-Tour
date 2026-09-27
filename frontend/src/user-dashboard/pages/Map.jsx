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
  transformedObjectBuilding
} from "../utils/map-leaflet";
import { Globe, LocateFixed, Road } from "lucide-react";
import { Navbar } from "../components";
import { useCampusData } from "../context/DataContext";
import { hasTour } from "../static/nwssuTour";
import { useUI } from "../context/UIContext";
import BuildingInfoModal from "../components/BuildingInfoModal";

export default function Map() {
  const { buildings } = useCampusData();
  const { openTour, openUnavailable } = useUI();
  const CAMPUS_BUILDING = transformedObjectBuilding(buildings);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalBuilding, setModalBuilding] = useState(null);
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
          const { building } = findBuildingAtLocation(location, CAMPUS_BUILDING);
          setUserLocation(location);
          setAlertMsg({
            success: true,
            message: `
              📍Location Detected: ${building 
                ? `You are at ${building.name}.`  
                : "But you are not currently inside or near a recognized campus building."
              }
            `
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
    /*
     campusBuildings above is mock data keyed by abbr only; look up the
     matching real building record (from useCampusData) to get its real 
     id, since that's what the tour data (nwssuTour.js) is keyed by.
    */
    const match = buildings.find((b) => b.id === building.id);

    if (match && hasTour(match.id)) {
      openTour(match.id);
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
                        selectedBuilding?.id === building.id
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
            ><Globe size={18} style={{ marginRight: 6 }}/>Open 360 Tour</button>

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