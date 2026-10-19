import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILELAYER_URL } from '../utils/map-leaflet';
import { NODE_BY_ID, findPath, getWalkCorridor } from '../static/nwssuTour';
import { splitRoute } from '../utils/liveTracking';
import '../stylesheets/tour-mini-map.css';

const flagIcon = L.divIcon({
  className: 'tmm-flag-wrap',
  html: '<span class="tmm-flag">🏁</span>',
  iconSize: [24, 24],
  iconAnchor: [6, 22],
});

// GPS is used to cut the line only when the user is really on the route (not browsing from home).
const GPS_ON_ROUTE_M = 40;
const NEAR_M = 40;
const ARRIVED_M = 12;

const flagNearIcon = L.divIcon({
  className: 'tmm-flag-wrap',
  html: '<span class="tmm-flag is-near">🏁</span>',
  iconSize: [24, 24],
  iconAnchor: [6, 22],
});

const photoIcon = L.divIcon({
  className: 'tmm-photo-wrap',
  html: '<span class="tmm-photo"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const gpsOf = (id) => {
  const g = NODE_BY_ID[id]?.data?.gps;
  return Array.isArray(g) ? g : null;
};

/** Small map: no dragging (a tap opens it). Big map: free to drag and zoom. Keeps following the user. */
function MapController({ expanded, center }) {
  const map = useMap();

  useEffect(() => {
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom, map.boxZoom, map.keyboard];
    handlers.forEach((h) => (expanded ? h?.enable() : h?.disable()));
    const t = setTimeout(() => {
      map.invalidateSize();
      if (center) map.setView(center, expanded ? 18 : 17, { animate: false });
    }, 260);
    return () => clearTimeout(t);
  }, [expanded, map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (center) map.panTo(center, { animate: true });
  }, [center, map]);

  return null;
}

export default function TourMiniMap({ nodeId, destinationId }) {
  const [expanded, setExpanded] = useState(false);
  const [gps, setGps] = useState(null);
  const [lastPhotoPos, setLastPhotoPos] = useState(() => gpsOf(nodeId));

  // Live GPS position (only shown if the browser already allows location).
  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (p) => setGps({ pos: [p.coords.latitude, p.coords.longitude], acc: p.coords.accuracy }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Where the current 360° photo was taken (keeps the last known one if this photo has no GPS).
  const nodeGps = gpsOf(nodeId);
  if (nodeGps && nodeGps !== lastPhotoPos) setLastPhotoPos(nodeGps);
  const photoPos = nodeGps || lastPhotoPos;

  // Route line: the map route used for "Walk there!", or else the remaining 360° photos.
  const route = useMemo(() => {
    const corridor = getWalkCorridor();
    if (corridor) return corridor;
    if (!nodeId || !destinationId) return null;
    const path = findPath(nodeId, destinationId) || [];
    const pts = path.map((n) => gpsOf(typeof n === 'string' ? n : n?.id)).filter(Boolean);
    return pts.length > 1 ? pts : null;
  }, [nodeId, destinationId]);

  const destPos = useMemo(() => {
    const g = gpsOf(destinationId);
    if (g) return g;
    return route ? route[route.length - 1] : null;
  }, [destinationId, route]);

  // Cut the line where the user is: GPS when on the route, otherwise the current 360° photo.
  const split = useMemo(() => {
    if (!route) return null;
    const byGps = gps ? splitRoute(route, gps.pos) : null;
    if (byGps && byGps.offRoute <= GPS_ON_ROUTE_M) return byGps;
    return photoPos ? splitRoute(route, photoPos) : null;
  }, [route, gps, photoPos]);

  const left = split ? Math.round(split.remaining) : null;
  const status = left === null ? null : left <= ARRIVED_M ? 'arrived' : left <= NEAR_M ? 'near' : 'far';

  const center = gps?.pos || photoPos || destPos;
  if (!center) return null;

  return (
    <>
      {expanded && <div className="tmm-backdrop" onClick={() => setExpanded(false)} />}
      <div
        className={`tmm${expanded ? ' is-expanded' : ''}`}
        onClick={expanded ? undefined : () => setExpanded(true)}
        role={expanded ? undefined : 'button'}
        aria-label={expanded ? undefined : 'Open map'}
        tabIndex={expanded ? undefined : 0}
        onKeyDown={(e) => !expanded && (e.key === 'Enter' || e.key === ' ') && setExpanded(true)}
      >
        <MapContainer
          center={center}
          zoom={17}
          zoomControl={false}
          attributionControl={false}
          className="tmm-map"
        >
          <TileLayer url={TILELAYER_URL} maxNativeZoom={19} maxZoom={21} />
          <MapController expanded={expanded} center={center} />

          {split ? (
            <>
              {/* Already walked: faded and dashed */}
              <Polyline positions={split.walked} interactive={false}
                pathOptions={{ color: '#6b7280', weight: 4, opacity: 0.55, dashArray: '4 6' }} />
              {/* Still to walk: gets shorter as the user moves */}
              <Polyline positions={split.ahead} interactive={false}
                pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.95 }} />
              <Polyline positions={split.ahead} interactive={false}
                pathOptions={{ color: status === 'far' ? '#2563eb' : '#16a34a', weight: 5, opacity: 0.95 }} />
            </>
          ) : route && (
            <>
              <Polyline positions={route} interactive={false} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
              <Polyline positions={route} interactive={false} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.9 }} />
            </>
          )}

          {destPos && <Marker position={destPos} icon={status && status !== 'far' ? flagNearIcon : flagIcon} interactive={false} />}

          {photoPos && <Marker position={photoPos} icon={photoIcon} interactive={false} />}

          {gps && (
            <>
              <Circle center={gps.pos} radius={gps.acc} interactive={false}
                pathOptions={{ color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: 0.12 }} />
              <CircleMarker center={gps.pos} radius={7} interactive={false}
                pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1 }} />
            </>
          )}
        </MapContainer>

        {status && (
          <div className={`tmm-badge is-${status}`}>
            {status === 'arrived'
              ? "🎉 You've arrived!"
              : status === 'near'
                ? `Almost there · ${left} m`
                : `${left >= 1000 ? `${(left / 1000).toFixed(1)} km` : `${left} m`} left`}
          </div>
        )}

        {expanded ? (
          <>
            <button type="button" className="tmm-close" onClick={() => setExpanded(false)} aria-label="Make map small">
              −
            </button>
            <div className="tmm-legend">
              <span><i className="tmm-dot is-gps" /> You (GPS)</span>
              <span><i className="tmm-dot is-photo" /> This 360° view</span>
              <span>🏁 Destination</span>
            </div>
          </>
        ) : (
          <span className="tmm-hint">Tap to enlarge</span>
        )}
      </div>
    </>
  );
}