import { useMemo, useCallback } from 'react';
import {
  LayersControl,
  MapContainer,
  Marker,
  TileLayer,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/admin-map.css';
import {
  TILELAYER_URL,
  TILELAYER_ATTRIBUTION,
  SATELLITE_URL,
  SATELLITE_ATTRIBUTION,
} from '../../user-dashboard/utils/map-leaflet';
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

const DEFAULT_POSITION = [12.07113, 124.59621];

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  helpText = 'Click anywhere on the map to select the building location. You can also drag the marker to fine-tune the position.',
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
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer url={SATELLITE_URL} attribution={SATELLITE_ATTRIBUTION} maxNativeZoom={18} maxZoom={21} />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Map">
              <TileLayer url={TILELAYER_URL} attribution={TILELAYER_ATTRIBUTION} maxNativeZoom={19} maxZoom={21} />
            </LayersControl.BaseLayer>
          </LayersControl>

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
        {helpText}
      </p>
    </div>
  );
}