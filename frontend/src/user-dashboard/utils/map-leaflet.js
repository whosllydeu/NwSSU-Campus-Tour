import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// OSRM walking routing service api
const OSRM_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";

export const TILELAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TILELAYER_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

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

export const allLocationIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [23, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "all-location-marker",
});