// ============================================================
// PanoramaTour — full-screen 360° tour, Google Street View style.
// Pure Three.js (dependency: `three`). Fixed-position chevron arrows,
// attribution chip, round controls, street-name label.
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TOURS } from '../data/nwssuTour.js';
import { useUI } from '../context/UIContext.jsx';

export default function PanoramaTour() {
  const { tour, closeTour } = useUI();
  const data = tour ? TOURS[tour] : null;

  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [menu, setMenu] = useState(false);
  const [compass, setCompass] = useState(false);   // toggle the heading readout
  const [lonReadout, setLonReadout] = useState(0);  // live camera lon, for tuning `heading`

  const nodes = data?.nodes || [];
  const base = (import.meta.env.BASE_URL || '/') + (data?.basePath || '');

  // Direction (in degrees) that "forward" faces in a given node's photo.
  // Defaults to 0 when a node has no `heading` set, so untouched nodes
  // behave exactly as before.
  const heading = (node) => node?.heading ?? 0;

  useEffect(() => {
    if (!data) return;
    const mount = mountRef.current;
    const S = stateRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 1, 1100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const geo = new THREE.SphereGeometry(500, 64, 40);
    geo.scale(-1, 1, 1);
    const sphere = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    scene.add(sphere);

    Object.assign(S, { scene, camera, renderer, sphere, cache: {}, lon: 0, lat: 0, drag: false, px: 0, py: 0, raf: 0, idx: 0 });

    let readoutTick = 0;
    const animate = () => {
      S.raf = requestAnimationFrame(animate);
      const phi = THREE.MathUtils.degToRad(90 - S.lat), th = THREE.MathUtils.degToRad(S.lon);
      camera.lookAt(500 * Math.sin(phi) * Math.cos(th), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(th));
      renderer.render(scene, camera);
      // throttle the compass readout so it doesn't re-render every frame
      readoutTick = (readoutTick + 1) % 6;
      if (readoutTick === 0) {
        let norm = Math.round(S.lon) % 360;
        if (norm < 0) norm += 360;
        setLonReadout(norm);
      }
    };
    animate();

    const dom = renderer.domElement;
    const down = (e) => { S.drag = true; S.px = e.clientX; S.py = e.clientY; dom.style.cursor = 'grabbing'; };
    const move = (e) => {
      if (!S.drag) return;
      S.lon -= (e.clientX - S.px) * 0.13; S.lat += (e.clientY - S.py) * 0.13;
      S.lat = Math.max(-85, Math.min(85, S.lat)); S.px = e.clientX; S.py = e.clientY;
    };
    const up = () => { S.drag = false; dom.style.cursor = 'grab'; };
    const wheel = (e) => { e.preventDefault(); camera.fov = Math.max(35, Math.min(90, camera.fov + e.deltaY * 0.04)); camera.updateProjectionMatrix(); };
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    dom.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('resize', resize);

    S.loadInto = (i) => new Promise((res) => {
      if (S.cache[i]) return res(S.cache[i]);
      new THREE.TextureLoader().load(base + nodes[i].file, (t) => { if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; S.cache[i] = t; res(t); });
    });

    setIdx(0); S.idx = 0; setLoading(true);
    S.lon = heading(nodes[0]); S.lat = 0;
    S.loadInto(0).then((t) => { sphere.material.map = t; sphere.material.needsUpdate = true; setLoading(false); if (nodes[1]) S.loadInto(1); });

    return () => {
      cancelAnimationFrame(S.raf);
      dom.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      dom.removeEventListener('wheel', wheel);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
      Object.values(S.cache || {}).forEach((t) => t.dispose && t.dispose());
      stateRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  const goTo = useCallback((i) => {
    const S = stateRef.current;
    if (!S.loadInto || i < 0 || i >= nodes.length) return;
    setCard(null); setMenu(false); setLoading(true);
    S.loadInto(i).then((t) => {
      S.sphere.material.map = t; S.sphere.material.needsUpdate = true;
      S.lon = heading(nodes[i]); S.lat = 0; S.idx = i; setIdx(i); setLoading(false);
      if (nodes[i + 1]) S.loadInto(i + 1);
      if (nodes[i - 1]) S.loadInto(i - 1);
    });
  }, [nodes]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goTo(stateRef.current.idx + 1);
      else if (e.key === 'ArrowLeft') goTo(stateRef.current.idx - 1);
      else if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, goTo, closeTour]);

  const toggleFull = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!data) return null;
  const n = nodes[idx] || {};

  return (
    <div className="gsv-root">
      <div className="gsv-stage" ref={mountRef} />

      {loading && <div className="gsv-loader"><div className="gsv-spin" /></div>}

      {/* attribution chip (Google-style) */}
      <div className="gsv-attrib">
        <span className="gsv-attrib-dot" />
        <span className="gsv-attrib-txt"><b>NwSSU</b> · {data.title}</span>
      </div>

      {/* round controls */}
      <div className="gsv-controls">
        <button className="gsv-round" onClick={() => setCompass((c) => !c)} aria-label="Toggle heading readout">🧭</button>
        <button className="gsv-round" onClick={() => setMenu((m) => !m)} aria-label="Menu">⋮</button>
        <button className="gsv-round" onClick={closeTour} aria-label="Close">✕</button>
      </div>

      {/* live heading readout — drag to face the true forward direction,
          then copy this number into this node's `heading` in nwssuTour.js */}
      {compass && (
        <div className="gsv-attrib" style={{ top: 60 }}>
          <span className="gsv-attrib-txt">Node #{idx + 1} · heading: <b>{lonReadout}°</b></span>
        </div>
      )}

      {/* menu panel (stops + fullscreen) */}
      {menu && (
        <div className="gsv-menu">
          <div className="gsv-menu-head">Stops</div>
          {nodes.map((node, i) => (
            <button key={i} className={`gsv-menu-item${i === idx ? ' active' : ''}`} onClick={() => goTo(i)}>
              <span className="gsv-menu-i">{node.star ? '★' : i + 1}</span>{node.title}
            </button>
          ))}
          <button className="gsv-menu-item ghost" onClick={toggleFull}>⛶ Fullscreen</button>
        </div>
      )}

      {/* office info chip + card */}
      {n.office && (
        <button className="gsv-info" onClick={() => setCard(n.office)}>ℹ️ {n.office.name}</button>
      )}
      {card && (
        <div className="gsv-card">
          <button className="gsv-card-x" onClick={() => setCard(null)}>×</button>
          <div className="gsv-card-tag">{data.title}</div>
          <h3>{card.name}</h3>
          <p>{card.text}</p>
        </div>
      )}

      {/* fixed-position chevron arrows — always on screen, no camera-direction dependency */}
      {idx > 0 && (
        <button className="gsv-nav back" onClick={() => goTo(idx - 1)} aria-label="Back">
          <span className="gsv-chev">
            <svg viewBox="0 0 120 70"><path d="M12 20 L60 56 L108 20" /></svg>
          </span>
        </button>
      )}
      {idx < nodes.length - 1 && (
        <button className="gsv-nav fwd" onClick={() => goTo(idx + 1)} aria-label="Forward">
          <span className="gsv-chev">
            <svg viewBox="0 0 120 70"><path d="M12 50 L60 14 L108 50" /></svg>
          </span>
        </button>
      )}

      {/* street-name style label */}
      <div className="gsv-street">{n.title}</div>
    </div>
  );
}