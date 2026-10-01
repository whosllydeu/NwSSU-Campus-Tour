import { useMemo, useCallback } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/admin-map.css';
import { TILELAYER_URL } from '../../user-dashboard/utils/map-leaflet';
import { isValidCoordinate, MapCenter, MapClickHandler } from '../utils/admin-map-leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    'leaflet/dist/images/marker-icon-2x.png',
    import.meta.url
  ).href,
  iconUrl: new URL(
    'leaflet/dist/images/marker-icon.png',
    import.meta.url
  ).href,
  shadowUrl: new URL(
    'leaflet/dist/images/marker-shadow.png',
    import.meta.url
  ).href,
});

// Default campus center
const DEFAULT_POSITION = [12.07113, 124.59621];

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}) {
  const hasCoordinates = isValidCoordinate(latitude) && isValidCoordinate(longitude);

  const position = useMemo(() => {
    return hasCoordinates
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_POSITION
    ;
  }, [hasCoordinates, latitude, longitude]);

  const [lat, lng] = position;

  const handleDragEnd = useCallback(
    (event) => {
      const latLng = event.target.getLatLng();
      onChange({ lat: latLng.lat, lng: latLng.lng });
    },
    [onChange]
  );

  return (
    <div className="ad-location-picker">
      <div className="ad-location-map">
        <MapContainer
          center={position}
          zoom={17}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url={TILELAYER_URL}
          />

          <MapCenter lat={lat} lng={lng} />

          <MapClickHandler onChange={onChange} />

          {hasCoordinates && (
            <Marker
              position={position}
              draggable={true}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>
      </div>

      <div className="ad-location-coordinates">
        <div>
          <span>Latitude</span>
          <strong>
            {hasCoordinates
              ? Number(latitude).toFixed(7)
              : 'Not selected'}
          </strong>
        </div>

        <div>
          <span>Longitude</span>
          <strong>
            {hasCoordinates
              ? Number(longitude).toFixed(7)
              : 'Not selected'}
          </strong>
        </div>
      </div>

      <p className="ad-location-help">
        Click anywhere on the map to select the building location.
        You can also drag the marker to fine-tune the position.
      </p>
    </div>
  );
}