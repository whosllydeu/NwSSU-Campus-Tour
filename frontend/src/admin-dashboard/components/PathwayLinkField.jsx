import { useMemo } from 'react';
import { TOUR_NODES, TOURS, isPathwayNode, metersBetween } from '../../user-dashboard/static/nwssuTour';
import { isBuiltInTourBuilding } from '../../user-dashboard/utils/adminTours';

// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_PATHWAY_LINK = { pathwayNode: '', entryImage: '', label: '', pinYaw: '', returnYaw: '' };

// eslint-disable-next-line react-refresh/only-export-components
export function initialPathwayLinkValue(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PATHWAY_LINK };
  return {
    pathwayNode: raw.pathwayNode || '',
    entryImage: raw.entryImage || '',
    label: raw.label || '',
    pinYaw: raw.pinYaw ?? '',
    returnYaw: raw.returnYaw ?? '',
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

  const optionLabel = (o) => `${o.title} · photo ${o.number}${o.distance !== null ? ` (${Math.round(o.distance)} m away)` : ' (no GPS yet)'}`;

  if (recordId && isBuiltInTourBuilding(recordId)) {
    return (
      <div className="ad-field-help">
        This building already has a built-in 360° tour connected to the pathways, so nothing needs to be set here.
      </div>
    );
  }

  const cell = { display: 'flex', flexDirection: 'column', gap: 4 };
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <label style={cell}>
            <span>“Back to pathway” arrow direction (°)</span>
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
      )}

      <small className="ad-field-help">
        Directions are optional: leave them blank and the pin is placed automatically. To fine-tune, open the
        pathway photo in the 360° tour, tap 🧭, face the building entrance and copy the “yaw” number here.
        The building’s 360° images are walked in the order shown in “Additional Images”.
      </small>
    </div>
  );
}