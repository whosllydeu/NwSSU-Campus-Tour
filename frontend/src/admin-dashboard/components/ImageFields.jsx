import { useEffect, useRef, useState } from 'react';
import LocationPicker from './LocationPicker.jsx';
import { resolveImage } from '../../user-dashboard/utils/assets';
import { ACCEPTED_IMAGE_TYPES, validateImageFile, validateUploadFile } from '../services/storage.service.js';
import { IMAGE_LIMITS, prepareImageForUpload, getPreparedInfo, formatBytes, isPanoramaSize } from '../utils/image-compress.js';
import '../styles/admin-images.css';

const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
const validLat = (v) => isNum(v) && Math.abs(Number(v)) <= 90;
const validLng = (v) => isNum(v) && Math.abs(Number(v)) <= 180;

const LIMIT_HINT = `JPG, PNG, WEBP or GIF · up to ${IMAGE_LIMITS.maxSourceMB} MB · large photos and 360° panoramas are optimised automatically`;

/**
 * Validates and optimises selected files one by one (keeps memory low
 * for big panoramas). Returns the ready files and any error messages.
 */
async function prepareFiles(files) {
  const ready = [];
  const problems = [];
  for (const file of files) {
    const before = validateImageFile(file);
    if (before) {
      problems.push(`${file.name}: ${before}`);
      continue;
    }
    try {
      const optimized = await prepareImageForUpload(file);
      const after = validateUploadFile(optimized);
      if (after) problems.push(`${file.name}: ${after}`);
      else ready.push(optimized);
    } catch (err) {
      problems.push(`${file.name}: ${err?.message || 'Could not process this image.'}`);
    }
  }
  return { ready, problems };
}

// "3.1 MB · 6144×3072 · 360° (was 24.8 MB)"
function fileSummary(file) {
  if (!file) return '';
  const info = getPreparedInfo(file);
  const parts = [formatBytes(file.size)];
  if (info?.width && info?.height) parts.push(`${info.width}×${info.height}`);
  if (info?.panorama) parts.push('360°');
  let text = parts.join(' · ');
  if (info?.optimized && info.originalBytes > file.size) text += ` (was ${formatBytes(info.originalBytes)})`;
  return text;
}

/* ──────────────────────────────────────────────────────────
   Single image upload (main building photo)
   value: { url: string, file: File|null, preview: string }
   ────────────────────────────────────────────────────────── */
