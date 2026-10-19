import { useMemo, useState } from 'react';
import { TOUR_NODES, TOURS, NODE_BY_ID, isPathwayNode, metersBetween } from '../../user-dashboard/static/nwssuTour';
import { resolveImage } from '../../user-dashboard/utils/assets';
import PanoAimViewer from './PanoAimViewer.jsx';
import { isBuiltInTourBuilding } from '../../user-dashboard/utils/adminTours';

// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_PATHWAY_LINK = { pathwayNode: '', entryImage: '', label: '', pinYaw: '', returnYaw: '', exitArrow: false, useUploadedTour: false };

// eslint-disable-next-line react-refresh/only-export-components
export function initialPathwayLinkValue(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PATHWAY_LINK };
  return {
    pathwayNode: raw.pathwayNode || '',
    entryImage: raw.entryImage || '',
    label: raw.label || '',
    pinYaw: raw.pinYaw ?? '',
    returnYaw: raw.returnYaw ?? '',
    exitArrow: raw.exitArrow === true,
    useUploadedTour: raw.useUploadedTour === true,
  };
}

const photoNumber = (id) => {
  const m = String(id).match(/(\d+)$/);
  return m ? Number(m[1]) : id;
};

const OPTION_STYLE = { color: '#111827', backgroundColor: '#ffffff' };

const isCoord = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

