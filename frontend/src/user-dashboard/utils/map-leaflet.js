import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { campusRouter } from "../../utils/campusRouting";

// On-campus routing runs locally on the campus walkway graph
// (src/data/campusGraph.json) using A* — no external routing service,
// so routes stay on the real walkways and also work offline.

// How far (metres) a point may be from a walkway and still be snapped onto it.
export const MAX_SNAP_METERS = 60;

export const TILELAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TILELAYER_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Non-building pathway endpoints (e.g. the campus Gate) — not real
// buildings in data.js, but still need to be detectable by GPS and
// selectable as a route origin/destination, since several outdoor
// pathway tours start or end there instead of at an actual building.
//
// TODO: replace the placeholder position below with the real gate
// coordinates. Easiest way to get them: stand at the gate, go to the
// Map page, tap "My Location" — since Gate isn't registered yet, the
// alert will show your raw coordinates instead of a building name.
// Copy those numbers in here.
export const VIRTUAL_LOCATIONS = [
  {
    id: 'gate',
    abbr: 'GATE',
    name: 'Main Gate',
    position: [12.070884, 124.596793], // TODO: replace with real gate coordinates
    detectionRadius: 30,
    entranceNodeId: 'GATE-CEA:1', // first point of the GATE-CEA walkway
  },
];

// Transformed object building list from database
export const transformedObjectBuilding = (buildings) => {
  const campBuildings = buildings.map((b) => ({
    id: b.id,
    abbr: b.abbr,
    name: b.name,
    position: [b.lat, b.lng],
    entranceNodeId: b.entranceNodeId ?? null,
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

/**
 * Walking route along the campus walkways.
 * `start` / `destination` can be [lat, lng] (snapped onto the nearest
 * walkway) or { entranceNodeId } (routes from/to that graph node).
 * Resolves to { coordinates, distance (m), duration (s), steps, edges, ... }.
 * Throws an Error with a readable message when no route is possible.
 */
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