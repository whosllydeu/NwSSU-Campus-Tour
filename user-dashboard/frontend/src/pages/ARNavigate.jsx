import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampusData } from '../context/CampusDataContext.jsx';

// ============================================================
// AR Navigate — walking-direction arrow overlaid on the camera
// feed, pointing toward a building's real-world GPS coordinate.
//
// Validated standalone as a prototype (camera bg + compass-relative
// arrow + haversine distance) before being wired into this app.
// Needs `lat` / `lng` fields added to each entry in data.js — see
// the empty-state below for the exact shape expected.
// ============================================================

function toRad(d) { return (d * Math.PI) / 180; }
function toDeg(r) { return (r * 180) / Math.PI; }

// Bearing from point A to point B, in degrees (0 = north, clockwise).
function bearingTo(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Haversine distance in meters.
function distanceTo(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ARNavigate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildings } = useCampusData();
  const building = buildings.find((b) => b.id === id);

  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [heading, setHeading] = useState(null);
  const [pos, setPos] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const target = building?.lat != null && building?.lng != null
    ? { lat: building.lat, lng: building.lng }
    : null;

  const bearing = target && pos ? bearingTo(pos.lat, pos.lng, target.lat, target.lng) : null;
  const distance = target && pos ? distanceTo(pos.lat, pos.lng, target.lat, target.lng) : null;
  const rotation = bearing != null && heading != null
    ? ((bearing - heading + 540) % 360) - 180
    : 0;

  const handleOrientation = useCallback((e) => {
    if (typeof e.webkitCompassHeading === 'number') {
      setHeading(e.webkitCompassHeading);
    } else if (e.absolute && e.alpha !== null) {
      setHeading((360 - e.alpha) % 360);
    }
  }, []);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Camera error: ' + err.message);
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setError('Compass permission denied.');
        }
      } catch (err) {
        setError('Compass permission error: ' + err.message);
      }
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device.');
    } else {
      navigator.geolocation.watchPosition(
        (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (err) => setError('Location error: ' + err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }

    setStarted(true);
  }, [handleOrientation]);

  // Clean up camera stream + listeners on unmount.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    };
  }, [handleOrientation]);

  if (!building) {
    return (
      <div style={styles.emptyScreen}>
        <p>Building not found.</p>
        <button style={styles.backBtn} onClick={() => navigate('/buildings')}>← Back</button>
      </div>
    );
  }

  // No coordinates set yet for this building — friendly placeholder
  // instead of a broken AR view. Remove this block once data.js has
  // lat/lng for every entry.
  if (!target) {
    return (
      <div style={styles.emptyScreen}>
        <h2 style={{ margin: '0 0 8px' }}>📍 {building.name}</h2>
        <p style={{ color: '#aaa', maxWidth: 340, textAlign: 'center' }}>
          AR walking directions aren't set up for this building yet.
          Add <code>lat</code> and <code>lng</code> fields to its entry in{' '}
          <code>data.js</code>, e.g.:
        </p>
        <pre style={styles.codeBlock}>{`{
          id: '${building.id}',
          ...
          lat: 12.066055,
          lng: 124.584651,
        }`}</pre>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      {!started ? (
        <div style={styles.startScreen}>
          <h2 style={{ margin: 0 }}>Walk to {building.name}</h2>
          <p style={{ color: '#bbb', maxWidth: 320, textAlign: 'center' }}>
            This will ask for camera, location, and motion permission.
            Hold your phone upright, like you're taking a photo.
          </p>
          <button style={styles.startBtn} onClick={start}>Start AR</button>
          <button style={styles.linkBtn} onClick={() => navigate(-1)}>Cancel</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />

          <div style={styles.overlay}>
            <svg
              viewBox="0 0 100 100"
              style={{ width: 90, height: 90, transform: `rotate(${rotation}deg)`, transition: 'transform 0.15s ease-out' }}
            >
              <polygon points="50,8 78,60 50,46 22,60" fill="#2dd4bf" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
              <rect x="45" y="46" width="10" height="34" fill="#2dd4bf" stroke="#fff" strokeWidth="3" />
            </svg>
          </div>

          <button style={styles.closeBtn} onClick={() => navigate(-1)}>✕</button>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <div style={styles.hud}>
            <div><strong>{building.name}</strong></div>
            <div>Distance: <span style={styles.hudVal}>{distance != null ? distance.toFixed(1) : '--'}</span> m</div>
            <div>Bearing: <span style={styles.hudVal}>{bearing != null ? bearing.toFixed(0) : '--'}</span>°</div>
            <div>Heading: <span style={styles.hudVal}>{heading != null ? heading.toFixed(0) : '--'}</span>°</div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', inset: 0, background: '#000', zIndex: 1000 },
  video: { position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  overlay: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  hud: {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.55)', color: '#fff',
    padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
    fontSize: 14, lineHeight: 1.6,
  },
  hudVal: { color: '#7fd', fontWeight: 600 },
  closeBtn: {
    position: 'fixed', top: 'calc(12px + env(safe-area-inset-top))', right: 12, zIndex: 2,
    width: 36, height: 36, borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 18, cursor: 'pointer',
  },
  errorBanner: {
    position: 'fixed', top: 'calc(12px + env(safe-area-inset-top))', left: 12, right: 60, zIndex: 2,
    background: '#b91c1c', color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13,
  },
  startScreen: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, color: '#fff',
  },
  startBtn: {
    padding: '14px 28px', fontSize: 16, fontWeight: 600, border: 'none',
    borderRadius: 10, background: '#2dd4bf', color: '#000', cursor: 'pointer',
  },
  linkBtn: { background: 'none', border: 'none', color: '#999', fontSize: 14, cursor: 'pointer' },
  emptyScreen: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
    background: '#111', color: '#fff', zIndex: 1000,
  },
  codeBlock: {
    background: '#000', color: '#7fd', padding: 12, borderRadius: 8,
    fontSize: 12, textAlign: 'left', overflowX: 'auto',
  },
  backBtn: {
    marginTop: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid #444',
    background: 'transparent', color: '#fff', cursor: 'pointer',
  },
};