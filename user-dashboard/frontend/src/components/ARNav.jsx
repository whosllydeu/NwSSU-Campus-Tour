// ============================================================
// ARNav — live-camera AR navigation.
// Start point = your live GPS (automatic). Destination = the
// place the user tapped. If that place has no saved coordinate
// yet, walk there once and tap "Save My Location Here" — no
// Google Maps needed. Saved on-device (localStorage); use the
// Information panel's Export to copy them into arDestinations.js.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { resolveCoord, saveCoord, exportSavedText } from '../data/arDestinations.js';

const NEAR = 18;    // metres: show the pin instead of arrows
const ARRIVE = 8;   // metres: "you have arrived"

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
function distanceM(a, b) {
  const R = 6371000, dφ = toRad(b.lat - a.lat), dλ = toRad(b.lng - a.lng);
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearingDeg(a, b) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat), dλ = toRad(b.lng - a.lng);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
const angleLerp = (a, b, t) => { const d = ((b - a + 540) % 360) - 180; return a + d * t; };

export default function ARNav() {
  const { arTarget, closeAR } = useUI();
  const videoRef = useRef(null);
  const S = useRef({ cur: null, heading: null, smooth: null, raf: 0, stream: null, dest: null });
  const [started, setStarted] = useState(false);
  const [err, setErr] = useState('');
  const [rot, setRot] = useState(0);
  const [dist, setDist] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [hasDest, setHasDest] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exportTxt, setExportTxt] = useState('');
  const [uxy, setUxy] = useState(null);

  useEffect(() => {
    if (arTarget) { const d = resolveCoord(arTarget.key); S.current.dest = d; setHasDest(Boolean(d)); }
    return () => {
      cancelAnimationFrame(S.current.raf);
      if (S.current.stream) S.current.stream.getTracks().forEach((t) => t.stop());
      S.current = { cur: null, heading: null, smooth: null, raf: 0, stream: null, dest: null };
    };
  }, [arTarget]);

  if (!arTarget) return null;
  const destName = arTarget.name || 'Destination';

  const start = async () => {
    setErr('');
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') setErr('Motion access denied — allow "Motion & Orientation" for the arrow to work.');
      }
    } catch { /* older devices */ }
    const onOrient = (ev) => {
      let h = null;
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) h = ev.webkitCompassHeading;
      else if (ev.alpha != null) h = (360 - ev.alpha) % 360;
      if (h != null) S.current.heading = h;
    };
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      S.current.stream = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) { setErr('Camera blocked. Allow camera and open over https. (' + e.name + ')'); }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (p) => { S.current.cur = { lat: p.coords.latitude, lng: p.coords.longitude }; },
        (e) => setErr('Location error: ' + e.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    } else setErr('No Geolocation on this device.');

    setStarted(true);
    const loop = () => {
      S.current.raf = requestAnimationFrame(loop);
      const st = S.current;
      if (st.heading != null) st.smooth = st.smooth == null ? st.heading : angleLerp(st.smooth, st.heading, 0.15);
      if (!st.cur) return;
      setUxy(st.cur);
      if (!st.dest) return;                 // no destination saved yet → capture mode
      const d = distanceM(st.cur, st.dest);
      setDist(d);
      setShowPin(d <= NEAR);
      setArrived(d <= ARRIVE);
      if (d > NEAR && st.smooth != null) setRot((bearingDeg(st.cur, st.dest) - st.smooth + 360) % 360);
    };
    loop();
  };

  const saveHere = () => {
    if (!S.current.cur) { setErr('Waiting for GPS — try again in a few seconds.'); return; }
    setErr('');
    const { lat, lng } = S.current.cur;
    saveCoord(arTarget.key, lat, lng);
    S.current.dest = { lat, lng, name: destName };
    setHasDest(true);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const copyExport = async () => {
    const txt = exportSavedText();
    setExportTxt(txt);
    try { await navigator.clipboard.writeText(txt); } catch { /* fall back to manual copy */ }
  };

  const distTxt = dist == null ? '—' : dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(2) + ' km';

  // minimap points (user + destination)
  const mm = (() => {
    const pts = [];
    if (S.current.dest) pts.push({ lat: S.current.dest.lat, lng: S.current.dest.lng, kind: 'dest' });
    if (uxy) pts.push({ lat: uxy.lat, lng: uxy.lng, kind: 'user' });
    if (!pts.length) return null;
    const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 0.0003; minLat -= pad; maxLat += pad; minLng -= pad; maxLng += pad;
    return pts.map((p) => ({
      x: ((p.lng - minLng) / Math.max(1e-9, maxLng - minLng)) * 100,
      y: (1 - (p.lat - minLat) / Math.max(1e-9, maxLat - minLat)) * 100,
      kind: p.kind,
    }));
  })();

  return (
    <div className="arnav-root">
      <style>{CSS}</style>
      <video ref={videoRef} className="arnav-cam" autoPlay muted playsInline />

      <span className="arnav-bracket tl" /><span className="arnav-bracket tr" />
      <span className="arnav-bracket bl" /><span className="arnav-bracket br" />

      {!started ? (
        <div className="arnav-start">
          <span className="arnav-badge">AR Walking Navigation</span>
          <h1>Walk to {destName}</h1>
          <p>Tap Start and allow <b>Camera</b>, <b>Motion</b>, and <b>Location</b>. Your starting point is set from your GPS automatically.</p>
          <button className="arnav-go" onClick={start}>Start</button>
          <p className="arnav-hint">iPhone Safari / Android Chrome · over https</p>
          {err && <div className="arnav-err">{err}</div>}
        </div>
      ) : (
        <>
          <div className="arnav-top">
            <div className="arnav-dest">{destName}</div>
            <div className="arnav-sub">{!hasDest ? 'Set this location' : arrived ? 'You have arrived' : distTxt}</div>
          </div>

          {mm && mapOpen && (
            <div className="arnav-map">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                {mm.length === 2 && <line x1={mm[0].x} y1={mm[0].y} x2={mm[1].x} y2={mm[1].y} stroke="#2b6cb0" strokeWidth="3" />}
                {mm.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={p.kind === 'dest' ? 5.5 : 4.5}
                    fill={p.kind === 'dest' ? '#e23b2e' : '#fff'} stroke={p.kind === 'user' ? '#2b6cb0' : 'none'} strokeWidth="2" />
                ))}
              </svg>
            </div>
          )}

          {/* CAPTURE MODE — no saved destination yet */}
          {!hasDest ? (
            <div className="arnav-capture">
              <div className="arnav-capture-card">
                <div className="arnav-capture-emoji">📍</div>
                <h3>{destName} has no saved spot yet</h3>
                <p>Walk to <b>{destName}</b>, stand at its entrance, then tap below. Your current GPS becomes this place's destination.</p>
                <button className="arnav-savebtn" onClick={saveHere}>📍 Save My Location Here</button>
                {savedMsg && <div className="arnav-saved">✓ Saved! This place is now navigable.</div>}
                {err && <div className="arnav-err">{err}</div>}
              </div>
            </div>
          ) : (
            <>
              {!showPin ? (
                <div className="arnav-arrows" style={{ transform: `translateX(-50%) perspective(420px) rotateX(52deg) rotate(${rot}deg)` }}>
                  {[0, 1, 2].map((i) => (
                    <svg key={i} className="arnav-chev" viewBox="0 0 120 70" style={{ opacity: 1 - i * 0.28 }}>
                      <path d="M12 60 L60 20 L108 60 L86 60 L60 40 L34 60 Z" />
                    </svg>
                  ))}
                </div>
              ) : (
                <div className="arnav-pin">
                  <svg viewBox="0 0 100 100">
                    <path d="M50 6 C30 6 16 22 16 42 C16 68 50 94 50 94 C50 94 84 68 84 42 C84 22 70 6 50 6 Z" />
                    <circle cx="50" cy="40" r="13" fill="#fff" />
                  </svg>
                </div>
              )}
              {arrived && <button className="arnav-pinbtn">📍 Pin Location</button>}
            </>
          )}

          {/* info panel: re-save + export */}
          {infoOpen && (
            <div className="arnav-info">
              <button className="arnav-info-x" onClick={() => setInfoOpen(false)}>×</button>
              <h3>{destName}</h3>
              <p>Start point uses your live GPS. Save each place's spot once by standing there and tapping the button below.</p>
              <button className="arnav-info-btn" onClick={saveHere}>📍 Save / update this spot (I'm here now)</button>
              <button className="arnav-info-btn ghost" onClick={copyExport}>⧉ Copy all saved coordinates</button>
              {exportTxt && (
                <>
                  <p className="arnav-info-note">Paste these into <code>arDestinations.js</code> so every phone has them:</p>
                  <textarea className="arnav-export" readOnly value={exportTxt} onFocus={(e) => e.target.select()} />
                </>
              )}
            </div>
          )}

          <div className="arnav-bar">
            <button className="arnav-bbtn exit" onClick={closeAR}><span>«</span>Exit</button>
            <button className="arnav-bbtn map" onClick={() => setMapOpen((v) => !v)}><span>▥</span>Map</button>
            <button className="arnav-bbtn info" onClick={() => setInfoOpen((v) => !v)}><span>ⓘ</span>Information</button>
          </div>

          {err && !infoOpen && hasDest && <div className="arnav-err bottom">{err}</div>}
        </>
      )}
    </div>
  );
}

