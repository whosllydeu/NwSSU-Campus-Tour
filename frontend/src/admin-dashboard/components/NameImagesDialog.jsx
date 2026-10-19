import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function guessBase(existing, fallback) {
  const counts = {};
  (existing || []).forEach((it) => {
    const m = String(it.caption || '').match(/^(.+)-\d+$/);
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : slug(fallback);
}

export default function NameImagesDialog({ files, existing, defaultBase, onCancel, onConfirm }) {
  const [base, setBase] = useState(() => guessBase(existing, defaultBase));
  const [order, setOrder] = useState(() => files.map((_, i) => i));

  const cleanBase = slug(base);
  const start = useMemo(() => {
    let max = 0;
    (existing || []).forEach((it) => {
      const m = String(it.caption || '').match(/^(.+)-(\d+)$/);
      if (m && m[1] === cleanBase) max = Math.max(max, Number(m[2]));
    });
    return max + 1;
  }, [existing, cleanBase]);
  const width = Math.max(2, String(start + files.length - 1).length);
  const nameAt = (pos) => `${cleanBase}-${String(start + pos).padStart(width, '0')}`;

  const move = (pos, step) => setOrder((o) => {
    const to = pos + step;
    if (to < 0 || to >= o.length) return o;
    const next = [...o];
    [next[pos], next[to]] = [next[to], next[pos]];
    return next;
  });

  const confirm = () => {
    const named = order.map((fileIndex, pos) => {
      const file = files[fileIndex];
      file.ctName = nameAt(pos);
      return file;
    });
    onConfirm(named);
  };

  const keepOriginal = () => onConfirm(order.map((i) => files[i]));
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div className="bte-overlay" onClick={stop} onMouseDown={stop}>
      <div className="bte-box nid-box" role="dialog" aria-label="Name the new images">
        <div className="bte-head">
          <div>
            <h2>Name the new images</h2>
            <span className="ad-muted ta-small">
              Enter a base name and the {files.length} image{files.length === 1 ? '' : 's'} will be numbered in this order.
            </span>
          </div>
        </div>

        <label className="ta-field">
          <span>Base name (e.g. con, ccis, admin)</span>
          <input type="text" value={base} autoFocus placeholder="con" onChange={(e) => setBase(e.target.value)} />
        </label>

        <ol className="nid-list">
          {order.map((fileIndex, pos) => (
            <li key={fileIndex} className="nid-row">
              <span className="nid-new">{cleanBase ? nameAt(pos) : '—'}</span>
              <span className="nid-old" title={files[fileIndex].name}>{files[fileIndex].name}</span>
              <span className="bte-move">
                <button type="button" className="btn-ghost btn-sm" disabled={pos === 0} onClick={() => move(pos, -1)} aria-label="Move up">↑</button>
                <button type="button" className="btn-ghost btn-sm" disabled={pos === order.length - 1} onClick={() => move(pos, 1)} aria-label="Move down">↓</button>
              </span>
            </li>
          ))}
        </ol>

        <div className="ta-actions">
          <button type="button" className="btn-primary" disabled={!cleanBase} onClick={confirm}>
            Use these names
          </button>
          <button type="button" className="btn-ghost" onClick={keepOriginal}>Skip (no names)</button>
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel upload</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}