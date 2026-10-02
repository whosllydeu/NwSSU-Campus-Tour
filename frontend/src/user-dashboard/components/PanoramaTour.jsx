// ============================================================
// PanoramaTour — full-screen 360° tour, Google Street View style.
// Direction-aware chevron arrows anchored to real compass bearings.
// Supports:
//  - Local branching via exits[dir] = 'some-file.jpg' (unchanged).
//  - Cross-tour jumps via exits[dir] = { tour, node, label } —
//    rendered as a highlighted pin-icon "Enter Building" CTA
//    instead of a plain chevron, and triggers
//    openTour(tour, { startFile: node }) on click.
//  - Reverse walking: when opened with { reverse: true }, forward/
//    back and left/right swap meaning, and the initial/on-arrival
//    facing direction flips 180° — lets one pathway's node list
//    serve both walking directions without duplicating data.
//  - Starting mid-tour via { startFile } instead of always node 0.
//  - At the tour's TRUE start/end (no exit assigned there), the
//    back/forward chevron stays visible and simply exits the tour
//    (closeTour) instead of disappearing. Mid-tour dead ends
//    (exits[dir] explicitly set to null) still hide normally.
// ============================================================
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { TOURS } from '../static/nwssuTour';
import { useUI } from '../context/UIContext';
import NavigationArrow from './NavigationArrow';

const DIRS = ['forward', 'back', 'left', 'right'];
const REV_DIR = { forward: 'back', back: 'forward', left: 'right', right: 'left' };
const SIDE_OFFSET_X = 110;
const SIDE_ROW_FRAC = 0.62;

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="gsv-pin-icon">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 7.3 12.28a1 1 0 0 0 1.4 0C13 22 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="currentColor" />
      <circle cx="12" cy="10" r="3" fill="#fff" />
    </svg>
  );
}

