import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { buildingGallery } from '../utils/assets';
import '../stylesheets/gallery.css';

function formatCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(6) : '—';
}

function GalleryThumb({ item, name, active, onSelect }) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;

  const hasCoords = Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng));
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${Number(item.lat)},${Number(item.lng)}` : '';

  return (
    <figure className={`bg-item${active ? ' active' : ''}`}>
      <button
        type="button"
        className="bg-thumb"
        onClick={() => onSelect(item)}
        title={item.caption || `${name} photo`}
      >
        <img src={item.src} alt={item.caption || `${name} photo`} loading="lazy" onError={() => setErrored(true)} />
      </button>
      <figcaption>
        {item.caption && <span className="bg-caption">{item.caption}</span>}
        {hasCoords && (
          <a
            className="bg-coords"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open these coordinates in Google Maps"
          >
            <MapPin size={12} aria-hidden="true" />
            {formatCoord(item.lat)}, {formatCoord(item.lng)}
          </a>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Additional building images, each with its own coordinates.
 * By default a click opens the global lightbox; pass `onSelect` to
 * handle it yourself (e.g. inside an overlay that sits above the lightbox).
 */
export default function BuildingGallery({ building, title = '🖼️ Photo Gallery', onSelect, activeId }) {
  const { openLightbox } = useUI();
  const items = buildingGallery(building);
  if (items.length === 0) return null;

  const name = building?.name || 'Building';
  const handleSelect = onSelect || ((item) => {
    const coords = Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))
      ? ` · ${formatCoord(item.lat)}, ${formatCoord(item.lng)}`
      : '';
    openLightbox(item.src, `${item.caption || name}${coords}`);
  });

  return (
    <div className="ds-section bg-section">
      {title && <div className="ds-section-title">{title}</div>}
      <div className="bg-grid">
        {items.map((item) => (
          <GalleryThumb
            key={item.id}
            item={item}
            name={name}
            active={activeId === item.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}