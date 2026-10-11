// ============================================================
// BuildingPanoramaViewer — walkable 360° tour of the panoramas an
// admin uploaded for ONE building.
//
// The uploaded panoramas are chained in gallery order (Admin →
// Buildings → Additional Images; use ↑ / ↓ to reorder):
//   View 1 ⇄ View 2 ⇄ View 3 …
// Each view gets a FORWARD arrow (to the next view) and a BACK arrow
// (to the previous one), drawn on the ground like the campus tour.
//
// Arrow direction: the forward arrow points at the image's "Forward
// arrow direction" set in the admin form (degrees, 0 = centre of the
// photo — usually the way the camera faced while walking). The back
// arrow points the opposite way. The "Facing …°" read-out in the top
// bar tells you which number to type for a view.
//
// Still fully separate from PanoramaTour / SphereTour: its own viewer,
// no campus tour graph, no pathway links, no shared state.
//
// Props:
//   building   the building record (for the title)
//   items      [{ id, src, caption, lat, lng, heading }] from getBuildingPanoramas()
//   onClose()
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Compass } from 'lucide-react';
import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '@photo-sphere-viewer/gallery-plugin/index.css';
import '../stylesheets/SphereTour.css'; // same ground-arrow look as the campus tour
import '../stylesheets/building-panorama.css';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

// Same chevron as SphereTour so both tours look alike.
const CHEVRON_SVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle class="tour-arrow-ring" cx="50" cy="50" r="44" />
  <path class="tour-arrow-chev" d="M27 60 L50 37 L73 60" />
</svg>`;

function formatCoords(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

const headingOf = (item) => {
  const h = Number(item?.heading);
  return Number.isFinite(h) ? norm(h) : 0;
};

const labelOf = (item, index) => item.caption || `View ${index + 1}`;

/** Builds a simple chain: each view links to the previous and the next one. */
function buildNodes(items, buildingName) {
  return items.map((item, index) => {
    const forward = headingOf(item);
    const links = [];
    if (index < items.length - 1) {
      links.push({
        nodeId: items[index + 1].id,
        position: { yaw: forward * D2R, pitch: 0 },
        data: { yaw: forward, dir: 'forward' },
      });
    }
    if (index > 0) {
      const back = norm(forward + 180);
      links.push({
        nodeId: items[index - 1].id,
        position: { yaw: back * D2R, pitch: 0 },
        data: { yaw: back, dir: 'back' },
      });
    }
    return {
      id: item.id,
      panorama: item.src,
      thumbnail: item.src,
      name: labelOf(item, index),
      caption: `${buildingName} · ${labelOf(item, index)}`,
      links,
      data: { index, forward },
    };
  });
}

export default function BuildingPanoramaViewer({ building, items, onClose }) {
  const mountRef = useRef(null);
  const [currentId, setCurrentId] = useState(items[0]?.id || null);
  const [facing, setFacing] = useState(0);
  const [error, setError] = useState('');

  const current = items.find((item) => item.id === currentId) || items[0] || null;
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === currentId));

  // Viewer creation is deferred by one tick: React StrictMode (dev) mounts,
  // unmounts and re-mounts effects immediately, and a viewer destroyed while
  // its panorama is still downloading can leave the next one stuck on
  // "Loading". With the delay, the throw-away mount never creates a viewer.
  useEffect(() => {
    const container = mountRef.current;
    if (!container || items.length === 0) return undefined;

    const buildingName = building?.name || 'Building';
    let viewer = null;

    const timer = setTimeout(() => {
      const nodes = buildNodes(items, buildingName);
      const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
      const multiple = nodes.length > 1;

      // Face the way you were walking when you arrive on a view.
      const arrivalYaw = (toNode, fromNode) => {
        if (!fromNode) return toNode.data.forward;
        const cameBack = toNode.data.index < fromNode.data.index;
        return cameBack ? norm(toNode.data.forward + 180) : toNode.data.forward;
      };

      const buildArrow = (link) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'psv-virtual-tour-arrow tour-arrow';
        if (link.data?.dir === 'forward') btn.classList.add('is-route');
        btn.setAttribute('aria-label', `Go to ${byId[link.nodeId]?.name || 'next view'}`);
        btn.innerHTML = CHEVRON_SVG;
        return btn;
      };

      // GalleryPlugin must be registered BEFORE VirtualTourPlugin so the tour
      // can fill the thumbnail strip with its views.
      const plugins = [];
      if (multiple) {
        plugins.push([GalleryPlugin, {
          visibleOnLoad: false,
          hideOnClick: true,
          thumbnailSize: { width: 160, height: 80 },
        }]);
      }
      plugins.push(
        [VirtualTourPlugin, {
          dataMode: 'client',
          positionMode: 'manual',
          renderMode: '3d',
          nodes,
          startNodeId: nodes[0].id,
          preload: true,
          showLinkTooltip: true,
          arrowStyle: { element: buildArrow, size: { width: 80, height: 80 } },
          transitionOptions: (toNode, fromNode) => ({
            showLoader: !fromNode,
            effect: 'fade',
            speed: 650,
            rotation: false,
            rotateTo: { yaw: arrivalYaw(toNode, fromNode) * D2R, pitch: 0 },
          }),
        }],
      );

      viewer = new Viewer({
        container,
        loadingTxt: 'Loading 360° view…',
        defaultYaw: nodes[0].data.forward * D2R,
        defaultPitch: 0,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        navbar: multiple
          ? ['zoom', 'move', 'gallery', 'caption', 'fullscreen']
          : ['zoom', 'move', 'caption', 'fullscreen'],
        plugins,
      });

      const tour = viewer.getPlugin(VirtualTourPlugin);
      tour.addEventListener('node-changed', ({ node }) => {
        setError('');
        setCurrentId(node.id);
      });

      viewer.addEventListener('panorama-error', () => setError('This 360° image could not be loaded.'));

      let lastYaw = null;
      viewer.addEventListener('position-updated', ({ position }) => {
        const y = Math.round(norm(position.yaw * R2D));
        if (y !== lastYaw) {
          lastYaw = y;
          setFacing(y);
        }
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (viewer) viewer.destroy();
    };
  }, [items, building]);

  // Esc closes; lock page scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const coords = formatCoords(current);

  return createPortal(
    <div className="bpv-overlay" role="dialog" aria-modal="true" aria-label={`${building?.name || 'Building'} 360° tour`}>
      <div className="bpv-topbar">
        <div className="bpv-title">
          <span className="bpv-badge">360°</span>
          <div>
            <h2>{building?.name || '360° Tour'}</h2>
            <p>
              <span>
                {current ? labelOf(current, currentIndex) : '360° view'}
                {items.length > 1 && ` · ${currentIndex + 1} of ${items.length}`}
              </span>
              {coords && (
                <span className="bpv-coords">
                  <MapPin size={12} aria-hidden="true" /> {coords}
                </span>
              )}
              <span className="bpv-coords" title="Use this number as the image's forward arrow direction in the admin form">
                <Compass size={12} aria-hidden="true" /> Facing {facing}°
              </span>
            </p>
          </div>
        </div>
        <button type="button" className="bpv-close" onClick={onClose} aria-label="Close 360° tour">
          <X size={22} />
        </button>
      </div>

      <div className="bpv-viewer" ref={mountRef} />

      {error && <div className="bpv-error">{error}</div>}
    </div>,
    document.body
  );
}