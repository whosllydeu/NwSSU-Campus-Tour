// ============================================================
// PanoramaTour — full-screen 360° tour overlay (Street View style).
//
// This is now just the UI shell (title, controls, stops menu, office
// cards, guided-walk banner). The 360° rendering, arrows and
// transitions are done by SphereTour.jsx, so there is only ONE
// panorama engine in the app.
//
// Opened from anywhere through UIContext:
//   openTour('ccis')                                  // a building
//   openTour('path-gate-cea')                         // a pathway
//   openTour('cat', { startNode: 'cat-09' })          // a specific node
//   openTour(id, { startNode, destinationNode,        // guided walk
//                  destinationLabel })                //   (Map "Walk there!")
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { TOURS, NODE_BY_ID, getTourStart, findPath, tourOfNode } from '../static/nwssuTour';
import SphereTour from './SphereTour';
import NavigationArrow from './NavigationArrow';

export default function PanoramaTour() {
  const { tour, closeTour } = useUI();
  if (!tour) return null;
  const key = `${tour.id}|${tour.startNode || ''}|${tour.destinationNode || ''}`;
  return <TourScreen key={key} tour={tour} closeTour={closeTour} />;
}

function TourScreen({ tour, closeTour }) {
  const startNode = useMemo(() => getTourStart(tour.id, tour.startNode), [tour.id, tour.startNode]);
  const apiRef = useRef(null);
  const [node, setNode] = useState(null);
  const [menu, setMenu] = useState(false);
  const [card, setCard] = useState(null);
  const [compass, setCompass] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [pick, setPick] = useState(null);
  const [destination, setDestination] = useState(
    tour.destinationNode && NODE_BY_ID[tour.destinationNode] ? tour.destinationNode : null
  );

  const currentTour = node ? TOURS[node.data.tour] : TOURS[NODE_BY_ID[startNode]?.data.tour];
  const destTitle = destination
    ? tour.destinationLabel || tourOfNode(destination)?.title || NODE_BY_ID[destination]?.name
    : null;
  const stopsLeft = useMemo(() => {
    if (!node || !destination) return null;
    const path = findPath(node.id, destination);
    return path ? path.length - 1 : -1;
  }, [node, destination]);

  const handleNodeChange = useCallback((n) => {
    setNode(n);
    setCard(null);
    setMenu(false);
  }, []);

  const handlePick = useCallback(({ yaw: y, pitch }) => {
    setPick({ yaw: y, pitch });
    const id = apiRef.current?.getNodeId();
    console.log(`[tour] ${id}: { nodeId: '<target-node-id>', position: { yaw: '${y}deg', pitch: '0deg' } }   (pitch here: ${pitch}deg)`);
  }, []);

  // Keyboard: ↑/W walk forward, ↓/S walk back, Esc close.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeTour();
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') apiRef.current?.step('forward');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') apiRef.current?.step('back');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeTour]);

  const toggleFull = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!startNode) {
    return (
      <div className="gsv-root">
        <div className="tour-empty">
          <p>Virtual Tour is currently not available for this location yet.</p>
          <button className="tour-guide-btn" onClick={closeTour}>Close</button>
        </div>
      </div>
    );
  }

  const stops = currentTour ? currentTour.nodeIds.map((id) => NODE_BY_ID[id]) : [];
  const office = node?.data.office;

  return (
    <div className="gsv-root">
      <div className="gsv-stage">
        <SphereTour
          startNodeId={startNode}
          destinationNode={destination}
          apiRef={apiRef}
          onNodeChange={handleNodeChange}
          onYaw={compass ? setYaw : undefined}
          onPick={compass ? handlePick : undefined}
        />
      </div>

      <div className="gsv-attrib">
        <span className="gsv-attrib-dot" />
        <span className="gsv-attrib-txt"><b>NwSSU</b> · {currentTour?.title}</span>
      </div>

      <div className="gsv-controls">
        <button className="gsv-round" onClick={() => setCompass((c) => !c)} aria-label="Toggle heading readout">🧭</button>
        <button className="gsv-round" onClick={() => setMenu((m) => !m)} aria-label="Menu">⋮</button>
        <button className="gsv-round" onClick={closeTour} aria-label="Close">✕</button>
      </div>

      {compass && node && (
        <div className="gsv-attrib tour-readout">
          <NavigationArrow heading={(yaw + 360) % 360} moving={false} size={28} color="#1a73e8" />
          <span className="gsv-attrib-txt">
            <b>{node.id}</b> · yaw: <b>{yaw}°</b>
            {pick && <> · tapped: <b>{pick.yaw}°</b></>}
          </span>
        </div>
      )}

      {destination && node && (
        <div className={`tour-guide${stopsLeft === 0 ? ' is-arrived' : ''}`}>
          {stopsLeft === 0 ? (
            <>
              <span>✅ You've arrived at <b>{destTitle}</b></span>
              <button className="tour-guide-btn" onClick={() => setDestination(null)}>Explore</button>
            </>
          ) : stopsLeft > 0 ? (
            <>
              <span>🚶 To <b>{destTitle}</b> · {stopsLeft} {stopsLeft === 1 ? 'step' : 'steps'} — follow the green arrow</span>
              <button className="tour-guide-btn ghost" onClick={() => setDestination(null)}>End</button>
            </>
          ) : (
            <>
              <span>No 360° path from here to <b>{destTitle}</b>.</span>
              <button className="tour-guide-btn ghost" onClick={() => setDestination(null)}>OK</button>
            </>
          )}
        </div>
      )}

      {menu && (
        <div className="gsv-menu">
          <div className="gsv-menu-head">Stops · {currentTour?.title}</div>
          {stops.map((s, i) => (
            <button
              key={s.id}
              className={`gsv-menu-item${s.id === node?.id ? ' active' : ''}`}
              onClick={() => { setMenu(false); apiRef.current?.goTo(s.id); }}
            >
              <span className="gsv-menu-i">{s.data.star ? '★' : i + 1}</span>{s.name}
            </button>
          ))}
          <button className="gsv-menu-item ghost" onClick={toggleFull}>⛶ Fullscreen</button>
        </div>
      )}

      {office && (
        <button className="gsv-info" onClick={() => setCard(office)}>ℹ️ {office.name}</button>
      )}
      {card && (
        <div className="gsv-card">
          <button className="gsv-card-x" onClick={() => setCard(null)}>×</button>
          <div className="gsv-card-tag">{currentTour?.title}</div>
          <h3>{card.name}</h3>
          <p>{card.text}</p>
        </div>
      )}

      {node && <div className="gsv-street">{node.name}</div>}
    </div>
  );
}