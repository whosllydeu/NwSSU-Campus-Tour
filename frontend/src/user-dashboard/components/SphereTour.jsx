// ============================================================
// SphereTour — the ONE 360° renderer for the whole app.
//
// Photo Sphere Viewer + VirtualTourPlugin (the engine the CAT tour
// already used), fed with the single campus graph from
// static/tourNodes.js. Because every building AND pathway is in the
// same graph, walking from a pathway into a building is just another
// arrow click — same viewer, no remount, no flicker.
//
// Street-View behaviour:
//  - Arrows are drawn on the ground in 3D (renderMode '3d') at each
//    link's real yaw, so they rotate with the panorama and slide out
//    of view when you look away — never pinned to the screen.
//  - Only the links that exist on the current node are drawn.
//  - On arrival the camera faces the next step of the guided route,
//    otherwise the direction you were walking (away from the photo
//    you came from), otherwise the node's own `yaw`.
//  - Transitions fade without spinning: the new photo is pre-aligned
//    to where you were looking, then the view settles on the arrival
//    direction. Linked photos are preloaded.
//  - Cross-tour links get a floating "Enter …" pin anchored in 3D.
//
// Usually used through PanoramaTour.jsx (the overlay UI). Props:
//   startNodeId      node to open on
//   destinationNode  optional — guided "Walk there!" target
//   apiRef           ref that receives { goTo, step, getNodeId }
//   onNodeChange(node), onYaw(deg), onPick({ yaw, pitch })
// ============================================================
import { useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '../stylesheets/SphereTour.css';

import { TOUR_NODES, NODE_BY_ID, findPath } from '../static/nwssuTour';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

// Ground chevron (points "up" = toward the link's yaw once laid flat).
const CHEVRON_SVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle class="tour-arrow-ring" cx="50" cy="50" r="44" />
  <path class="tour-arrow-chev" d="M27 60 L50 37 L73 60" />
</svg>`;

// PSV may mutate node objects; give each viewer its own copy.
const cloneNodes = () => TOUR_NODES.map((n) => ({
  ...n,
  links: n.links.map((l) => ({ ...l, position: { ...l.position }, data: { ...l.data } })),
  markers: n.markers.map((m) => ({ ...m, position: { ...m.position }, data: { ...m.data } })),
  data: { ...n.data },
}));

export default function SphereTour({ startNodeId, destinationNode = null, apiRef, onNodeChange, onYaw, onPick }) {
  const mountRef = useRef(null);
  const viewerRef = useRef(null);
  const destRef = useRef(destinationNode);
  const hopCache = useRef({});
  const cbRef = useRef({ onNodeChange, onYaw, onPick });

  useEffect(() => { cbRef.current = { onNodeChange, onYaw, onPick }; });

  // Next node on the guided route from `fromId`, or null.
  const nextHop = (fromId) => {
    const dest = destRef.current;
    if (!dest || fromId === dest) return null;
    const key = `${fromId}>${dest}`;
    if (!(key in hopCache.current)) hopCache.current[key] = findPath(fromId, dest)?.[1] ?? null;
    return hopCache.current[key];
  };

  // Re-highlight arrows when the destination changes (e.g. guide ended).
  useEffect(() => {
    destRef.current = destinationNode;
    const tour = viewerRef.current?.getPlugin(VirtualTourPlugin);
    const current = tour?.getCurrentNode();
    const hop = current ? nextHop(current.id) : null;
    mountRef.current?.querySelectorAll('.tour-arrow').forEach((el) => {
      el.classList.toggle('is-route', Boolean(hop) && el.dataset.nodeId === hop);
    });
  }, [destinationNode]);

  useEffect(() => {
    const start = NODE_BY_ID[startNodeId] ? startNodeId : TOUR_NODES[0].id;

    // Which way to face when arriving on `toNode` (degrees).
    const arrivalYaw = (toNode, fromNode) => {
      const linkTo = (id) => toNode.links.find((l) => l.nodeId === id);
      const hop = nextHop(toNode.id);
      if (hop && linkTo(hop)) return linkTo(hop).data.yaw;
      if (fromNode && fromNode.data?.tour === toNode.data?.tour) {
        const back = linkTo(fromNode.id);
        if (back) return norm(back.data.yaw + 180); // keep walking the same way
      }
      return toNode.data?.yaw ?? 0;
    };

    const buildArrow = (link) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'psv-virtual-tour-arrow tour-arrow';
      btn.dataset.nodeId = link.nodeId;
      if (link.data?.cross) btn.classList.add('is-cross');
      const current = viewerRef.current?.getPlugin(VirtualTourPlugin)?.getCurrentNode();
      if (current && nextHop(current.id) === link.nodeId) btn.classList.add('is-route');
      btn.setAttribute('aria-label', `Go to ${NODE_BY_ID[link.nodeId]?.name || 'next panorama'}`);
      btn.innerHTML = CHEVRON_SVG;
      return btn;
    };

    const viewer = new Viewer({
      container: mountRef.current,
      navbar: false,
      loadingTxt: '',
      defaultYaw: (NODE_BY_ID[start].data.yaw || 0) * D2R,
      defaultPitch: 0,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
      plugins: [
        [MarkersPlugin, {}],
        [VirtualTourPlugin, {
          dataMode: 'client',
          positionMode: 'manual',
          renderMode: '3d',
          nodes: cloneNodes(),
          startNodeId: start,
          preload: true,
          showLinkTooltip: true,
          arrowStyle: { element: buildArrow, size: { width: 80, height: 80 } },
          arrowsPosition: { linkOverlapAngle: Math.PI / 10 },
          transitionOptions: (toNode, fromNode) => ({
            showLoader: !fromNode,
            effect: 'fade',
            speed: 650,
            rotation: false,
            rotateTo: { yaw: arrivalYaw(toNode, fromNode) * D2R, pitch: 0 },
          }),
        }],
      ],
    });
    viewerRef.current = viewer;

    const tour = viewer.getPlugin(VirtualTourPlugin);
    const markers = viewer.getPlugin(MarkersPlugin);

    const goVia = (nodeId) => {
      const current = tour.getCurrentNode();
      const link = current?.links.find((l) => l.nodeId === nodeId);
      return tour.setCurrentNode(nodeId, null, link);
    };

    tour.addEventListener('node-changed', ({ node }) => {
      hopCache.current = {};
      cbRef.current.onNodeChange?.(node);
    });

    // "Enter …" pins jump through their link.
    markers.addEventListener('select-marker', ({ marker }) => {
      const goto = marker.data?.goto;
      if (goto) goVia(goto);
    });

    let lastYaw = null;
    viewer.addEventListener('position-updated', ({ position }) => {
      if (!cbRef.current.onYaw) return;
      const y = Math.round(norm(position.yaw * R2D));
      if (y !== lastYaw) { lastYaw = y; cbRef.current.onYaw(y); }
    });

    viewer.addEventListener('click', ({ data }) => {
      if (data.rightclick || !cbRef.current.onPick) return;
      cbRef.current.onPick({ yaw: Math.round(norm(data.yaw * R2D)), pitch: Math.round(data.pitch * R2D) });
    });

    if (apiRef) {
      apiRef.current = {
        getNodeId: () => tour.getCurrentNode()?.id || null,
        goTo: (nodeId) => goVia(nodeId),
        // Street-View keyboard walking: take the arrow closest to where
        // you're looking (or to directly behind you for 'back').
        step: (direction = 'forward') => {
          const current = tour.getCurrentNode();
          if (!current?.links.length) return;
          const look = norm(viewer.getPosition().yaw * R2D + (direction === 'back' ? 180 : 0));
          let best = null;
          current.links.forEach((l) => {
            const gap = Math.abs(norm(l.data.yaw - look));
            if (gap <= 70 && (!best || gap < best.gap)) best = { l, gap };
          });
          if (best) tour.setCurrentNode(best.l.nodeId, null, best.l);
        },
      };
    }

    return () => {
      if (apiRef) apiRef.current = null;
      viewerRef.current = null;
      viewer.destroy();
    };
    // Viewer is created once per opened tour (PanoramaTour remounts on a new tour).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startNodeId]);

  return <div className="tour__view" ref={mountRef} />;
}