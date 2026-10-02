import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// OSRM walking routing service api
const OSRM_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";

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
    position: [12.070724, 124.596791], // TODO: replace with real gate coordinates
    detectionRadius: 30,
  },
];

// Transformed object building list from database
export const transformedObjectBuilding = (buildings) => {
  const campBuildings = buildings.map((b) => ({
    id: b.id,
    abbr: b.abbr,
    name: b.name,
    position: [b.lat, b.lng]
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

const getDistanceInMeters = ([lat1, long1], [lat2, long2]) => {
  const EARTH_RADIUS = 6371000;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLong = toRadians(long2 - long1);

  const distanceRatio = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLong / 2) ** 2;
  const distanceAngle = 2 * Math.atan2(Math.sqrt(distanceRatio), Math.sqrt(1 - distanceRatio));
  return EARTH_RADIUS * distanceAngle;
}

export const getWalkingRoute = async (start, destination) => {
  const [startLat, startLng] = start;
  const [destinationLat, destinationLng] = destination;

  const coordinates =
  	`${startLng},${startLat};` +
  	`${destinationLng},${destinationLat}`
  ;

  const url =
  	`${OSRM_URL}/${coordinates}` +
  	`?overview=full` +
  	`&geometries=geojson` +
  	`&steps=true`
  ;

  const response = await fetch(url);

  if (!response.ok) {
  	throw new Error(
  	  `Routing server returned HTTP ${response.status}`
  	);
  }

  const data = await response.json();

  if (data.code !== "Ok") {
  	throw new Error(
  	  data.message ||
  	  "OSRM could not calculate a walking route."
  	);
  }

  if (!data.routes || data.routes.length === 0) {
  	throw new Error("No walking route was found.");
  }

  const route = data.routes[0];
  const routeCoordinates = route.geometry.coordinates.map(
  	([lng, lat]) => [lat, lng]
  );

  return {
  	coordinates: routeCoordinates,
  	distance: route.distance,
  	duration: route.duration,
  	steps: route.legs?.[0]?.steps || [],
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

