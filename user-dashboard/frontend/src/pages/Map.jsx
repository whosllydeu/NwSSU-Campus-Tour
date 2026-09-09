import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampusData } from '../context/CampusDataContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { hasTour } from '../data/ccisTour.js';
import campusMap from '../assets/images/nwssu_map.png';

const MAP_COORDS = {
  gate: { x: 36, y: 82 }, cat: { x: 58, y: 29 }, ccjs: { x: 9, y: 43 },
  coed: { x: 5, y: 49 }, ccis: { x: 24, y: 62 }, con: { x: 37, y: 63 },
  com: { x: 81, y: 64 }, cea: { x: 64, y: 75 }, president: { x: 63, y: 38 },
  registrar: { x: 73, y: 33 }, cashier: { x: 66, y: 48 }, alumni: { x: 26, y: 24 },
  canteen: { x: 46, y: 65 }, sociocultural: { x: 54, y: 67 },
  studentcouncil: { x: 62, y: 68 }, library: { x: 62, y: 60 }, hotel: { x: 76, y: 61 },
  sports: { x: 34, y: 43 },
};

const LABELS = {
  gate: 'Main Gate', cat: 'CAT Building', ccis: 'CCIS Building', library: 'University Library',
  coed: 'COED Building', cea: 'CEA Building', con: 'CON Building', com: 'COM Building',
  president: "Admin / President's Office", ccjs: 'CCJS Building', registrar: "Registrar's Office",
  cashier: "Cashier's Office", alumni: 'Alumni Building', sociocultural: 'Socio-Cultural Building',
  studentcouncil: 'Student Council Building', hotel: 'NWSSU Hotel & Restaurant', canteen: 'University Canteen',
  sports: 'Sports Complex',
};

const COLOR_FALLBACK = '#445566';

export default function Map() {
  const navigate = useNavigate();
  const { buildings, hasAR } = useCampusData();
  const { openBuilding, openAR, openTour, openUnavailable } = useUI();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const lastDragMoved = useRef(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter((b) =>
      b.name.toLowerCase().includes(q) || (b.abbr || '').toLowerCase().includes(q)
    );
  }, [buildings, query]);

  const selected = buildings.find((b) => b.id === selectedId) || null;

  const select = (id) => {
    if (!buildings.some((b) => b.id === id)) return;
    setSelectedId(id);
  };

  const zoom = (delta) => setScale((v) => Math.min(2.25, Math.max(0.65, +(v + delta).toFixed(2))));
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    lastDragMoved.current = false;
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) {
      drag.current.moved = true;
      lastDragMoved.current = true;
    }
    setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  };

  const onPointerUp = () => { drag.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.1 : -0.1);
  };

  const handleBuildingPointerDown = (e) => {
    e.stopPropagation();
  };

  const handleBuildingClick = (e, id) => {
    e.stopPropagation();
    if (lastDragMoved.current) {
      lastDragMoved.current = false;
      return;
    }
    select(id);
  };

  const details = (id) => openBuilding(id);
  const navigateHere = (id) => {
    // Prefer the 360° virtual tour when one exists for this place (only
    // CCIS has one right now) — it's ready to view with no GPS setup.
    // Fall back to AR walking directions, then to a toast if neither
    // has been configured yet.
    if (hasTour(id)) openTour(id);
    else if (hasAR(id)) openAR(id);
    else openUnavailable('Navigation is not configured for this location yet.');
  };

  return (
    <section className="page active" id="page-map">
      <div className="map-layout">
        <aside className={`map-sidebar${sidebarOpen ? ' open' : ' collapsed'}`}>
          <div className="msb-head">
            <h2>Campus Map</h2>
            <button className="msb-close" onClick={() => setSidebarOpen(false)} aria-label="Close locations">✕</button>
          </div>
          <div className="msb-search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search building…" />
          </div>
          <div className="msb-block">
            <div className="msb-label">Locations</div>
            <div className="msb-list">
              {shown.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`msb-item${selectedId === b.id ? ' active' : ''}`}
                  onClick={() => select(b.id)}
                >
                  <span className="msb-dot" style={{ background: b.color || COLOR_FALLBACK }} />
                  <span>{b.abbr ? `${b.abbr} – ` : ''}{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="map-canvas-area">
          {!sidebarOpen && (
            <button className="map-fab" onClick={() => setSidebarOpen(true)}>☰ Locations</button>
          )}

          <div className="map-tools">
            <button className="mtool" onClick={() => zoom(0.15)} aria-label="Zoom in">＋</button>
            <button className="mtool" onClick={() => zoom(-0.15)} aria-label="Zoom out">－</button>
            <button className="mtool" onClick={reset} aria-label="Reset map">⊙</button>
            <button className="mtool" onClick={() => navigate('/')} aria-label="Back to home">⌂</button>
          </div>

          <div
            className="map-viewport"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <div
              className="map-world"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              }}
            >
              <img className="campus-map-bg" src={campusMap} alt="NWSSU campus map" draggable="false" />

              {buildings.map((b) => {
                const pos = MAP_COORDS[b.id];
                if (!pos) return null;
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`mw-bldg${b.id === selectedId ? ' selected' : ''}${b.id === 'sports' ? ' sports' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, background: `${b.color || COLOR_FALLBACK}e8` }}
                    onPointerDown={(e) => handleBuildingPointerDown(e, b.id)}
                    onClick={(e) => handleBuildingClick(e, b.id)}
                    title={LABELS[b.id] || b.name}
                  >
                    <span>{b.abbr || LABELS[b.id] || b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="bldg-popup show" role="dialog" aria-label={`${selected.name} information`}>
              <button className="popup-x" onClick={() => setSelectedId(null)} aria-label="Close">✕</button>
              <div className="popup-name">{selected.name}</div>
              <div className="popup-loc">📍 {selected.location}</div>
              <div className="popup-desc">{selected.desc?.slice(0, 150)}{selected.desc?.length > 150 ? '…' : ''}</div>
              <div className="popup-actions">
                <button className="btn-primary" onClick={() => details(selected.id)}>Details</button>
                <button className="btn-ghost" onClick={() => navigateHere(selected.id)}>Navigate Here</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}