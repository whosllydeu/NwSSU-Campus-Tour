import { useMemo } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCampusData } from "../context/DataContext";
import { SATELLITE_URL } from "../utils/map-leaflet";
import "../stylesheets/campus-mini-map.css";

const NWSSU_CENTER = [12.0712, 124.5965];

const labelIcon = (abbr, color) =>
  L.divIcon({
    className: "cmm-label-wrap",
    html: `<span class="cmm-label" style="background:${color || "#1f4d2e"}">${abbr}</span>`,
    iconSize: null,
  });

export default function CampusMiniMap({ onOpen }) {
  const { buildings } = useCampusData();

  const points = useMemo(
    () =>
      (buildings || [])
        .map((b) => ({ ...b, lat: Number(b.lat), lng: Number(b.lng) }))
        .filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng) && b.abbr),
    [buildings]
  );

  const bounds = useMemo(
    () => (points.length > 1 ? L.latLngBounds(points.map((b) => [b.lat, b.lng])).pad(0.08) : null),
    [points]
  );

  return (
    <div
      className="cmm"
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => onOpen && (e.key === "Enter" || e.key === " ") && onOpen()}
    >
      <MapContainer
        key={bounds ? "fit" : "center"}
        {...(bounds ? { bounds } : { center: NWSSU_CENTER, zoom: 17 })}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className="cmm-map"
      >
        <TileLayer url={SATELLITE_URL} maxNativeZoom={18} maxZoom={21} />
        {points.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={labelIcon(b.abbr, b.color)} interactive={false} />
        ))}
      </MapContainer>
      <span className="cmm-credit">Imagery © Esri</span>
      {onOpen && <span className="cmm-link">View all buildings →</span>}
    </div>
  );
}