export default function PathwayLinkField({
  value,
  onChange,
  galleryItems = [],
  buildingLat,
  buildingLng,
  buildingName,
  recordId,
  disabled,
}) {
  const v = value || EMPTY_PATHWAY_LINK;
  const set = (patch) => onChange({ ...v, ...patch });
  const [aiming, setAiming] = useState(null);
  const [facing, setFacing] = useState(0);

  const hasCoords = isCoord(buildingLat) && isCoord(buildingLng);

  const options = useMemo(() => {
    const list = TOUR_NODES.filter((n) => isPathwayNode(n)).map((n) => {
      const distance = hasCoords && Array.isArray(n.data.gps)
        ? metersBetween([Number(buildingLat), Number(buildingLng)], n.data.gps)
        : null;
      const title = TOURS[n.data.tour]?.title || n.data.tour;
      return { id: n.id, title, number: photoNumber(n.id), distance };
    });
    return list.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return a.title.localeCompare(b.title) || String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
    });
  }, [hasCoords, buildingLat, buildingLng]);

  const closest = options.find((o) => o.distance !== null) || null;

  const panoramas = galleryItems
    .map((item, index) => ({ key: item.id || item.uid, item, index }))
    .filter(({ item }) => item.panorama === true);

  const pathNode = v.pathwayNode ? NODE_BY_ID[v.pathwayNode] : null;
  const entryItem = panoramas.find(({ key }) => key === v.entryImage)?.item || null;
  const entrySrc = entryItem ? entryItem.preview || resolveImage(entryItem.url) : '';
  const pinLabel = String(v.label || '').trim() || `Enter ${buildingName || 'building'}`;
  const num = (x) => (isCoord(x) ? Number(x) : null);

  const pathPins = useMemo(() => {
    if (!pathNode) return [];
    const list = (pathNode.links || [])
      .filter((l) => !String(l.nodeId).startsWith('admin-'))
      .map((l, i) => ({
        id: `p-${i}`,
        yaw: Number(l.data?.yaw) || 0,
        label: NODE_BY_ID[l.nodeId]?.name || 'Arrow',
        kind: 'back',
      }));
    if (num(v.pinYaw) !== null) list.push({ id: 'p-pin', yaw: num(v.pinYaw), label: pinLabel, kind: 'forward' });
    return list;
  }, [pathNode, v.pinYaw, pinLabel]);

  const entryPins = useMemo(() => {
    if (!entryItem) return [];
    const list = [];
    if (num(entryItem.heading) !== null) list.push({ id: 'e-fwd', yaw: num(entryItem.heading), label: 'Forward arrow', kind: 'back' });
    (entryItem.links || []).forEach((l, i) => {
      if (num(l.yaw) !== null) list.push({ id: `e-x${i}`, yaw: num(l.yaw), label: 'Extra arrow', kind: 'back' });
    });
    if (num(v.returnYaw) !== null) list.push({ id: 'e-exit', yaw: num(v.returnYaw), label: 'Exit to pathway', kind: 'extra' });
    return list;
  }, [entryItem, v.returnYaw]);

  const optionLabel = (o) => `${o.title} · photo ${o.number}${o.distance !== null ? ` (${Math.round(o.distance)} m away)` : ' (no GPS yet)'}`;

  const builtIn = Boolean(recordId && isBuiltInTourBuilding(recordId));
  const replaceToggle = builtIn && (
    <div className="ta-replace">
      <label className="ad-gallery-check">
        <input
          type="checkbox"
          checked={v.useUploadedTour === true}
          disabled={disabled}
          onChange={(e) => set({ useUploadedTour: e.target.checked })}
        />
        <span><b>Use the 360° photos uploaded above instead of the built-in tour</b></span>
      </label>
      <small className="ad-field-help">
        {v.useUploadedTour === true
          ? `The built-in tour for this building is hidden: “Open 360 Tour” shows the uploaded photos, and the pathway pins that led into the old photos are removed. Connect a pathway photo below so “Walk there!” can enter. Untick to bring the built-in tour back.`
          : 'This building has a built-in 360° tour (photos stored in the project). Tick this to replace it with photos you upload here.'}
      </small>
      {v.useUploadedTour === true && panoramas.length === 0 && (
        <small className="ad-error">Upload at least one image marked as a 360° panorama first.</small>
      )}
    </div>
  );

  if (builtIn && v.useUploadedTour !== true) return replaceToggle;

  const cell = { display: 'flex', flexDirection: 'column', gap: 4 };
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {replaceToggle}
      <div style={grid}>
        <label style={cell}>
          <span>Connect at pathway photo</span>
          <select
            value={v.pathwayNode}
            disabled={disabled}
            onChange={(e) => set({ pathwayNode: e.target.value })}
          >
            <option style={OPTION_STYLE} value="">— Not connected —</option>
            {options.map((o) => (
              <option style={OPTION_STYLE} key={o.id} value={o.id}>{optionLabel(o)}</option>
            ))}
          </select>
          {closest && v.pathwayNode !== closest.id && (
            <button
              type="button"
              className="btn-ghost"
              style={{ alignSelf: 'flex-start' }}
              disabled={disabled}
              onClick={() => set({ pathwayNode: closest.id })}
            >
              Use closest: {closest.title} · photo {closest.number} ({Math.round(closest.distance)} m)
            </button>
          )}
          {!hasCoords && <small className="ad-field-help">Pick the building location on the map to sort photos by distance.</small>}
        </label>

        <label style={cell}>
          <span>Entrance photo (first 360° image inside)</span>
          <select
            value={v.entryImage}
            disabled={disabled || !v.pathwayNode}
            onChange={(e) => set({ entryImage: e.target.value })}
          >
            <option style={OPTION_STYLE} value="">Select…</option>
            {panoramas.map(({ key, item, index }) => (
              <option style={OPTION_STYLE} key={key} value={key}>
                Image {index + 1}{item.caption ? ` — ${item.caption}` : ''}
              </option>
            ))}
          </select>
          {v.pathwayNode && panoramas.length === 0 && (
            <small className="ad-error">Upload at least one image marked as a 360° panorama in “Additional Images” above.</small>
          )}
        </label>
      </div>

      {v.pathwayNode && (
        <div style={grid}>
          <label style={cell}>
            <span>Pin label</span>
            <input
              type="text"
              value={v.label}
              placeholder={`Enter ${buildingName || 'building'}`}
              disabled={disabled}
              onChange={(e) => set({ label: e.target.value })}
            />
          </label>
          <label style={cell}>
            <span>Pin direction on the pathway photo (°)</span>
            <input
              type="number"
              step="any"
              value={v.pinYaw}
              placeholder="Automatic"
              disabled={disabled}
              onChange={(e) => set({ pinYaw: e.target.value })}
            />
          </label>
        </div>
      )}

      {pathNode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            className="btn-ghost btn-sm"
            style={{ alignSelf: 'flex-start' }}
            disabled={disabled}
            onClick={() => setAiming(aiming === 'pin' ? null : 'pin')}
          >
            {aiming === 'pin' ? 'Close 360 preview' : 'Aim the pin on the pathway photo'}
          </button>
          {aiming === 'pin' && (
            <div className="ad-aim">
              <PanoAimViewer
                src={pathNode.panorama}
                startYaw={num(v.pinYaw) ?? pathNode.data?.yaw ?? 0}
                pins={pathPins}
                onFacing={setFacing}
              />
              <p className="ad-field-help">
                Turn the pathway photo until the centre line points at the building entrance. Grey labels are the
                pathway's own arrows — keep the pin away from them.
              </p>
              <div className="ad-aim-actions">
                <button type="button" className="btn-ghost btn-sm" onClick={() => set({ pinYaw: String(facing) })}>
                  Put the pin here ({facing}°)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {v.pathwayNode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="ad-gallery-check">
            <input
              type="checkbox"
              checked={v.exitArrow === true}
              disabled={disabled}
              onChange={(e) => set({ exitArrow: e.target.checked })}
            />
            <span>Show an exit arrow back to the pathway on the entrance photo</span>
          </label>
          <small className="ad-field-help">
            Off: inside the building only the arrows you set on the 360° images are shown.
          </small>
          {v.exitArrow === true && (
            <>
              <div style={grid}>
                <label style={cell}>
                  <span>Exit arrow direction (°)</span>
                  <input
                    type="number"
                    step="any"
                    value={v.returnYaw}
                    placeholder="Automatic"
                    disabled={disabled}
                    onChange={(e) => set({ returnYaw: e.target.value })}
                  />
                </label>
              </div>
              {entrySrc && (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                  disabled={disabled}
                  onClick={() => setAiming(aiming === 'exit' ? null : 'exit')}
                >
                  {aiming === 'exit' ? 'Close 360 preview' : 'Aim the exit arrow on the entrance photo'}
                </button>
              )}
              {aiming === 'exit' && entrySrc && (
                <div className="ad-aim">
                  <PanoAimViewer
                    src={entrySrc}
                    startYaw={num(v.returnYaw) ?? ((num(entryItem.heading) ?? 0) + 180)}
                    pins={entryPins}
                    onFacing={setFacing}
                  />
                  <div className="ad-aim-actions">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => set({ returnYaw: String(facing) })}>
                      Put the exit arrow here ({facing}°)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <small className="ad-field-help">
        The pin direction is optional, but if it is left blank the pin is placed automatically and may not face the
        entrance — use “Aim the pin on the pathway photo” to set it. “Walk there!” faces the pin when it reaches this
        pathway photo. The building’s 360° images are walked in the order shown in “Additional Images”.
      </small>
    </div>
  );
}