const CSS = `
.arnav-root{position:fixed;inset:0;z-index:2000;background:#000;font-family:'Sora',system-ui,sans-serif;color:#fff;overflow:hidden;}
.arnav-cam{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#111;}
.arnav-bracket{position:absolute;width:34px;height:34px;border:3px solid #37f59b;opacity:.9;z-index:6;}
.arnav-bracket.tl{top:74px;left:16px;border-right:none;border-bottom:none;}
.arnav-bracket.tr{top:74px;right:16px;border-left:none;border-bottom:none;}
.arnav-bracket.bl{bottom:96px;left:16px;border-right:none;border-top:none;}
.arnav-bracket.br{bottom:96px;right:16px;border-left:none;border-top:none;}
.arnav-start{position:absolute;inset:0;z-index:20;background:radial-gradient(120% 90% at 50% 0%,#0c2a1c,#050810 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;text-align:center;}
.arnav-start h1{font-size:24px;font-weight:800;}
.arnav-start p{font-size:14px;color:#9fb0c8;max-width:320px;line-height:1.6;}
.arnav-badge{display:inline-block;padding:5px 12px;border-radius:20px;background:rgba(18,183,106,.16);color:#12b76a;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;}
.arnav-go{border:none;background:#12b76a;color:#04160d;font-weight:800;font-size:17px;padding:15px 40px;border-radius:40px;cursor:pointer;box-shadow:0 12px 34px -8px rgba(18,183,106,.6);}
.arnav-hint{font-size:11px;color:#8aa0bd;}
.arnav-top{position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:8;text-align:center;background:rgba(20,26,24,.55);backdrop-filter:blur(8px);padding:10px 26px;border-radius:16px;min-width:220px;}
.arnav-dest{font-size:22px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.7);}
.arnav-sub{font-size:15px;color:#e6ffe9;font-weight:600;margin-top:2px;}
.arnav-map{position:absolute;top:150px;right:16px;z-index:8;width:132px;height:104px;border-radius:10px;overflow:hidden;border:2px solid rgba(255,255,255,.5);background:#cfe3c9;box-shadow:0 6px 18px rgba(0,0,0,.4);}
.arnav-map svg{width:100%;height:100%;display:block;}
.arnav-arrows{position:absolute;left:50%;bottom:26%;transform-origin:50% 100%;z-index:7;display:flex;flex-direction:column;align-items:center;gap:4px;}
.arnav-chev{width:120px;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45));}
.arnav-chev path{fill:#e23b2e;stroke:#fff;stroke-width:2.5;}
.arnav-pin{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:92px;z-index:7;animation:arnavBob 1.6s ease-in-out infinite;filter:drop-shadow(0 10px 10px rgba(0,0,0,.5));}
.arnav-pin path{fill:#e23b2e;stroke:#fff;stroke-width:2;}
@keyframes arnavBob{0%,100%{transform:translate(-50%,-52%);}50%{transform:translate(-50%,-44%);}}
.arnav-pinbtn{position:absolute;left:50%;top:66%;transform:translateX(-50%);z-index:9;border:none;cursor:pointer;background:#e23b2e;color:#fff;font-weight:800;font-size:15px;padding:13px 26px;border-radius:40px;box-shadow:0 10px 26px -6px rgba(226,59,46,.7);animation:arnavPulse 1.8s ease-in-out infinite;}
@keyframes arnavPulse{0%,100%{box-shadow:0 10px 26px -6px rgba(226,59,46,.7),0 0 0 0 rgba(226,59,46,.5);}50%{box-shadow:0 10px 26px -6px rgba(226,59,46,.9),0 0 0 12px rgba(226,59,46,0);}}
.arnav-capture{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;padding:20px;}
.arnav-capture-card{background:rgba(11,18,14,.86);backdrop-filter:blur(10px);border-radius:18px;padding:24px 22px;max-width:340px;text-align:center;box-shadow:0 16px 44px rgba(0,0,0,.5);}
.arnav-capture-emoji{font-size:40px;}
.arnav-capture-card h3{margin:8px 0 6px;font-size:19px;}
.arnav-capture-card p{font-size:13.5px;color:#c7d3c9;line-height:1.55;margin-bottom:16px;}
.arnav-savebtn{border:none;cursor:pointer;background:#12b76a;color:#04160d;font-weight:800;font-size:15px;padding:14px 24px;border-radius:40px;width:100%;box-shadow:0 10px 26px -6px rgba(18,183,106,.6);}
.arnav-saved{margin-top:12px;color:#37f59b;font-weight:700;font-size:13.5px;}
.arnav-info{position:absolute;left:16px;right:16px;bottom:104px;z-index:11;background:#fff;color:#101417;border-radius:14px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.4);max-height:60vh;overflow:auto;}
.arnav-info h3{margin:0 0 6px;font-size:18px;}
.arnav-info p{margin:0 0 10px;font-size:13px;line-height:1.5;color:#3c4043;}
.arnav-info-note{margin-top:10px;}
.arnav-info-btn{display:block;width:100%;border:none;cursor:pointer;background:#12b76a;color:#04160d;font-weight:700;font-size:13.5px;padding:12px;border-radius:10px;margin-bottom:8px;font-family:inherit;}
.arnav-info-btn.ghost{background:#eef1f4;color:#1a3a6b;}
.arnav-export{width:100%;height:120px;border:1px solid #d0d4d9;border-radius:10px;padding:10px;font-family:monospace;font-size:11.5px;resize:vertical;color:#101417;background:#f7f8fa;}
.arnav-info-x{position:absolute;top:10px;right:10px;width:26px;height:26px;border:none;border-radius:8px;background:#f1f3f4;cursor:pointer;font-size:15px;}
.arnav-bar{position:absolute;left:0;right:0;bottom:0;z-index:10;display:flex;gap:10px;padding:12px 14px;padding-bottom:max(14px,env(safe-area-inset-bottom));background:rgba(6,10,8,.82);}
.arnav-bbtn{flex:1;border:none;border-radius:12px;padding:11px;cursor:pointer;color:#fff;font-weight:700;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;}
.arnav-bbtn span{font-size:17px;line-height:1;}
.arnav-bbtn.exit{background:#7a2320;}
.arnav-bbtn.map{background:#3a3f45;}
.arnav-bbtn.info{background:#2f7d33;}
.arnav-bbtn:active{transform:scale(.96);}
.arnav-err{background:#7f1d1d;color:#fff;padding:10px 12px;border-radius:10px;font-size:12.5px;margin-top:12px;}
.arnav-err.bottom{position:absolute;left:16px;right:16px;bottom:104px;z-index:12;}
`;