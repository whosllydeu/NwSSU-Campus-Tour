// ============================================================
// PanoramaTour — full-screen 360° tour, Google Street View style.
// Pure Three.js (dependency: `three`). On-floor chevron arrows,
// attribution chip, round controls, street-name label.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { TOURS } from "../static/ccisTour";
import { useUI } from "../context/UIContext";

export default function PanoramaTour() {
  const { tour, closeTour } = useUI();
  const data = tour ? TOURS[tour] : null;

  const mountRef = useRef(null);
  const stateRef = useRef({});
  const lastNavUpdateRef = useRef(0);

  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [menu, setMenu] = useState(false);
  const [nav, setNav] = useState({
    next: null,
    prev: null,
  });

  const nodes = data?.nodes;
  const base =
    (import.meta.env.BASE_URL || "/") + (data?.basePath || "");

  // ============================================================
  // THREE.JS PANORAMA INITIALIZATION
  // ============================================================

  useEffect(() => {
    if (!data || !mountRef.current) return;

    const mount = mountRef.current;
    const S = stateRef.current;

    // ----------------------------------------------------------
    // Scene
    // ----------------------------------------------------------

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      72,
      mount.clientWidth / mount.clientHeight,
      1,
      1100
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      mount.clientWidth,
      mount.clientHeight
    );

    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    mount.appendChild(renderer.domElement);

    // ----------------------------------------------------------
    // Panorama sphere
    // ----------------------------------------------------------

    const geo = new THREE.SphereGeometry(
      500,
      64,
      40
    );

    // Render the inside of the sphere.
    geo.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial();

    const sphere = new THREE.Mesh(
      geo,
      material
    );

    scene.add(sphere);

    // ----------------------------------------------------------
    // Three.js state
    // ----------------------------------------------------------

    Object.assign(S, {
      scene,
      camera,
      renderer,
      sphere,
      cache: {},
      lon: 0,
      lat: 0,
      drag: false,
      px: 0,
      py: 0,
      raf: 0,
      idx: 0,
      loadInto: null,
    });

    // ==========================================================
    // Helpers
    // ==========================================================

    const dirVec = (lonD, latD, radius) => {
      const phi = THREE.MathUtils.degToRad(
        90 - latD
      );

      const theta = THREE.MathUtils.degToRad(
        lonD
      );

      return new THREE.Vector3(
        radius *
          Math.sin(phi) *
          Math.cos(theta),

        radius *
          Math.cos(phi),

        radius *
          Math.sin(phi) *
          Math.sin(theta)
      );
    };

    const project = (lonD, latD) => {
      const fwd = dirVec(
        S.lon,
        S.lat,
        1
      ).normalize();

      const point = dirVec(
        lonD,
        latD,
        480
      );

      const dot = point
        .clone()
        .normalize()
        .dot(fwd);

      // Don't show the arrow if it is too far behind us.
      if (dot < 0.15) {
        return null;
      }

      const projected = point
        .clone()
        .project(camera);

      // Outside the camera's visible area.
      if (projected.z > 1) {
        return null;
      }

      return {
        x:
          (projected.x * 0.5 + 0.5) *
          mount.clientWidth,

        y:
          (-projected.y * 0.5 + 0.5) *
          mount.clientHeight,

        o: Math.min(
          1,
          (dot - 0.15) * 4
        ),
      };
    };

    // ==========================================================
    // Animation
    // ==========================================================

    const animate = () => {
      S.raf = requestAnimationFrame(animate);

      const phi = THREE.MathUtils.degToRad(
        90 - S.lat
      );

      const theta = THREE.MathUtils.degToRad(
        S.lon
      );

      camera.lookAt(
        500 *
          Math.sin(phi) *
          Math.cos(theta),

        500 *
          Math.cos(phi),

        500 *
          Math.sin(phi) *
          Math.sin(theta)
      );

      renderer.render(
        scene,
        camera
      );

      // --------------------------------------------------------
      // Update React navigation state at most ~15 FPS.
      //
      // Previously setNav() ran every animation frame (~60 FPS),
      // causing unnecessary React renders and React 19 warnings.
      // --------------------------------------------------------

      const now = performance.now();

      if (
        now - lastNavUpdateRef.current >
        66
      ) {
        lastNavUpdateRef.current = now;

        setNav({
          next: project(0, -32),
          prev: project(180, -32),
        });
      }
    };

    animate();

    // ==========================================================
    // Pointer controls
    // ==========================================================

    const dom = renderer.domElement;

    const down = (e) => {
      S.drag = true;

      S.px = e.clientX;
      S.py = e.clientY;

      dom.style.cursor = "grabbing";
    };

    const move = (e) => {
      if (!S.drag) return;

      S.lon -=
        (e.clientX - S.px) * 0.13;

      S.lat +=
        (e.clientY - S.py) * 0.13;

      S.lat = Math.max(
        -85,
        Math.min(85, S.lat)
      );

      S.px = e.clientX;
      S.py = e.clientY;
    };

    const up = () => {
      S.drag = false;
      dom.style.cursor = "grab";
    };

    // ==========================================================
    // Zoom
    // ==========================================================

    const wheel = (e) => {
      e.preventDefault();

      camera.fov = Math.max(
        35,
        Math.min(
          90,
          camera.fov + e.deltaY * 0.04
        )
      );

      camera.updateProjectionMatrix();
    };

    // ==========================================================
    // Resize
    // ==========================================================

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height
      );
    };

    // ==========================================================
    // Event listeners
    // ==========================================================

    dom.style.cursor = "grab";

    dom.addEventListener(
      "pointerdown",
      down
    );

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up
    );

    dom.addEventListener(
      "wheel",
      wheel,
      { passive: false }
    );

    window.addEventListener(
      "resize",
      resize
    );

    // ==========================================================
    // Texture loader
    // ==========================================================

    const textureLoader =
      new THREE.TextureLoader();

    S.loadInto = (i) =>
      new Promise((resolve, reject) => {
        if (!nodes[i]) {
          reject(
            new Error(
              `Panorama node ${i} does not exist.`
            )
          );

          return;
        }

        // Return cached texture.
        if (S.cache[i]) {
          resolve(S.cache[i]);
          return;
        }

        const file =
          base + nodes[i].file;

        textureLoader.load(
          file,

          (texture) => {
            if (
              "colorSpace" in texture
            ) {
              texture.colorSpace =
                THREE.SRGBColorSpace;
            }

            S.cache[i] = texture;

            resolve(texture);
          },

          undefined,

          (error) => {
            console.error(
              "Failed to load panorama:",
              file,
              error
            );

            reject(error);
          }
        );
      });

    // ==========================================================
    // Initial panorama
    // ==========================================================

    setIdx(0);
    S.idx = 0;

    if (nodes.length > 0) {
      S.loadInto(0)
      .then((texture) => {
        if (!S.sphere) return;

        S.sphere.material.map = texture;
        S.sphere.material.needsUpdate = true;

        setLoading(false);

        // Preload next panorama.
        if (nodes[1]) {
          S.loadInto(1).catch(() => {});
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load initial panorama:",
          error
        );

        setLoading(false);
      });
    }

    // ==========================================================
    // Cleanup
    // ==========================================================

    return () => {
      cancelAnimationFrame(
        S.raf
      );

      dom.removeEventListener(
        "pointerdown",
        down
      );

      window.removeEventListener(
        "pointermove",
        move
      );

      window.removeEventListener(
        "pointerup",
        up
      );

      dom.removeEventListener(
        "wheel",
        wheel
      );

      window.removeEventListener(
        "resize",
        resize
      );

      renderer.dispose();

      geo.dispose();
      material.dispose();

      if (dom.parentNode) {
        dom.parentNode.removeChild(
          dom
        );
      }

      Object.values(
        S.cache || {}
      ).forEach((texture) => {
        if (texture?.dispose) {
          texture.dispose();
        }
      });

      stateRef.current = {};
    };

    // The Three.js scene intentionally initializes
    // whenever the selected tour changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour]);

  // ============================================================
  // Navigate between panorama nodes
  // ============================================================

  const goTo = useCallback(
    (i) => {
      const S = stateRef.current;

      if (
        !S.loadInto ||
        !nodes[i]
      ) {
        return;
      }

      setCard(null);
      setMenu(false);
      setLoading(true);

      S.loadInto(i)
        .then((texture) => {
          if (!S.sphere) return;

          S.sphere.material.map =
            texture;

          S.sphere.material.needsUpdate =
            true;

          // Reset camera orientation.
          S.lon = 0;
          S.lat = 0;

          S.idx = i;

          setIdx(i);
          setLoading(false);

          // Preload next.
          if (nodes[i + 1]) {
            S.loadInto(
              i + 1
            ).catch(() => {});
          }

          // Preload previous.
          if (nodes[i - 1]) {
            S.loadInto(
              i - 1
            ).catch(() => {});
          }
        })
        .catch((error) => {
          console.error(
            "Failed to load panorama:",
            error
          );

          setLoading(false);
        });
    },
    [nodes]
  );

  // ============================================================
  // Keyboard controls
  // ============================================================

  useEffect(() => {
    if (!data) return;

    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        goTo(
          stateRef.current.idx + 1
        );
      } else if (e.key === "ArrowLeft") {
        goTo(
          stateRef.current.idx - 1
        );
      } else if (e.key === "Escape") {
        closeTour();
      }
    };

    window.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, [
    data,
    goTo,
    closeTour,
  ]);

  // ============================================================
  // Fullscreen
  // ============================================================

  const toggleFull = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ============================================================
  // No active tour
  // ============================================================

  if (!data) {
    return null;
  }

  const n = nodes[idx] || {};

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="gsv-root">
      {/* ======================================================
          Three.js panorama
          ====================================================== */}

      <div
        className="gsv-stage"
        ref={mountRef}
      />

      {/* ======================================================
          Loading
          ====================================================== */}

      {loading && (
        <div className="gsv-loader">
          <div className="gsv-spin" />
        </div>
      )}

      {/* ======================================================
          Attribution
          ====================================================== */}

      <div className="gsv-attrib">
        <span className="gsv-attrib-dot" />

        <span className="gsv-attrib-txt">
          <b>NwSSU</b> · {data.title}
        </span>
      </div>

      {/* ======================================================
          Round controls
          ====================================================== */}

      <div className="gsv-controls">
        <button
          className="gsv-round"
          onClick={() =>
            setMenu((m) => !m)
          }
          aria-label="Menu"
        >
          ⋮
        </button>

        <button
          className="gsv-round"
          onClick={closeTour}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ======================================================
          Menu
          ====================================================== */}

      {menu && (
        <div className="gsv-menu">
          <div className="gsv-menu-head">
            Stops
          </div>

          {nodes.map((node, i) => (
            <button
              key={i}
              className={`gsv-menu-item${
                i === idx
                  ? " active"
                  : ""
              }`}
              onClick={() =>
                goTo(i)
              }
            >
              <span className="gsv-menu-i">
                {node.star
                  ? "★"
                  : i + 1}
              </span>

              {node.title}
            </button>
          ))}

          <button
            className="gsv-menu-item ghost"
            onClick={toggleFull}
          >
            ⛶ Fullscreen
          </button>
        </div>
      )}

      {/* ======================================================
          Office info
          ====================================================== */}

      {n.office && (
        <button
          className="gsv-info"
          onClick={() =>
            setCard(n.office)
          }
        >
          ℹ️ {n.office.name}
        </button>
      )}

      {/* ======================================================
          Office information card
          ====================================================== */}

      {card && (
        <div className="gsv-card">
          <button
            className="gsv-card-x"
            onClick={() =>
              setCard(null)
            }
          >
            ×
          </button>

          <div className="gsv-card-tag">
            CCIS · Office
          </div>

          <h3>{card.name}</h3>

          <p>{card.text}</p>
        </div>
      )}

      {/* ======================================================
          Previous panorama arrow
          ====================================================== */}

      {nav.prev && idx > 0 && (
        <button
          className="gsv-nav back"
          style={{
            left: nav.prev.x,
            top: nav.prev.y,
            opacity: nav.prev.o,
          }}
          onClick={() =>
            goTo(idx - 1)
          }
          aria-label="Back"
        >
          <span className="gsv-chev">
            <svg viewBox="0 0 120 70">
              <path d="M12 20 L60 56 L108 20" />
            </svg>
          </span>
        </button>
      )}

      {/* ======================================================
          Next panorama arrow
          ====================================================== */}

      {nav.next &&
        idx < nodes.length - 1 && (
          <button
            className="gsv-nav fwd"
            style={{
              left: nav.next.x,
              top: nav.next.y,
              opacity: nav.next.o,
            }}
            onClick={() =>
              goTo(idx + 1)
            }
            aria-label="Forward"
          >
            <span className="gsv-chev">
              <svg viewBox="0 0 120 70">
                <path d="M12 50 L60 14 L108 50" />
              </svg>
            </span>
          </button>
        )}

      {/* ======================================================
          Street name
          ====================================================== */}

      <div className="gsv-street">
        {n.title}
      </div>
    </div>
  );
}
