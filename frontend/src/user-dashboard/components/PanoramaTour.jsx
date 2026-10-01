// ============================================================
// PanoramaTour — full-screen 360° tour, Google Street View style.
// Pure Three.js (dependency: `three`). Direction-aware chevron
// arrows anchored to real compass bearings within the panorama —
// they slide/fade in and out as you rotate, instead of sitting in
// a fixed screen position. Left/right arrows use their TRUE bearing
// only to decide visibility/fade; their on-screen position is a
// fixed slot beside forward/back (Google-Maps-style tight cluster)
// rather than their realistically-far-apart projected spot.
// Attribution chip, round controls, street-name label unchanged.
// ============================================================
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { TOURS } from '../static/nwssuTour';
import { useUI } from '../context/UIContext';
import NavigationArrow from './NavigationArrow';

const DIRS = ['forward', 'back', 'left', 'right'];
const SIDE_OFFSET_X = 110; // px either side of center for left/right arrows
const SIDE_ROW_FRAC = 0.62; // vertical position for the side-arrow row, as a fraction of stage height

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
  const [nav, setNav] = useState({ forward: null, back: null, left: null, right: null });

  const nodes = useMemo(() => data?.nodes || [], [data]);
  const base = (import.meta.env.BASE_URL || '/') + (data?.basePath || '');

  // file -> index lookup, so `exits` can target nodes by filename
  // instead of fragile array positions.
  const byFile = useMemo(() => {
    const m = {};
    nodes.forEach((n, i) => { m[n.file] = i; });
    return m;
  }, [nodes]);

  // Resolve where a given direction leads from a node.
  // - If the node defines `exits[dir]`, that wins: a filename string
  //   is looked up via byFile, and `null` explicitly disables the
  //   direction (dead end / no side path).
  // - Otherwise falls back to the old behavior: forward = idx+1,
  //   back = idx-1, left/right have no default (must be explicit).
  // Returns -1 when there is no exit in that direction.
  const getExit = useCallback((node, i, dir) => {
    const exits = node?.exits;
    if (exits && Object.prototype.hasOwnProperty.call(exits, dir)) {
      const v = exits[dir];
      if (v === null || v === undefined) return -1;
      return byFile[v] ?? -1;
    }
    if (dir === 'forward') return i + 1 < nodes.length ? i + 1 : -1;
    if (dir === 'back') return i - 1 >= 0 ? i - 1 : -1;
    return -1;
  }, [nodes, byFile]);

  // Direction (in degrees) that "forward" faces in a given node's photo.
  // Defaults to 0 when a node has no `heading` set, so untouched nodes
  // behave exactly as before.
  const heading = (node) => node?.heading ?? 0;

  // Real compass bearing an arrow should sit at for a given direction.
  // Override per-node with `arrowHeadings: { left: 95, right: 250 }` etc.
  // when a turn isn't a clean 90°/270° off `heading` (e.g. an odd-angle
  // branch like a fork at the end of a hallway).
  const dirAngle = (node, dir) => {
    const custom = node?.arrowHeadings?.[dir];
    if (custom != null) return custom;
    const h = heading(node);
    if (dir === 'forward') return h;
    if (dir === 'back') return (h + 180) % 360;
    if (dir === 'left') return (h + 270) % 360;
    if (dir === 'right') return (h + 90) % 360;
    return h;
  };

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

    Object.assign(S, { scene, camera, renderer, sphere, cache: {}, lon: 0, lat: 0, drag: false, px: 0, py: 0, raf: 0, idx: 0, lastPos: {} });

    // Project a world bearing (lonD) at floor level (latD) onto screen
    // pixels relative to the CURRENT camera look direction. Returns null
    // when the point is behind the camera or outside the frustum.
    const dirVec = (lonD, latD, R) => {
      const phi = THREE.MathUtils.degToRad(90 - latD), th = THREE.MathUtils.degToRad(lonD);
      return new THREE.Vector3(R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(th));
    };
    const project = (lonD, latD) => {
      const fwd = dirVec(S.lon, S.lat, 1).normalize();
      const p = dirVec(lonD, latD, 480);
      const d = p.clone().normalize().dot(fwd);
      if (d < 0.15) return null;
      const v = p.clone().project(camera);
      if (v.z > 1) return null;
      return { x: (v.x * 0.5 + 0.5) * mount.clientWidth, y: (-v.y * 0.5 + 0.5) * mount.clientHeight, o: Math.min(1, (d - 0.15) * 10) };
    };
    // Same as project(), but remembers each direction's last visible
    // position so a hidden arrow fades out in place instead of jumping
    // to center when it reappears. Used for forward/back, which keep
    // their true projected position.
    const projectDir = (dir, lonD, latD) => {
      const p = project(lonD, latD);
      if (p) { S.lastPos[dir] = { x: p.x, y: p.y }; return p; }
      const last = S.lastPos[dir] || { x: mount.clientWidth / 2, y: mount.clientHeight * 0.72 };
      return { x: last.x, y: last.y, o: 0 };
    };
    // For left/right: only the fade (o) comes from the true bearing —
    // position is a fixed slot beside center, so a 90°-apart branch still
    // reads as a tight Google-Maps-style cluster instead of sitting out
    // near the screen edge.
    const projectSide = (dir, lonD, latD) => {
      const p = project(lonD, latD);
      const o = p ? p.o : 0;
      return {
        x: mount.clientWidth / 2 + (dir === 'right' ? SIDE_OFFSET_X : -SIDE_OFFSET_X),
        y: mount.clientHeight * SIDE_ROW_FRAC,
        o,
      };
    };

    let readoutTick = 0;
    const animate = () => {
      S.raf = requestAnimationFrame(animate);
      const phi = THREE.MathUtils.degToRad(90 - S.lat), th = THREE.MathUtils.degToRad(S.lon);
      camera.lookAt(500 * Math.sin(phi) * Math.cos(th), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(th));
      renderer.render(scene, camera);

      // Throttled to ~10fps: smooth enough for arrow motion, cheap enough
      // to avoid unnecessary re-renders every single animation frame.
      readoutTick = (readoutTick + 1) % 6;
      if (readoutTick === 0) {
        let norm = Math.round(S.lon) % 360;
        if (norm < 0) norm += 360;
        setLonReadout(norm);

        const node = nodes[S.idx];
        const next = {};
        DIRS.forEach((dir) => {
          const target = getExit(node, S.idx, dir);
          if (target === -1) { next[dir] = null; return; }
          const angle = dirAngle(node, dir);
          next[dir] = (dir === 'left' || dir === 'right')
            ? projectSide(dir, angle, -14)
            : projectDir(dir, angle, -14);
        });
        setNav(next);
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    mountRef.current?.classList.add('gsv-traveling'); // blur in immediately on click
    S.loadInto(i).then((t) => {
      S.sphere.material.map = t; S.sphere.material.needsUpdate = true;
      S.lon = heading(nodes[i]); S.lat = 0; S.idx = i; setIdx(i); setLoading(false);
      mountRef.current?.classList.remove('gsv-traveling'); // blur eases back out
      if (nodes[i + 1]) S.loadInto(i + 1);
      if (nodes[i - 1]) S.loadInto(i - 1);
    });
  }, [nodes]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { const t = getExit(nodes[stateRef.current.idx], stateRef.current.idx, 'forward'); if (t !== -1) goTo(t); }
      else if (e.key === 'ArrowLeft') { const t = getExit(nodes[stateRef.current.idx], stateRef.current.idx, 'back'); if (t !== -1) goTo(t); }
      else if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, goTo, closeTour, nodes, getExit]);

  const toggleFull = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!data) return null;
  const n = nodes[idx] || {};
  const fwdTarget = getExit(n, idx, 'forward');
  const backTarget = getExit(n, idx, 'back');
  const leftTarget = getExit(n, idx, 'left');
  const rightTarget = getExit(n, idx, 'right');

  // Turns a projected {x,y,o} (or null, meaning "rotated out of view") into
  // inline style: fades opacity to 0 and disables clicks when hidden, but
  // keeps the element mounted so CSS transitions can animate the fade.
  const navStyle = (p) => ({
    left: p ? p.x : '50%',
    top: p ? p.y : '72%',
    opacity: p ? p.o : 0,
    pointerEvents: p && p.o > 0.08 ? 'auto' : 'none',
  });

  return (
    <div className="gsv-root">
      <div className="gsv-stage" ref={mountRef} />

      {loading && <div className="gsv-loader"><div className="gsv-spin" /></div>}

      <div className="gsv-attrib">
        <span className="gsv-attrib-dot" />
        <span className="gsv-attrib-txt"><b>NwSSU</b> · {data.title}</span>
      </div>

      <div className="gsv-controls">
        <button className="gsv-round" onClick={() => setCompass((c) => !c)} aria-label="Toggle heading readout">🧭</button>
        <button className="gsv-round" onClick={() => setMenu((m) => !m)} aria-label="Menu">⋮</button>
        <button className="gsv-round" onClick={closeTour} aria-label="Close">✕</button>
      </div>

      {compass && (
        <div className="gsv-attrib" style={{ top: 60, gap: 10 }}>
          <NavigationArrow heading={lonReadout} moving={false} size={28} color="#1a73e8" />
          <span className="gsv-attrib-txt">Node #{idx + 1} · heading: <b>{lonReadout}°</b></span>
        </div>
      )}

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

      {/* direction-aware chevrons — anchored to real bearings, fade as you rotate */}
      {backTarget !== -1 && (
        <button className="gsv-nav back" style={navStyle(nav.back)} onClick={() => goTo(backTarget)} aria-label="Back">
          <span className="gsv-chev">
            <svg viewBox="0 0 120 70"><path d="M12 20 L60 56 L108 20" /></svg>
          </span>
        </button>
      )}
      {fwdTarget !== -1 && (
        <button className="gsv-nav fwd" style={navStyle(nav.forward)} onClick={() => goTo(fwdTarget)} aria-label="Forward">
          <span className="gsv-chev">
            <svg viewBox="0 0 120 70"><path d="M12 50 L60 14 L108 50" /></svg>
          </span>
        </button>
      )}
      {leftTarget !== -1 && (
        <button className="gsv-nav side left" style={navStyle(nav.left)} onClick={() => goTo(leftTarget)} aria-label="Turn left">
          <span className="gsv-chev side">
            <svg viewBox="0 0 70 120"><path d="M50 12 L14 60 L50 108" /></svg>
          </span>
        </button>
      )}
      {rightTarget !== -1 && (
        <button className="gsv-nav side right" style={navStyle(nav.right)} onClick={() => goTo(rightTarget)} aria-label="Turn right">
          <span className="gsv-chev side">
            <svg viewBox="0 0 70 120"><path d="M20 12 L56 60 L20 108" /></svg>
          </span>
        </button>
      )}

      <div className="gsv-street">{n.title}</div>
    </div>
  );
}