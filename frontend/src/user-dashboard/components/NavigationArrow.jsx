// ============================================================
// NavigationArrow — Google-Maps-style heading indicator.
// Smoothly interpolates rotation toward `heading` (shortest path,
// handles the 359°→0° wrap) and renders a soft directional
// motion-blur trail while rotating or moving quickly.
//
// Usage:
//   <NavigationArrow heading={userHeadingDegrees} moving={isWalking} />
// ============================================================
import { useEffect, useRef, useState } from 'react';

// Shortest signed angular difference a -> b, in degrees, range (-180, 180].
function angleDiff(a, b) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export default function NavigationArrow({ heading = 0, moving = false, size = 44, color = '#1a73e8' }) {
  const [display, setDisplay] = useState(heading);
  const [blur, setBlur] = useState(0);
  const S = useRef({ display: heading, blur: 0, raf: 0, last: 0 }).current;

  useEffect(() => {
    if (!S.last) S.last = performance.now(); // seed on first run only, not during render

    const tick = (now) => {
      const dt = Math.min(0.05, (now - S.last) / 1000); // clamp so tab-switches don't jump
      S.last = now;

      // Spring-like smoothing toward target heading, always the short way round.
      const diff = angleDiff(S.display, heading);
      const angularVelocity = diff / Math.max(dt, 0.001); // deg/sec, pre-damping
      const ease = 1 - Math.pow(0.001, dt);               // frame-rate independent
      S.display += diff * ease;

      // Blur ramps up with turn speed (or flat movement), then eases back —
      // this is what gives the "settling" feel instead of blur snapping on/off.
      const targetBlur = Math.min(6, Math.abs(angularVelocity) * 0.012 + (moving ? 1.5 : 0));
      S.blur += (targetBlur - S.blur) * Math.min(1, dt * 10);

      setDisplay(S.display);
      setBlur(S.blur);
      S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(S.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heading, moving]);

  const trailOpacity = Math.min(0.5, blur / 6);
  const stretch = moving ? 1.06 : 1; // slight forward elongation while walking

  return (
    <div
      className="nav-arrow-wrap"
      style={{ width: size, height: size, transform: `rotate(${display}deg) scaleY(${stretch})` }}
    >
      {trailOpacity > 0.02 && (
        <>
          <ArrowGlyph size={size} color={color} style={{ transform: 'rotate(-6deg) scale(0.96)', opacity: trailOpacity * 0.6, filter: `blur(${blur.toFixed(2)}px)` }} />
          <ArrowGlyph size={size} color={color} style={{ transform: 'rotate(-3deg) scale(0.98)', opacity: trailOpacity * 0.85, filter: `blur(${(blur * 0.6).toFixed(2)}px)` }} />
        </>
      )}
      <ArrowGlyph size={size} color={color} style={{ filter: `blur(${(blur * 0.35).toFixed(2)}px)` }} />
    </div>
  );
}

function ArrowGlyph({ size, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0, ...style }}>
      {/* soft accuracy halo, like the ring under a Google Maps blue dot */}
      <circle cx="24" cy="24" r="20" fill={color} opacity="0.15" />
      {/* chevron pointing "up" at rotation 0 */}
      <path
        d="M24 6 L37 34 C37.6 35.3 36.2 36.6 34.9 35.9 L24 30.2 L13.1 35.9 C11.8 36.6 10.4 35.3 11 34 Z"
        fill={color} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}