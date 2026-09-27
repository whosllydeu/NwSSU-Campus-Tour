import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";

// FOR FORM MODAL
export function toEditableValue(field, raw) {
  if (field.type === 'list') {
    return Array.isArray(raw) ? raw.join('\n') : '';
  }

  return raw ?? '';
}

export function fromEditableValue(field, raw) {
  if (field.type === 'list') {
    return String(raw)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (field.type === 'number') {
    return raw === '' ? '' : Number(raw);
  }

  return raw;
}

// FOR LOCATION PICKER
export function isValidCoordinate(value) {
  if (value === '' || value === null || value === undefined) {
    return false;
  }
  return Number.isFinite(Number(value));
}

// Handles clicking anywhere on the map.
export function MapClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export function MapCenter({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
}