export default function PanoramaTour() {
  const { tour, closeTour, openTour } = useUI();
  const tourId = typeof tour === 'string' ? tour : tour?.id || null;
  const reverse = typeof tour === 'string' ? false : tour?.reverse || false;
  const startFile = typeof tour === 'string' ? null : tour?.startFile || null;
  const data = tourId ? TOURS[tourId] : null;

  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [menu, setMenu] = useState(false);
  const [compass, setCompass] = useState(false);
  const [lonReadout, setLonReadout] = useState(0);
  const [nav, setNav] = useState({ forward: null, back: null, left: null, right: null });

  const nodes = useMemo(() => data?.nodes || [], [data]);
  const base = (import.meta.env.BASE_URL || '/') + (data?.basePath || '');

  const byFile = useMemo(() => {
    const m = {};
    nodes.forEach((n, i) => { m[n.file] = i; });
    return m;
  }, [nodes]);

  // Resolves where a direction leads from a node. Applies the
  // reverse-dir swap first, so authored exits/defaults never need
  // to know whether this is a forward or backward walk-through.
  // Returns one of:
  //   { kind: 'none' }                              — no exit, hide the arrow
  //   { kind: 'local', index }                       — jump within this tour
  //   { kind: 'cross', tour, node, reverse, label }  — jump into another tour
  const getExit = useCallback((node, i, dir) => {
    const rd = reverse ? REV_DIR[dir] : dir;
    const exits = node?.exits;
    if (exits && Object.prototype.hasOwnProperty.call(exits, rd)) {
      const v = exits[rd];
      if (v === null || v === undefined) return { kind: 'none' };
      if (typeof v === 'object') return { kind: 'cross', tour: v.tour, node: v.node, reverse: !!v.reverse, label: v.label };
      const idx2 = byFile[v];
      return idx2 === undefined ? { kind: 'none' } : { kind: 'local', index: idx2 };
    }
    if (rd === 'forward') return i + 1 < nodes.length ? { kind: 'local', index: i + 1 } : { kind: 'none' };
    if (rd === 'back') return i - 1 >= 0 ? { kind: 'local', index: i - 1 } : { kind: 'none' };
    return { kind: 'none' };
  }, [nodes, byFile, reverse]);

  const heading = (node) => node?.heading ?? 0;

  // Real compass bearing an arrow should sit at for a given UI
  // direction. Applies the same reverse-dir swap as getExit, so a
  // reversed walk's "forward" correctly points at the recorded
  // "back" bearing (i.e. behind the camera as originally shot).
  const dirAngle = (node, dir) => {
    const rd = reverse ? REV_DIR[dir] : dir;
    const custom = node?.arrowHeadings?.[rd];
    if (custom != null) return custom;
    const h = heading(node);
    if (rd === 'forward') return h;
    if (rd === 'back') return (h + 180) % 360;
    if (rd === 'left') return (h + 270) % 360;
    if (rd === 'right') return (h + 90) % 360;
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
    const projectDir = (dir, lonD, latD) => {
      const p = project(lonD, latD);
      if (p) { S.lastPos[dir] = { x: p.x, y: p.y }; return p; }
      const last = S.lastPos[dir] || { x: mount.clientWidth / 2, y: mount.clientHeight * 0.72 };
      return { x: last.x, y: last.y, o: 0 };
    };
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

      readoutTick = (readoutTick + 1) % 6;
      if (readoutTick === 0) {
        let norm = Math.round(S.lon) % 360;
        if (norm < 0) norm += 360;
        setLonReadout(norm);

        const node = nodes[S.idx];
        // True tour boundaries (accounting for reverse): the edge
        // where back/forward has nothing assigned should still show
        // a visible, correctly-positioned chevron that exits the
        // tour — not just vanish like a mid-path dead end.
        const atBackEdge = reverse ? S.idx === nodes.length - 1 : S.idx === 0;
        const atForwardEdge = reverse ? S.idx === 0 : S.idx === nodes.length - 1;

        const next = {};
        DIRS.forEach((dir) => {
          const exit = getExit(node, S.idx, dir);
          if (exit.kind === 'none') {
            const isEdge = (dir === 'back' && atBackEdge) || (dir === 'forward' && atForwardEdge);
            next[dir] = isEdge ? projectDir(dir, dirAngle(node, dir), -14) : null;
            return;
          }
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

    const start = (() => {
      if (!startFile) return 0;
      const found = nodes.findIndex((n) => n.file === startFile);
      return found >= 0 ? found : 0;
    })();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdx(start); S.idx = start; setLoading(true);
    S.lon = dirAngle(nodes[start], 'forward'); S.lat = 0;
    S.loadInto(start).then((t) => {
      sphere.material.map = t; sphere.material.needsUpdate = true; setLoading(false);
      if (nodes[start + 1]) S.loadInto(start + 1);
      if (nodes[start - 1]) S.loadInto(start - 1);
    });

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
    mountRef.current?.classList.add('gsv-traveling');
    S.loadInto(i).then((t) => {
      S.sphere.material.map = t; S.sphere.material.needsUpdate = true;
      S.lon = dirAngle(nodes[i], 'forward'); S.lat = 0; S.idx = i; setIdx(i); setLoading(false);
      mountRef.current?.classList.remove('gsv-traveling');
      if (nodes[i + 1]) S.loadInto(i + 1);
      if (nodes[i - 1]) S.loadInto(i - 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, reverse]);

  // Leaves this tour entirely and enters the one named in a
  // cross-tour exit, landing on its specified node.
  const jumpTour = useCallback((exit) => {
    openTour(exit.tour, { reverse: exit.reverse, startFile: exit.node });
  }, [openTour]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e) => {
      const S = stateRef.current;
      const node = nodes[S.idx];
      if (e.key === 'ArrowRight') {
        const exit = getExit(node, S.idx, 'forward');
        if (exit.kind === 'local') goTo(exit.index);
        else if (exit.kind === 'cross') jumpTour(exit);
      } else if (e.key === 'ArrowLeft') {
        const exit = getExit(node, S.idx, 'back');
        if (exit.kind === 'local') goTo(exit.index);
        else if (exit.kind === 'cross') jumpTour(exit);
      } else if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, goTo, closeTour, nodes, getExit, jumpTour]);

  const toggleFull = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!data) return null;
  const n = nodes[idx] || {};
  const exits = {
    forward: getExit(n, idx, 'forward'),
    back: getExit(n, idx, 'back'),
    left: getExit(n, idx, 'left'),
    right: getExit(n, idx, 'right'),
  };
  const atBackEdge = reverse ? idx === nodes.length - 1 : idx === 0;
  const atForwardEdge = reverse ? idx === 0 : idx === nodes.length - 1;

  const navStyle = (p) => ({
    left: p ? p.x : '50%',
    top: p ? p.y : '72%',
    opacity: p ? p.o : 0,
    pointerEvents: p && p.o > 0.08 ? 'auto' : 'none',
  });

  const handleArrow = (exit) => {
    if (exit.kind === 'local') goTo(exit.index);
    else if (exit.kind === 'cross') jumpTour(exit);
  };

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
          <span className="gsv-attrib-txt">Node #{idx + 1} · heading: <b>{lonReadout}°</b>{reverse ? ' · reversed' : ''}</span>
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

      {/* back */}
      {exits.back.kind !== 'none' ? (
        exits.back.kind === 'cross' ? (
          <button className="gsv-enter" style={navStyle(nav.back)} onClick={() => handleArrow(exits.back)} aria-label="Enter building">
            <PinIcon /><span>{exits.back.label || `Enter ${TOURS[exits.back.tour]?.title || 'Building'}`}</span>
          </button>
        ) : (
          <button className="gsv-nav back" style={navStyle(nav.back)} onClick={() => handleArrow(exits.back)} aria-label="Back">
            <span className="gsv-chev"><svg viewBox="0 0 120 70"><path d="M12 20 L60 56 L108 20" /></svg></span>
          </button>
        )
      ) : atBackEdge ? (
        <button className="gsv-nav back" style={navStyle(nav.back)} onClick={closeTour} aria-label="Exit tour">
          <span className="gsv-chev"><svg viewBox="0 0 120 70"><path d="M12 20 L60 56 L108 20" /></svg></span>
        </button>
      ) : null}

      {/* forward */}
      {exits.forward.kind !== 'none' ? (
        exits.forward.kind === 'cross' ? (
          <button className="gsv-enter" style={navStyle(nav.forward)} onClick={() => handleArrow(exits.forward)} aria-label="Enter building">
            <PinIcon /><span>{exits.forward.label || `Enter ${TOURS[exits.forward.tour]?.title || 'Building'}`}</span>
          </button>
        ) : (
          <button className="gsv-nav fwd" style={navStyle(nav.forward)} onClick={() => handleArrow(exits.forward)} aria-label="Forward">
            <span className="gsv-chev"><svg viewBox="0 0 120 70"><path d="M12 50 L60 14 L108 50" /></svg></span>
          </button>
        )
      ) : atForwardEdge ? (
        <button className="gsv-nav fwd" style={navStyle(nav.forward)} onClick={closeTour} aria-label="Exit tour">
          <span className="gsv-chev"><svg viewBox="0 0 120 70"><path d="M12 50 L60 14 L108 50" /></svg></span>
        </button>
      ) : null}

      {/* left */}
      {exits.left.kind !== 'none' && (
        exits.left.kind === 'cross' ? (
          <button className="gsv-enter side" style={navStyle(nav.left)} onClick={() => handleArrow(exits.left)} aria-label="Enter building">
            <PinIcon /><span>{exits.left.label || `Enter ${TOURS[exits.left.tour]?.title || 'Building'}`}</span>
          </button>
        ) : (
          <button className="gsv-nav side left" style={navStyle(nav.left)} onClick={() => handleArrow(exits.left)} aria-label="Turn left">
            <span className="gsv-chev side"><svg viewBox="0 0 70 120"><path d="M50 12 L14 60 L50 108" /></svg></span>
          </button>
        )
      )}

      {/* right */}
      {exits.right.kind !== 'none' && (
        exits.right.kind === 'cross' ? (
          <button className="gsv-enter side" style={navStyle(nav.right)} onClick={() => handleArrow(exits.right)} aria-label="Enter building">
            <PinIcon /><span>{exits.right.label || `Enter ${TOURS[exits.right.tour]?.title || 'Building'}`}</span>
          </button>
        ) : (
          <button className="gsv-nav side right" style={navStyle(nav.right)} onClick={() => handleArrow(exits.right)} aria-label="Turn right">
            <span className="gsv-chev side"><svg viewBox="0 0 70 120"><path d="M20 12 L56 60 L20 108" /></svg></span>
          </button>
        )
      )}

      <div className="gsv-street">{n.title}</div>
    </div>
  );
}