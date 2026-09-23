import { useState } from "react";
import { capitalize } from '../utils/helpers';
import { img } from "../utils/assets";
import { useUI } from "../context/UIContext";

function Thumb({ b }) {
  const { openLightbox } = useUI();
  const [errored, setErrored] = useState(false);
  const src = img(b.photo);
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

  return (
    <div className="bldg-thumb" style={{ background: `linear-gradient(135deg,${b.color}40,${b.color}70)` }}>
      <span style={{ fontSize: 52 }}>{b.emoji}</span>
    </div>
  );
}

export default function BuildingCard({ b }) {
  const { openBuilding } = useUI();
  return (
    <div className="bldg-card" data-type={b.type} 
      onClick={() => openBuilding(b.id)}
    >
      <Thumb b={b} />
      <div className="bldg-info">
        <h3>{b.name}</h3>
        <p>{b.desc.slice(0, 90)}…</p>
        <span className="bldg-tag">{capitalize(b.type)} · {b.location}</span>
      </div>
    </div>
  );
}
