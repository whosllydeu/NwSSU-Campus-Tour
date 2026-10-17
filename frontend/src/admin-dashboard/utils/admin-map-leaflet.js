import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";

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

export function isValidCoordinate(value) {
  if (value === '' || value === null || value === undefined) {
    return false;
  }
  return Number.isFinite(Number(value));
}

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