export function ImageUploadField({ value, disabled, onSelectFile, onClear, onError }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const current = value?.preview || resolveImage(value?.url);
  const hasExistingOnly = !value?.file && Boolean(value?.url);
  const unresolvedLegacy = hasExistingOnly && !current;
  const busy = disabled || processing;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      const { ready, problems } = await prepareFiles([file]);
      if (ready[0]) onSelectFile(ready[0]);
      if (problems.length) onError(problems.join(' '));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="ad-upload">
      <div className={`ad-upload-preview${current ? ' has-img' : ''}`}>
        {current ? (
          <img src={current} alt="Building preview" />
        ) : (
          <span className="ad-upload-empty">
            {unresolvedLegacy ? `Current file: ${value.url}` : 'No photo selected'}
          </span>
        )}
        {value?.file && <span className="ad-upload-badge">New — uploads on save</span>}
        {processing && <span className="ad-upload-processing">Optimising image…</span>}
      </div>
      {value?.file && <span className="ad-upload-size">{fileSummary(value.file)}</span>}

      <div className="ad-upload-actions">
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {processing ? 'Optimising…' : current || value?.url ? 'Replace photo' : 'Choose photo'}
        </button>
        {(value?.file || value?.url) && (
          <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={onClear}>
            Remove
          </button>
        )}
        <span className="ad-upload-hint">{LIMIT_HINT}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        hidden
        onChange={handleFile}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Multiple images, each with its own coordinates
   items: [{ uid, id, url, path, file, preview, lat, lng, caption }]
   ────────────────────────────────────────────────────────── */
export function GalleryField({
  items,
  errors = {},
  disabled,
  buildingLat,
  buildingLng,
  onAddFiles,
  onReplaceFile,
  onChangeItem,
  onRemoveItem,
  onMoveItem,
  onError,
}) {
  const addRef = useRef(null);
  const replaceRef = useRef(null);
  const [replaceUid, setReplaceUid] = useState(null);
  const [pickingUid, setPickingUid] = useState(null);
  const [processing, setProcessing] = useState('');
  const busy = disabled || Boolean(processing);

  const hasBuildingCoords = validLat(buildingLat) && validLng(buildingLng);

  // Older images were saved without the 360° flag — detect it from the
  // image's 2:1 shape once, so the checkbox shows the right state.
  const detected = useRef(new Set());
  useEffect(() => {
    items.forEach((item) => {
      if (typeof item.panorama === 'boolean' || detected.current.has(item.uid)) return;
      const src = item.preview || resolveImage(item.url);
      if (!src) return;
      detected.current.add(item.uid);
      const img = new Image();
      img.onload = () => onChangeItem(item.uid, { panorama: isPanoramaSize(img.naturalWidth, img.naturalHeight) });
      img.src = src;
    });
  }, [items, onChangeItem]);

  const handleAdd = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setProcessing(files.length > 1 ? `Optimising ${files.length} images…` : 'Optimising image…');
    try {
      const { ready, problems } = await prepareFiles(files);
      if (ready.length) onAddFiles(ready);
      if (problems.length) onError(problems.join(' '));
    } finally {
      setProcessing('');
    }
  };

  const handleReplace = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const uid = replaceUid;
    setReplaceUid(null);
    if (!file || !uid) return;
    setProcessing('Optimising image…');
    try {
      const { ready, problems } = await prepareFiles([file]);
      if (ready[0]) onReplaceFile(uid, ready[0]);
      if (problems.length) onError(problems.join(' '));
    } finally {
      setProcessing('');
    }
  };

  return (
    <div className="ad-gallery">
      {items.length === 0 && (
        <p className="ad-gallery-empty">
          No additional images yet. Add photos of entrances, rooms or landmarks — each one gets its own coordinates.
        </p>
      )}

      {items.filter((i) => i.panorama === true).length > 1 && (
        <p className="ad-gallery-empty">
          360° panoramas are linked with arrows in this order (View 1 → View 2 → …). Use ↑ / ↓ to change the walking order.
        </p>
      )}

      {items.map((item, index) => {
        const src = item.preview || resolveImage(item.url);
        const itemErrors = errors[item.uid] || {};
        const isPicking = pickingUid === item.uid;

        return (
          <div className={`ad-gallery-item${itemErrors.lat || itemErrors.lng ? ' has-error' : ''}`} key={item.uid}>
            <div className="ad-gallery-row">
              <div className="ad-gallery-thumb">
                {src ? <img src={src} alt={item.caption || `Image ${index + 1}`} /> : <span>No preview</span>}
                {item.file && <span className="ad-upload-badge">New</span>}
                <span className="ad-gallery-order">{index + 1}</span>
              </div>

              <div className="ad-gallery-fields">
                {item.file && <span className="ad-upload-size">{fileSummary(item.file)}</span>}
                <label className="ad-gallery-label">
                  Caption
                  <input
                    type="text"
                    value={item.caption}
                    placeholder="e.g. Main entrance"
                    disabled={disabled}
                    onChange={(e) => onChangeItem(item.uid, { caption: e.target.value })}
                  />
                </label>

                <div className="ad-gallery-coords">
                  <label className="ad-gallery-label">
                    <span>Latitude<span className="ad-req">*</span></span>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={item.lat}
                      disabled={disabled}
                      onChange={(e) => onChangeItem(item.uid, { lat: e.target.value })}
                    />
                    {itemErrors.lat && <span className="ad-error">{itemErrors.lat}</span>}
                  </label>
                  <label className="ad-gallery-label">
                    <span>Longitude<span className="ad-req">*</span></span>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={item.lng}
                      disabled={disabled}
                      onChange={(e) => onChangeItem(item.uid, { lng: e.target.value })}
                    />
                    {itemErrors.lng && <span className="ad-error">{itemErrors.lng}</span>}
                  </label>
                </div>

                <label className="ad-gallery-check">
                  <input
                    type="checkbox"
                    checked={item.panorama === true}
                    disabled={disabled}
                    onChange={(e) => onChangeItem(item.uid, { panorama: e.target.checked })}
                  />
                  <span>360° panorama — opens in the map's "Open 360 Tour" for this building only</span>
                </label>

                {item.panorama === true && (
                  <label className="ad-gallery-label">
                    Forward arrow direction (°)
                    <input
                      type="number"
                      step="1"
                      min="-360"
                      max="360"
                      placeholder="0 = centre of the photo"
                      value={item.heading ?? ''}
                      disabled={disabled}
                      onChange={(e) => onChangeItem(item.uid, { heading: e.target.value })}
                    />
                    <span className="ad-field-help">
                      Where the arrow to the next view points. Open the tour, turn to face the next spot and copy the "Facing …°" number. The back arrow points the opposite way.
                    </span>
                    {itemErrors.heading && <span className="ad-error">{itemErrors.heading}</span>}
                  </label>
                )}

                {item.panorama === true && (
                  <ExtraArrows
                    item={item}
                    items={items}
                    error={itemErrors.links}
                    disabled={disabled}
                    onChange={(links) => onChangeItem(item.uid, { links })}
                  />
                )}

                <div className="ad-gallery-actions">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={disabled || index === 0}
                    title="Move up"
                    aria-label="Move image up"
                    onClick={() => onMoveItem?.(item.uid, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={disabled || index === items.length - 1}
                    title="Move down"
                    aria-label="Move image down"
                    onClick={() => onMoveItem?.(item.uid, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={disabled}
                    onClick={() => setPickingUid(isPicking ? null : item.uid)}
                  >
                    {isPicking ? 'Done picking' : 'Pick on map'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={disabled || !hasBuildingCoords}
                    title={hasBuildingCoords ? '' : 'Select the building location first'}
                    onClick={() => onChangeItem(item.uid, { lat: buildingLat, lng: buildingLng })}
                  >
                    Use building location
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={busy}
                    onClick={() => {
                      setReplaceUid(item.uid);
                      replaceRef.current?.click();
                    }}
                  >
                    Replace image
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm ad-gallery-remove"
                    disabled={disabled}
                    onClick={() => {
                      if (isPicking) setPickingUid(null);
                      onRemoveItem(item.uid);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {isPicking && (
              <div className="ad-gallery-picker">
                <LocationPicker
                  latitude={validLat(item.lat) ? item.lat : ''}
                  longitude={validLng(item.lng) ? item.lng : ''}
                  onChange={({ lat, lng }) => onChangeItem(item.uid, { lat, lng })}
                  helpText="Click the map where this photo was taken. Drag the marker to fine-tune."
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="ad-upload-actions">
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={busy}
          onClick={() => addRef.current?.click()}
        >
          {processing || '+ Add images'}
        </button>
        <span className="ad-upload-hint">You can select several files at once · {LIMIT_HINT}</span>
      </div>

      <input ref={addRef} type="file" accept={ACCEPT_ATTR} multiple hidden onChange={handleAdd} />
      <input ref={replaceRef} type="file" accept={ACCEPT_ATTR} hidden onChange={handleReplace} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Extra navigation arrows for one 360° image (junctions).
   Forward/back arrows come from the gallery order; these add
   up to 2 more so a view can have 3–4 directions in total.
   Each arrow: { to: <id of another 360° image>, yaw: degrees }
   ────────────────────────────────────────────────────────── */
const MAX_EXTRA_ARROWS = 2;

function ExtraArrows({ item, items, error, disabled, onChange }) {
  const links = Array.isArray(item.links) ? item.links : [];
  const selfId = item.id || item.uid;
  const targets = items
    .map((it, i) => ({ id: it.id || it.uid, label: it.caption || `Image ${i + 1}`, panorama: it.panorama }))
    .filter((t) => t.id !== selfId && t.panorama === true);

  const update = (index, patch) => onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const remove = (index) => onChange(links.filter((_, i) => i !== index));
  const add = () => onChange([...links, { to: '', yaw: '' }]);

  return (
    <div className="ad-gallery-label">
      <span>Extra arrows (for 3–4 way junctions)</span>
      {links.map((link, index) => (
        <div className="ad-gallery-coords" key={index}>
          <select
            value={link.to}
            disabled={disabled}
            onChange={(e) => update(index, { to: e.target.value })}
            aria-label="Arrow goes to"
          >
            <option value="">Goes to…</option>
            {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              step="1"
              min="-360"
              max="360"
              placeholder="Direction (°)"
              value={link.yaw}
              disabled={disabled}
              onChange={(e) => update(index, { yaw: e.target.value })}
              aria-label="Arrow direction in degrees"
            />
            <button type="button" className="btn-ghost btn-sm" disabled={disabled} onClick={() => remove(index)} aria-label="Remove arrow">✕</button>
          </div>
        </div>
      ))}
      {links.length < MAX_EXTRA_ARROWS && (
        <button type="button" className="btn-ghost btn-sm" disabled={disabled || targets.length === 0} onClick={add}>
          + Add arrow
        </button>
      )}
      <span className="ad-field-help">
        Use for a hallway or path that splits. Pick the image the arrow leads to and the direction (copy the "Facing …°" number). Add the matching arrow on that image too so users can come back.
      </span>
      {error && <span className="ad-error">{error}</span>}
    </div>
  );
}
