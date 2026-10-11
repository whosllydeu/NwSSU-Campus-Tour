import { useState } from "react";
import { Building2 } from "lucide-react";
import { capitalize } from '../utils/helpers';
import { resolveImage } from "../utils/assets";
import { useUI } from "../context/UIContext";

function Thumb({ b }) {
  const { openLightbox } = useUI();
  const [errored, setErrored] = useState(false);
  const src = resolveImage(b.photo);
  const hasImg = Boolean(src) && !errored;

  if (hasImg) {
    return (
      <div
        className="bldg-thumb has-img"
        title="Click to enlarge photo"
        onClick={(e) => {
          e.stopPropagation();
          openLightbox(src, b.name);
        }}
      >
        <img src={src} alt={b.name} loading="lazy" onError={() => setErrored(true)} />
        <div className="thumb-zoom">🔍</div>
      </div>
    );
  }

  // Fallback when no photo has been uploaded yet.
  return (
    <div className="bldg-thumb" style={{ background: `linear-gradient(135deg,${b.color}40,${b.color}70)` }}>
      <Building2 size={52} strokeWidth={1.4} color="rgba(255,255,255,0.85)" aria-hidden="true" />
    </div>
  );
}

export default function BuildingCard({ b }) {
  const { openBuilding } = useUI();
  const desc = b.desc || '';
  return (
    <div className="bldg-card" data-type={b.type}
      onClick={() => openBuilding(b.id)}
    >
      <Thumb b={b} />
      <div className="bldg-info">
        <h3>{b.name}</h3>
        <p>{desc.length > 90 ? `${desc.slice(0, 90)}…` : desc}</p>
        <span className="bldg-tag">{capitalize(b.type)}{b.location ? ` · ${b.location}` : ''}</span>
      </div>
    </div>
  );
}