import { useEffect, useRef, useState } from 'react';
import BuildingTourEditor from './BuildingTourEditor.jsx';
import NameImagesDialog from './NameImagesDialog.jsx';
import {
  applyCoordinateRows,
  canWatchFiles,
  readCoordinateRows,
  saveCoordinateSheet,
  watchCoordinateSheet,
} from '../utils/coordsSheet.js';
import { resolveImage } from '../../user-dashboard/utils/assets';
import { ACCEPTED_IMAGE_TYPES, validateImageFile, validateUploadFile } from '../services/storage.service.js';
import { IMAGE_LIMITS, prepareImageForUpload, getPreparedInfo, formatBytes, isPanoramaSize } from '../utils/image-compress.js';
import '../styles/admin-images.css';

const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
const validLat = (v) => isNum(v) && Math.abs(Number(v)) <= 90;
const validLng = (v) => isNum(v) && Math.abs(Number(v)) <= 180;

const LIMIT_HINT = `JPG, PNG, WEBP or GIF · up to ${IMAGE_LIMITS.maxSourceMB} MB · large photos and 360° panoramas are optimised automatically`;

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

export function GalleryField({
  items,
  errors = {},
  disabled,
  buildingLat,
  buildingLng,
  buildingName,
  buildingAbbr,
  onAddFiles,
  onReplaceFile,
  onChangeItem,
  onRemoveItem,
  onMoveItem,
  onError,
}) {
  const addRef = useRef(null);
  const replaceRef = useRef(null);
  const sheetRef = useRef(null);
  const itemsRef = useRef(items);
  const [replaceUid, setReplaceUid] = useState(null);
  const [processing, setProcessing] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorStart, setEditorStart] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [sheetStatus, setSheetStatus] = useState('');
  const stopWatchRef = useRef(null);
  const busy = disabled || Boolean(processing);

  useEffect(() => { itemsRef.current = items; });
  useEffect(() => () => stopWatchRef.current?.(), []);

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

  const panoramaCount = items.filter((i) => i.panorama === true).length;
  const missingCoords = items.filter((i) => !validLat(i.lat) || !validLng(i.lng)).length;
  const errorCount = Object.values(errors || {}).filter((e) => e && Object.values(e).some(Boolean)).length;

  const openEditor = (uid = null) => {
    setEditorStart(uid);
    setEditorOpen(true);
  };

  const handleAdd = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setProcessing(files.length > 1 ? `Optimising ${files.length} images…` : 'Optimising image…');
    try {
      const { ready, problems } = await prepareFiles(files);
      if (ready.length) setPendingFiles(ready);
      if (problems.length) onError(problems.join(' '));
    } finally {
      setProcessing('');
    }
  };

  const confirmNames = (named) => {
    setPendingFiles(null);
    onAddFiles(named);
    setEditorOpen(true);
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

  const applyRows = (rows, source) => {
    const { applied, unknown } = applyCoordinateRows(rows, itemsRef.current, onChangeItem);
    const extra = unknown.length ? ` · ${unknown.length} name(s) not found: ${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? '…' : ''}` : '';
    setSheetStatus(`${source}: ${applied} coordinate${applied === 1 ? '' : 's'} applied${extra}`);
  };

  const downloadSheet = async () => {
    const base = String(buildingAbbr || buildingName || 'building').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'building';
    try {
      const handle = await saveCoordinateSheet(itemsRef.current, `${base}-coordinates.xlsx`);
      stopWatchRef.current?.();
      if (handle) {
        stopWatchRef.current = watchCoordinateSheet(handle, (rows) => applyRows(rows, 'Excel file saved'));
        setSheetStatus(`Watching ${handle.name} — fill in the Coordinates column, save the file, and the coordinates appear here.`);
      } else {
        setSheetStatus('Downloaded. Fill in the Coordinates column, save it, then click “Upload coordinates”.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') onError(err?.message || 'Could not create the Excel file.');
    }
  };

  const uploadSheet = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      applyRows(await readCoordinateRows(file), 'Uploaded file');
    } catch {
      onError('Could not read that file. Use the Excel file downloaded from here.');
    }
  };

  const sheetTools = {
    canWatch: canWatchFiles(),
    status: sheetStatus,
    onDownload: downloadSheet,
    onUpload: () => sheetRef.current?.click(),
  };

  return (
    <div className="ad-gallery">
      <div className="bte-launch">
        <button
          type="button"
          className="btn-primary"
          disabled={busy || items.length === 0}
          onClick={() => openEditor()}
        >
          🧭 Open 360° Tour Editor ({items.length} {items.length === 1 ? 'image' : 'images'}{panoramaCount ? ` · ${panoramaCount} × 360°` : ''})
        </button>
        <span className="ad-field-help">
          Names, coordinates, 360° start views and arrows are all edited inside the editor.
        </span>
        {(missingCoords > 0 || errorCount > 0) && items.length > 0 && (
          <span className="ad-error">
            {missingCoords > 0 ? `${missingCoords} image${missingCoords === 1 ? '' : 's'} still need${missingCoords === 1 ? 's' : ''} coordinates. ` : ''}
            {errorCount > 0 ? 'Open the editor to fix the highlighted images.' : ''}
          </span>
        )}
        {sheetStatus && <span className="ad-field-help bte-sheet-status">{sheetStatus}</span>}
      </div>

      {items.length === 0 ? (
        <p className="ad-gallery-empty">
          No additional images yet. Add photos of entrances, rooms or 360° views — you will name them and set their coordinates next.
        </p>
      ) : (
        <div className="bte-strip">
          {items.map((item, i) => {
            const src = item.preview || resolveImage(item.url);
            const bad = !validLat(item.lat) || !validLng(item.lng) || Boolean(errors[item.uid] && Object.values(errors[item.uid]).some(Boolean));
            return (
              <button
                type="button"
                key={item.uid}
                className={`bte-chip${bad ? ' is-bad' : ''}`}
                onClick={() => openEditor(item.uid)}
                title={bad ? 'Needs coordinates' : 'Open in editor'}
              >
                {src ? <img src={src} alt="" /> : <span className="bte-chip-empty">?</span>}
                <span>{item.caption || `Image ${i + 1}`}{item.panorama === true ? ' · 360°' : ''}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="ad-upload-actions">
        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => addRef.current?.click()}>
          {processing || '+ Add images'}
        </button>
        <span className="ad-upload-hint">You can select several files at once · {LIMIT_HINT}</span>
      </div>

      {pendingFiles && (
        <NameImagesDialog
          files={pendingFiles}
          existing={items}
          defaultBase={buildingAbbr}
          onCancel={() => setPendingFiles(null)}
          onConfirm={confirmNames}
        />
      )}

      {editorOpen && (
        <BuildingTourEditor
          items={items}
          errors={errors}
          startUid={editorStart}
          buildingName={buildingName}
          buildingLat={buildingLat}
          buildingLng={buildingLng}
          disabled={busy}
          sheet={sheetTools}
          onChangeItem={onChangeItem}
          onMoveItem={onMoveItem}
          onRemoveItem={onRemoveItem}
          onAddImages={() => addRef.current?.click()}
          onReplaceImage={(uid) => { setReplaceUid(uid); replaceRef.current?.click(); }}
          onClose={() => setEditorOpen(false)}
        />
      )}

      <input ref={addRef} type="file" accept={ACCEPT_ATTR} multiple hidden onChange={handleAdd} />
      <input ref={replaceRef} type="file" accept={ACCEPT_ATTR} hidden onChange={handleReplace} />
      <input ref={sheetRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={uploadSheet} />
    </div>
  );
}