import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { useCallback, useEffect, useMemo } from "react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import "../stylesheets/SphereTour.css";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export const SphereTour = ({ nodes, startNodeId }) => {

  const plugins = useMemo(() => [
    [MarkersPlugin],
    [
      VirtualTourPlugin,
      {
        nodes,
        startNodeId: startNodeId || nodes[0].id,
        positionMode: "manual",
        renderMode: "3d",
        preload: true,
        showPanel: false,
        transitionOptions: {
          rotation: false,
          effect: "fade",
          rotateTo: {
            yaw: "0deg",
            pitch: "0deg"
          }
        },
      }
    ]
  ], [nodes, startNodeId]);

  useEffect(() => {
    console.log(startNodeId);
  }, [startNodeId]);

  const handleReady = useCallback((instance) => {
    // const tour = instance.getPlugin(VirtualTourPlugin);
    // tour.addEventListener("node-changed", ({ node }) => setCurrentId(node.id));

    // Dev helper: click a spot in the panorama, copy yaw/pitch from the console.
    // Remove before shipping.
    instance.addEventListener("click", ({ data }) => {
      const deg = (r) => ((r * 180) / Math.PI).toFixed(1);
      console.log(`yaw: "${deg(data.yaw)}deg", pitch: "${deg(data.pitch)}deg"`);
    });
  }, []);

  return (
    <div className="tour__view">
      <ReactPhotoSphereViewer
        width="100%"
        height="100%"
        plugins={plugins}
        onReady={handleReady}
      />
    </div>
  );
}

export const TourOverlay = ({ nodes, startNodeId, onClose }) => {
  return createPortal(
    <div className="tour-overlay">
      <SphereTour
        nodes={nodes}
        startNodeId={startNodeId}
      />

      <button
        className="tour-close"
        onClick={onClose}
        aria-label="Close virtual tour"
      >
        <X size={24} />
      </button>
    </div>,
    document.body
  );
};