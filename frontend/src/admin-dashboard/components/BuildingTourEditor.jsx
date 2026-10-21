import { useState } from 'react';
import { createPortal } from 'react-dom';
import PanoAimViewer from './PanoAimViewer.jsx';
import LocationPicker from './LocationPicker.jsx';
import { resolveImage } from '../../user-dashboard/utils/assets';
import '../styles/tours-admin.css';

const MAX_EXTRA_ARROWS = 3;

const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
const validLat = (v) => isNum(v) && Math.abs(Number(v)) <= 90;
const validLng = (v) => isNum(v) && Math.abs(Number(v)) <= 180;
const norm = (d) => {
  const x = ((((d + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};

export default function BuildingTourEditor({
  items,
  errors = {},
  startUid = null,
  buildingName,
  buildingLat,
  buildingLng,
  disabled,
  sheet,
  onChangeItem,
  onMoveItem,
  onRemoveItem,
  onAddImages,
  onReplaceImage,
  onClose,
  headerActions = null,
  note = 'changes are saved when you click Save on the building',
}) {
  const [selectedUid, setSelectedUid] = useState(startUid || items[0]?.uid || null);
  const [facing, setFacing] = useState(0);
  const [newTarget, setNewTarget] = useState('');
  const [picking, setPicking] = useState(false);
  const [checked, setChecked] = useState(() => new Set());
  const checkedIds = items.filter((it) => checked.has(it.uid)).map((it) => it.uid);
  const allChecked = items.length > 0 && checkedIds.length === items.length;
  const toggleCheck = (uid) => setChecked((prev) => {
    const next = new Set(prev);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    return next;
  });
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(items.map((it) => it.uid)));
  const deleteChecked = () => {
    if (!checkedIds.length) return;
    const n = checkedIds.length;
    if (!window.confirm(`Delete ${n} selected image${n === 1 ? '' : 's'} from this building? They are removed when you save the building.`)) return;
    const remaining = items.filter((it) => !checked.has(it.uid));
    checkedIds.forEach((uid) => onRemoveItem(uid));
    setChecked(new Set());
    if (!remaining.some((it) => it.uid === selectedUid)) setSelectedUid(remaining[0]?.uid || null);
  };

  const keyOf = (it) => it.id || it.uid;
  const labelOf = (it) => it.caption || `Image ${items.indexOf(it) + 1}`;
  const item = items.find((it) => it.uid === selectedUid) || items[0] || null;
  const itemErrors = (item && errors[item.uid]) || {};
  const src = item ? item.preview || resolveImage(item.url) : '';
  const hasBuildingCoords = validLat(buildingLat) && validLng(buildingLng);

  const panoramas = items.filter((it) => it.panorama === true);
  const isPano = item?.panorama === true;
  const pIndex = isPano ? panoramas.indexOf(item) : -1;
  const next = isPano && !item.end ? panoramas[pIndex + 1] : null;
  const prev = pIndex > 0 && !panoramas[pIndex - 1].end ? panoramas[pIndex - 1] : null;
  const isLastPano = isPano && pIndex === panoramas.length - 1;
  const forward = item && isNum(item.heading) ? Number(item.heading) : 0;
  const backIsAuto = !(item && isNum(item.back));
  const backYaw = backIsAuto ? norm(forward + 180) : Number(item.back);
  const links = item && Array.isArray(item.links) ? item.links : [];
  const targets = isPano ? panoramas.filter((it) => it !== item) : [];
  const targetLabel = (key) => {
    const t = panoramas.find((it) => keyOf(it) === key);
    return t ? labelOf(t) : 'Missing image';
  };

  const pins = [];
  if (isPano) {
    if (isNum(item.view)) pins.push({ id: 'view', yaw: Number(item.view), label: 'Start view', kind: 'view' });
    if (next) pins.push({ id: 'fwd', yaw: forward, label: `Forward → ${labelOf(next)}`, kind: 'forward' });
    if (prev) pins.push({ id: 'back', yaw: backYaw, label: `Back → ${labelOf(prev)}`, kind: 'back' });
    links.forEach((l, i) => {
      if (isNum(l.yaw)) pins.push({ id: `x${i}`, yaw: Number(l.yaw), label: `→ ${targetLabel(l.to)}`, kind: 'extra' });
    });
  }

  const set = (patch) => item && onChangeItem(item.uid, patch);
  const setLink = (i, patch) => set({ links: links.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const removeLink = (i) => set({ links: links.filter((_, j) => j !== i) });
  const addLink = () => {
    if (!newTarget) return;
    set({ links: [...links, { to: newTarget, yaw: String(facing) }] });
    setNewTarget('');
  };
  const select = (uid) => {
    setSelectedUid(uid);
    setNewTarget('');
    setPicking(false);
  };
  const openTarget = (key) => {
    const t = items.find((it) => keyOf(it) === key);
    if (t) select(t.uid);
  };
  const removeCurrent = () => {
    if (!item) return;
    if (!window.confirm(`Remove "${labelOf(item)}" from this building?`)) return;
    const idx = items.indexOf(item);
    const fallback = items[idx + 1] || items[idx - 1] || null;
    onRemoveItem(item.uid);
    setSelectedUid(fallback ? fallback.uid : null);
  };

  const stop = (e) => e.stopPropagation();
  const needsCoords = (it) => !validLat(it.lat) || !validLng(it.lng);

  return createPortal(
    <div className="bte-overlay" onClick={stop} onMouseDown={stop}>
      <div className="bte-box" role="dialog" aria-label="360° tour editor">
        <div className="bte-head">
          <div>
            <h2>360° Tour Editor</h2>
            <span className="ad-muted ta-small">{buildingName || 'Building'} · {note}</span>
          </div>
          <div className="ta-actions bte-head-actions">
            {headerActions}
            <button type="button" className={headerActions ? 'btn-ghost' : 'btn-primary'} onClick={onClose}>
              {headerActions ? 'Close' : 'Done'}
            </button>
          </div>
        </div>

        <div className="ta-layout bte-layout">
          <div className="ad-panel ta-side">
            {(onAddImages || sheet) && (
              <div className="bte-tools">
                {onAddImages && <button type="button" className="btn-ghost btn-sm" disabled={disabled} onClick={onAddImages}>+ Add images</button>}
                {sheet && <button type="button" className="btn-ghost btn-sm" disabled={items.length === 0} onClick={sheet.onDownload}>⬇ Coordinates in Excel</button>}
                {sheet && <button type="button" className="btn-ghost btn-sm" disabled={items.length === 0} onClick={sheet.onUpload}>⬆ Upload coordinates</button>}
              </div>
            )}
            {sheet && (
              <p className="ad-field-help bte-sheet-status">
                {sheet.status || (sheet.canWatch
                  ? 'Save the Excel file somewhere, type the coordinates (e.g. 12.0709, 124.5966), save it, and they appear here automatically.'
                  : 'Download the Excel file, type the coordinates (e.g. 12.0709, 124.5966), save it, then upload it here.')}
              </p>
            )}
            {onRemoveItem && items.length > 0 && (
              <div className="bte-select-bar">
                <label className="ad-gallery-check">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  <span>{checkedIds.length ? `${checkedIds.length} selected` : 'Select images'}</span>
                </label>
                {checkedIds.length > 0 && (
                  <>
                    <button type="button" className="btn-ghost btn-sm ad-gallery-remove" disabled={disabled} onClick={deleteChecked}>
                      🗑 Delete {checkedIds.length} selected
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setChecked(new Set())}>Clear</button>
                  </>
                )}
              </div>
            )}
            <p className="ad-muted ta-small">{items.length} images · {panoramas.length} × 360° · list order = walking order</p>
            <ol className="ta-nodes">
              {items.map((it, i) => {
                const thumb = it.preview || resolveImage(it.url);
                const bad = needsCoords(it) || Boolean(errors[it.uid] && Object.values(errors[it.uid]).some(Boolean));
                return (
                  <li key={it.uid} className={`bte-node-row${checked.has(it.uid) ? ' is-checked' : ''}`}>
                    {onRemoveItem && (
                      <input
                        type="checkbox"
                        className="bte-check"
                        checked={checked.has(it.uid)}
                        onChange={() => toggleCheck(it.uid)}
                        aria-label={`Select ${labelOf(it)}`}
                      />
                    )}
                    <button
                      type="button"
                      className={`ta-node${item && it.uid === item.uid ? ' active' : ''}${bad ? ' is-bad' : ''}`}
                      onClick={() => select(it.uid)}
                    >
                      {thumb && <img className="bte-thumb" src={thumb} alt="" />}
                      <span className="ta-node-name">{i + 1}. {labelOf(it)}</span>
                      {it.panorama === true && <span className="ta-badge bte-badge-360">360°</span>}
                      {it.end && <span className="ta-badge">end</span>}
                      {bad && <span className="ta-badge bte-badge-bad">no coords</span>}
                    </button>
                    <span className="bte-move">
                      <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => onMoveItem?.(it.uid, -1)} aria-label="Move up">↑</button>
                      <button type="button" className="btn-ghost btn-sm" disabled={i === items.length - 1} onClick={() => onMoveItem?.(it.uid, 1)} aria-label="Move down">↓</button>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {!item ? (
            <div className="ad-panel ta-main"><p className="ad-muted">Add images to start.</p></div>
          ) : (
            <div className="ad-panel ta-main">
              <div className="ta-row bte-name-row">
                <label className="ta-field bte-name">
                  <span>Image name</span>
                  <input type="text" value={item.caption || ''} placeholder={`Image ${items.indexOf(item) + 1}`} onChange={(e) => set({ caption: e.target.value })} />
                </label>
                <span className="ta-node-id">image {items.indexOf(item) + 1} of {items.length}</span>
              </div>

              <div className="ta-section">
                <h3>Coordinates</h3>
                <div className="ta-row">
                  <label className="ta-field">
                    <span>Latitude</span>
                    <input type="number" step="any" value={item.lat ?? ''} onChange={(e) => set({ lat: e.target.value })} />
                  </label>
                  <label className="ta-field">
                    <span>Longitude</span>
                    <input type="number" step="any" value={item.lng ?? ''} onChange={(e) => set({ lng: e.target.value })} />
                  </label>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setPicking((p) => !p)}>
                    {picking ? 'Done picking' : 'Pick on map'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={!hasBuildingCoords}
                    title={hasBuildingCoords ? '' : 'Select the building location first'}
                    onClick={() => set({ lat: buildingLat, lng: buildingLng })}
                  >
                    Use building location
                  </button>
                </div>
                {(itemErrors.lat || itemErrors.lng) && <span className="ad-error">{itemErrors.lat || itemErrors.lng}</span>}
                {picking && (
                  <div className="ad-gallery-picker">
                    <LocationPicker
                      latitude={validLat(item.lat) ? item.lat : ''}
                      longitude={validLng(item.lng) ? item.lng : ''}
                      onChange={({ lat, lng }) => set({ lat, lng })}
                      helpText="Click the map where this photo was taken. Drag the marker to fine-tune."
                    />
                  </div>
                )}
              </div>

              <div className="ta-section">
                <label className="ad-gallery-check">
                  <input type="checkbox" checked={isPano} onChange={(e) => set({ panorama: e.target.checked })} />
                  <span>360° panorama — part of this building's 360° tour</span>
                </label>
              </div>

              {!isPano && src && (
                <div className="ta-section">
                  <img className="bte-flat" src={src} alt={labelOf(item)} />
                </div>
              )}

              {isPano && (
                <>
                  <div className="ad-aim">
                    <PanoAimViewer
                      key={item.uid}
                      src={src}
                      startYaw={isNum(item.view) ? Number(item.view) : forward}
                      pins={pins}
                      onFacing={setFacing}
                    />
                    <p className="ad-field-help">
                      Drag the photo so the centre line points where an arrow should be, then press “Aim here”.
                      Green = forward, grey = back, orange = extra arrow, blue = start view. Hold Ctrl + scroll to zoom.
                    </p>
                  </div>

                  <div className="bte-controls">
                  <div className="ta-section">
                    <h3>Start view</h3>
                    <div className="ta-row">
                      <span className="ta-row-label">Direction the photo faces when it opens (blank = forward arrow)</span>
                      <input type="number" step="any" value={item.view ?? ''} placeholder="auto" onChange={(e) => set({ view: e.target.value })} />
                      <button type="button" className="btn-ghost btn-sm" onClick={() => set({ view: String(facing) })}>
                        Use current view ({facing}°)
                      </button>
                    </div>
                  </div>

                  <div className="ta-section">
                    <h3>Arrows on this photo</h3>

                    <div className="ta-row">
                      <span className="ta-dot is-forward">F</span>
                      <span className="ta-row-label">
                        Forward → {next ? labelOf(next) : <em>none ({isLastPano ? 'last 360° photo' : 'end of path'})</em>}
                      </span>
                      <input type="number" step="any" value={item.heading ?? ''} placeholder="0" disabled={!next} onChange={(e) => set({ heading: e.target.value })} />
                      <button type="button" className="btn-ghost btn-sm" disabled={!next} onClick={() => set({ heading: String(facing) })}>
                        Aim here ({facing}°)
                      </button>
                      {next && <button type="button" className="btn-ghost btn-sm" onClick={() => select(next.uid)}>Open</button>}
                    </div>

                    {!isLastPano && (
                      <label className="ad-gallery-check">
                        <input type="checkbox" checked={item.end === true} onChange={(e) => set({ end: e.target.checked })} />
                        <span>End of this path — no forward arrow to the next 360° photo</span>
                      </label>
                    )}

                    <div className="ta-row">
                      <span className="ta-dot bte-dot-back">B</span>
                      <span className="ta-row-label">
                        Back → {prev ? labelOf(prev) : <em>none (first 360° photo)</em>}
                        {prev && backIsAuto && <span className="ta-node-id"> · auto, opposite of forward</span>}
                      </span>
                      <input type="number" step="any" value={item.back ?? ''} placeholder={String(Math.round(norm(forward + 180)))}
                        disabled={!prev} aria-label="Back arrow direction" onChange={(e) => set({ back: e.target.value })} />
                      <button type="button" className="btn-ghost btn-sm" disabled={!prev} onClick={() => set({ back: String(facing) })}>
                        Aim here ({facing}°)
                      </button>
                      {prev && !backIsAuto && (
                        <button type="button" className="btn-ghost btn-sm" title="Go back to automatic (opposite of forward)" onClick={() => set({ back: '' })}>Auto</button>
                      )}
                      {prev && <button type="button" className="btn-ghost btn-sm" onClick={() => select(prev.uid)}>Open</button>}
                    </div>

                    {links.map((l, i) => (
                      <div className="ta-row" key={`${l.to}-${i}`}>
                        <span className="ta-dot is-extra">{i + 1}</span>
                        <span className="ta-row-label">→ {targetLabel(l.to)}</span>
                        <input type="number" step="any" value={l.yaw} onChange={(e) => setLink(i, { yaw: e.target.value })} />
                        <button type="button" className="btn-ghost btn-sm" onClick={() => setLink(i, { yaw: String(facing) })}>
                          Aim here ({facing}°)
                        </button>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => openTarget(l.to)}>Open</button>
                        <button type="button" className="btn-ghost btn-sm ad-gallery-remove" onClick={() => removeLink(i)}>Remove</button>
                      </div>
                    ))}

                    {links.length < MAX_EXTRA_ARROWS && targets.length > 0 && (
                      <div className="ad-aim-add">
                        <select value={newTarget} onChange={(e) => setNewTarget(e.target.value)} aria-label="New arrow goes to">
                          <option value="">New arrow goes to…</option>
                          {targets.map((t) => <option key={t.uid} value={keyOf(t)}>{labelOf(t)}</option>)}
                        </select>
                        <button type="button" className="btn-ghost btn-sm" disabled={!newTarget} onClick={addLink}>
                          + Add arrow here ({facing}°)
                        </button>
                      </div>
                    )}
                    <p className="ad-field-help">
                      Extra arrows are for side paths such as stairs or another hallway. Add the matching arrow on the
                      other photo so users can come back. If the automatic back arrow points the wrong way, add an extra
                      arrow to the previous photo — or aim the Back arrow above.
                    </p>
                  </div>
                  </div>
                </>
              )}

              {(onReplaceImage || onRemoveItem) && (
                <div className="ta-actions">
                  {onReplaceImage && <button type="button" className="btn-ghost btn-sm" disabled={disabled} onClick={() => onReplaceImage(item.uid)}>Replace image</button>}
                  {onRemoveItem && <button type="button" className="btn-ghost btn-sm ad-gallery-remove" disabled={disabled} onClick={removeCurrent}>Remove image</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}