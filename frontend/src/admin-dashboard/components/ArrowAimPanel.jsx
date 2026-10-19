import { useMemo, useState } from 'react';
import PanoAimViewer from './PanoAimViewer.jsx';

const normYaw = (d) => {
  const x = ((((d + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};
const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

export default function ArrowAimPanel({
  src,
  heading,
  view,
  links,
  targets,
  hasNext,
  hasPrev,
  nextLabel,
  prevLabel,
  onSetHeading,
  onSetView,
  onSetLinkYaw,
  onAddLink,
}) {
  const startYaw = isNum(view) ? Number(view) : isNum(heading) ? Number(heading) : 0;
  const [facing, setFacing] = useState(Math.round(normYaw(startYaw)));
  const [newTarget, setNewTarget] = useState('');

  const pins = useMemo(() => {
    const list = [];
    const forward = isNum(heading) ? Number(heading) : 0;
    if (isNum(view)) list.push({ id: 'aim-view', yaw: Number(view), label: 'Start view', kind: 'view' });
    if (hasNext) list.push({ id: 'aim-forward', yaw: forward, label: `Forward → ${nextLabel}`, kind: 'forward' });
    if (hasPrev) list.push({ id: 'aim-back', yaw: forward + 180, label: `Back (auto) → ${prevLabel}`, kind: 'back' });
    (links || []).forEach((l, i) => {
      if (!isNum(l.yaw)) return;
      const label = targets.find((t) => t.id === l.to)?.label || 'Extra arrow';
      list.push({ id: `aim-extra-${i}`, yaw: Number(l.yaw), label: `Extra → ${label}`, kind: 'extra' });
    });
    return list;
  }, [heading, view, links, targets, hasNext, hasPrev, nextLabel, prevLabel]);

  const addArrow = () => {
    if (!newTarget) return;
    onAddLink(newTarget, facing);
    setNewTarget('');
  };

  return (
    <div className="ad-aim">
      <PanoAimViewer src={src} startYaw={startYaw} pins={pins} onFacing={setFacing} />

      <p className="ad-field-help">
        Drag the photo until the centre line points where the arrow should go, then press a button below.
        Labels show where the arrows are now. Hold Ctrl + scroll to zoom.
      </p>

      <div className="ad-aim-actions">
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={!hasNext}
          title={hasNext ? '' : 'This is the last 360° image, so it has no forward arrow'}
          onClick={() => onSetHeading(facing)}
        >
          Set forward arrow here ({facing}°)
        </button>

        <button type="button" className="btn-ghost btn-sm" onClick={() => onSetView?.(facing)}>
          Set start view here ({facing}°)
        </button>

        {(links || []).map((l, i) => {
          const label = targets.find((t) => t.id === l.to)?.label;
          if (!label) return null;
          return (
            <button key={i} type="button" className="btn-ghost btn-sm" onClick={() => onSetLinkYaw(i, facing)}>
              Point arrow to “{label}” here
            </button>
          );
        })}
      </div>

      {targets.length > 0 && (links || []).length < 3 && (
        <div className="ad-aim-add">
          <select value={newTarget} onChange={(e) => setNewTarget(e.target.value)} aria-label="New arrow goes to">
            <option value="">New arrow goes to…</option>
            {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button type="button" className="btn-ghost btn-sm" disabled={!newTarget} onClick={addArrow}>
            + Add arrow here ({facing}°)
          </button>
        </div>
      )}
    </div>
  );
}