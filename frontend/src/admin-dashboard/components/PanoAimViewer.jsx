import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const normYaw = (d) => {
  const x = ((((d + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};
const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function PanoAimViewer({ src, startYaw = 0, pins = [], onFacing }) {
  const containerRef = useRef(null);
  const markersRef = useRef(null);
  const startYawRef = useRef(Number(startYaw) || 0);
  const onFacingRef = useRef(onFacing);
  const [facing, setFacing] = useState(Math.round(normYaw(Number(startYaw) || 0)));
  const [error, setError] = useState('');
  const [readyTick, setReadyTick] = useState(0);
  const lastPinsRef = useRef('');

  useEffect(() => { onFacingRef.current = onFacing; });

  useEffect(() => {
    if (!containerRef.current || !src) return undefined;
    setError('');
    let viewer = null;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        defaultYaw: startYawRef.current * D2R,
        defaultPitch: 0,
        loadingTxt: 'Loading 360° image…',
        mousewheelCtrlKey: true,
        touchmoveTwoFingers: false,
        navbar: ['zoom', 'move', 'fullscreen'],
        plugins: [[MarkersPlugin, {}]],
      });
      markersRef.current = viewer.getPlugin(MarkersPlugin);

      let last = null;
      viewer.addEventListener('position-updated', ({ position }) => {
        const y = Math.round(normYaw(position.yaw * R2D));
        if (y !== last) {
          last = y;
          setFacing(y);
          onFacingRef.current?.(y);
        }
      });
      viewer.addEventListener('panorama-error', () => setError('This image could not be loaded.'));
      viewer.addEventListener('ready', () => {
        const y = Math.round(normYaw(viewer.getPosition().yaw * R2D));
        setFacing(y);
        onFacingRef.current?.(y);
        setReadyTick((n) => n + 1);
      }, { once: true });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (viewer) viewer.destroy();
      markersRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const markers = markersRef.current;
    if (!markers || !readyTick) return;
    const key = `${readyTick}|${JSON.stringify(pins)}`;
    if (key === lastPinsRef.current) return;
    lastPinsRef.current = key;
    markers.setMarkers(pins.map((p) => ({
      id: p.id,
      position: { yaw: `${normYaw(p.yaw)}deg`, pitch: '-12deg' },
      html: `<span class="ad-aim-pin is-${p.kind || 'extra'}">${escapeHtml(p.label)}</span>`,
      anchor: 'center center',
    })));
  }, [readyTick, pins]);

  return (
    <div className="ad-aim-view">
      <div ref={containerRef} className="ad-aim-canvas" />
      <div className="ad-aim-cross" aria-hidden="true" />
      <div className="ad-aim-readout">Facing {facing}°</div>
      {error && <div className="ad-aim-error">{error}</div>}
    </div>
  );
}