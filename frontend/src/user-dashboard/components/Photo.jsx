import { useState } from 'react';
import { useUI } from '../context/UIContext';
import { img } from '../utils/assets';

const SIZE_CLASS = { hero: 'ds-photo-hero', card: 'ds-photo-card', dept: 'ds-photo-dept' };

function Placeholder({ emoji, color, name }) {
  return (
    <div className="ph-inner">
      <span className="ph-emoji">{emoji}</span>
      <span className="ph-label" style={{ color }}>{name}</span>
    </div>
  );
}

// `tourId` — when set, the photo becomes a virtual-tour launcher
// (clicking starts the 360° tour instead of enlarging the image).
export default function Photo({ photo, emoji, color, name, context = 'hero', tourId }) {
  const { openLightbox, openTour } = useUI();
  const [errored, setErrored] = useState(false);
  const cls = SIZE_CLASS[context] || SIZE_CLASS.hero;
  const src = img(photo);
  const hasImg = Boolean(src) && !errored;
  const isTour = Boolean(tourId);

  const activate = () => (isTour ? openTour(tourId) : hasImg ? openLightbox(src, name) : null);

  if (hasImg) {
    return (
      <div
        className={`${cls} has-img${isTour ? ' has-tour' : ''}`}
        onClick={activate}
        title={isTour ? 'Start virtual tour' : 'Click to enlarge'}
      >
        <img src={src} alt={name} onError={() => setErrored(true)} />
        {isTour ? (
          <>
            <div className="photo-tour-badge">🌐 360° Virtual Tour</div>
            <div className="photo-tour-hint">
              <div className="photo-tour-play">▶</div>
              <div className="photo-tour-label">Start Virtual Tour</div>
            </div>
          </>
        ) : (
          <div className="photo-zoom-hint">🔍 Click to enlarge</div>
        )}
      </div>
    );
  }

  // No image yet — still allow launching the tour if this is a tour location
  if (isTour) {
    return (
      <div className={`${cls} has-tour is-placeholder`} onClick={activate} title="Start virtual tour"
        style={{ background: `linear-gradient(135deg,${color}44,${color}22)` }}>
        <div className="photo-tour-badge">🌐 360° Virtual Tour</div>
        <div className="photo-tour-hint" style={{ opacity: 1 }}>
          <div className="photo-tour-play">▶</div>
          <div className="photo-tour-label">Start Virtual Tour</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cls} is-placeholder`} style={{ background: `linear-gradient(135deg,${color}44,${color}22)` }}>
      <Placeholder emoji={emoji} color={color} name={name} />
      <div className="photo-no-img-hint">📷 No photo yet</div>
    </div>
  );
}
