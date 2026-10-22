import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { campusRouter } from "../../utils/campusRouting";

export const MAX_SNAP_METERS = 60;

export const TILELAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TILELAYER_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION =
  'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';

export const VIRTUAL_LOCATIONS = [
  {
    id: 'gate',
    abbr: 'GATE',
    name: 'Main Gate',
    position: [12.070884, 124.596793],
    detectionRadius: 30,
    entranceNodeId: 'GATE-CEA:1',
  },
];

/**
 * Where a walking route should END for a building (a walkway node in campusGraph.json).
 * Without this, the route stops at the walkway point nearest the building's map pin,
 * which can be the wrong side of the building.
 * Keys are building ids or abbreviations.
 */
export const BUILDING_ENTRANCES = {
  library: 'LIB-REG:LIBRARY',   // University Library door (end of the real walkway)
  LIB: 'LIB-REG:LIBRARY',
};

const entranceFor = (b) =>
  b.entranceNodeId ?? BUILDING_ENTRANCES[b.id] ?? BUILDING_ENTRANCES[String(b.abbr || '').toUpperCase()] ?? null;

export const transformedObjectBuilding = (buildings) => {
  const campBuildings = buildings.map((b) => ({
    id: b.id,
    abbr: b.abbr,
    name: b.name,
    position: [b.lat, b.lng],
    entranceNodeId: entranceFor(b),
  }));
  return campBuildings;
}

export const findBuildingAtLocation = (location, campusBuilding) => {
  let detectedBuilding = null;
  let shortestDistance = Infinity;

  for (const building of campusBuilding) {
    const distance = getDistanceInMeters(location, building.position);
    const radius = building.detectionRadius ?? 35;

    if (distance <= radius && distance < shortestDistance) {
      detectedBuilding = building;
      shortestDistance = distance;
    }

  }

  return {
    building: detectedBuilding,
    distance: detectedBuilding !== null ? shortestDistance : null
  };
}

export const findNearestPanorama = (userLocation, nodes) => {
  if (!userLocation || !nodes?.length) {
    return null;
  }

  let nearest = null;

  for (const node of nodes) {
    if (!node.gps) {
      continue;
    }

    const distance = getDistanceInMeters(
      userLocation,
      node.gps
    );

    if (!nearest || distance < nearest.distance) {
      nearest = {
        node,
        distance,
      };
    }
  }

  return nearest;
};

const getDistanceInMeters = ([lat1, long1], [lat2, long2]) => {
  const EARTH_RADIUS = 6371000;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLong = toRadians(long2 - long1);

  const distanceRatio = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLong / 2) ** 2;
  const distanceAngle = 2 * Math.atan2(Math.sqrt(distanceRatio), Math.sqrt(1 - distanceRatio));
  return EARTH_RADIUS * distanceAngle;
}

export const getWalkingRoute = async (start, destination, options = {}) => {
  const result = campusRouter.route(start, destination, {
    maxDistance: options.maxDistance ?? MAX_SNAP_METERS,
  });

  if (!result.ok) {
    const where = result.which === "start" ? "Your starting point" : "The destination";
    const message =
      result.reason === "too-far"
        ? `${where} is ${Math.round(result.snap?.distance ?? 0)} m from the nearest mapped campus walkway.`
        : result.message;
    const error = new Error(message);
    error.reason = result.reason;
    error.which = result.which;
    throw error;
  }

  return {
    coordinates: result.coordinates,
    distance: result.distance,
    duration: result.duration,
    steps: result.steps,
    edges: result.edges,
    startSnap: result.startSnap,
    endSnap: result.endSnap,
  };
}

export const RouteFitter = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    if (!route || route.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }, [route, map]);

  return null;
}

export const userLocationIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 42],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "user-location-marker",
});

export const selectedLocationIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [23, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "selected-location-marker",
});

export const allLocationIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [23, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "all-location-marker",
});