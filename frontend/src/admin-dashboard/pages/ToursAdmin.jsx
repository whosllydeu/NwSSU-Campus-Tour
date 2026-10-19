import { useCallback, useEffect, useState } from 'react';
import { useUI } from '../context/ToastContext.jsx';
import PanoAimViewer from '../components/PanoAimViewer.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useCampusData } from '../../user-dashboard/context/DataContext';
import { TOURS, NODE_BY_ID } from '../../user-dashboard/static/nwssuTour';
import { baseArrows } from '../../user-dashboard/utils/tourOverrides';
import {
  listTourOverrides,
  saveTourOverride,
  deleteTourOverride,
} from '../../user-dashboard/services/tourOverrides.service';
import '../styles/admin-images.css';
import '../styles/tours-admin.css';

const norm = (d) => {
  const x = ((((d + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};
const round1 = (v) => Math.round(Number(v) * 10) / 10;
const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

const hasNode = (id) => Boolean(NODE_BY_ID[id]);
const isAdminTour = (t) => String(t?.id || '').startsWith('admin-');
const groupOf = (t) => (isAdminTour(t) ? 1 : t.kind === 'pathway' ? 2 : 0);
const allTours = () => [...new Set(Object.values(TOURS))]
  .filter((t) => t.nodeIds.some(hasNode))
  .sort((a, b) => groupOf(a) - groupOf(b) || a.title.localeCompare(b.title));
const tourLabel = (t) => `${t.kind === 'pathway' ? 'Pathway' : 'Building'} · ${t.title}`;
const TOUR_GROUPS = ['Buildings', 'Added in admin', 'Pathways'];

const nodeName = (id) => {
  const n = NODE_BY_ID[id];
  if (!n) return id;
  return `${n.name} (${id})`;
};
const tourTitleOf = (id) => TOURS[NODE_BY_ID[id]?.data?.tour]?.title || '';

function sameArrows(a, b) {
  if (!a || !b) return false;
  if (round1(a.yaw) !== round1(b.yaw)) return false;
  if (a.links.length !== b.links.length) return false;
  return a.links.every((l, i) => l.to === b.links[i].to && round1(l.yaw) === round1(b.links[i].yaw));
}

export default function ToursAdmin() {
  const { showToast } = useUI();
  useCampusData();
  const tours = allTours();
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [tourId, setTourId] = useState(tours[0]?.id || '');
  const [nodeId, setNodeId] = useState(tours[0]?.nodeIds[0] || '');
  const [drafts, setDrafts] = useState({});
  const [facing, setFacing] = useState(0);
  const [newTarget, setNewTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saved = useCallback((id) => {
    const ov = overrides[id];
    const orig = baseArrows(id);
    if (!ov) return orig;
    return { yaw: isNum(ov.yaw) ? ov.yaw : orig.yaw, links: ov.links.map((l) => ({ ...l })) };
  }, [overrides]);

  useEffect(() => {
    let active = true;
    listTourOverrides()
      .then((rows) => {
        if (!active) return;
        setOverrides(Object.fromEntries(rows.map((r) => [r.nodeId, r])));
      })
      .catch((err) => {
        if (!active) return;
        setTableMissing(true);
        showToast(err.message || 'Could not load arrow edits.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  const current = saved(nodeId);
  const fromSaved = { yaw: round1(current.yaw), links: current.links.map((l) => ({ to: l.to, yaw: round1(l.yaw) })) };
  const draft = !nodeId || loading ? null : drafts[nodeId] || fromSaved;
  const dirty = Boolean(drafts[nodeId]) && !sameArrows(drafts[nodeId], fromSaved);

  const setDraft = (update) => {
    setDrafts((all) => {
      const base = all[nodeId] || fromSaved;
      return { ...all, [nodeId]: typeof update === 'function' ? update(base) : update };
    });
  };
  const dropDraft = (id) => setDrafts((all) => {
    if (!(id in all)) return all;
    const next = { ...all };
    delete next[id];
    return next;
  });
  const node = NODE_BY_ID[nodeId];
  const tour = TOURS[tourId];

  const confirmLeave = () => !dirty || window.confirm('You have unsaved arrow changes on this photo. Discard them?');

  const pickNode = (id) => {
    if (id === nodeId || !confirmLeave()) return;
    dropDraft(nodeId);
    setNewTarget('');
    const t = NODE_BY_ID[id]?.data?.tour;
    if (t && t !== tourId) setTourId(t);
    setNodeId(id);
  };

  const pickTour = (id) => {
    if (!confirmLeave()) return;
    dropDraft(nodeId);
    setNewTarget('');
    setTourId(id);
    setNodeId(TOURS[id]?.nodeIds.find(hasNode) || '');
  };

  const pins = !draft || !node ? [] : draft.links.map((l, i) => {
      const cross = NODE_BY_ID[l.to]?.data?.tour !== node.data.tour;
      return {
        id: `a-${i}`,
        yaw: Number(l.yaw) || 0,
        label: `${i + 1}. ${cross ? `${tourTitleOf(l.to)} · ` : ''}${NODE_BY_ID[l.to]?.name || l.to}`,
        kind: cross ? 'extra' : 'forward',
      };
    });

  const targetGroups = (() => {
    const groups = tours.map((t) => ({
      id: t.id,
      title: `${isAdminTour(t) ? 'Added in admin · ' : ''}${tourLabel(t)}`,
      nodes: t.nodeIds.filter((id) => id !== nodeId && !draft?.links.some((l) => l.to === id)),
    }));
    const own = groups.findIndex((g) => g.id === tourId);
    if (own > 0) groups.unshift(groups.splice(own, 1)[0]);
    return groups.filter((g) => g.nodes.length);
  })();

  const setLink = (i, patch) => setDraft((d) => ({ ...d, links: d.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const removeLink = (i) => setDraft((d) => ({ ...d, links: d.links.filter((_, j) => j !== i) }));
  const addLink = () => {
    if (!newTarget) return;
    setDraft((d) => ({ ...d, links: [...d.links, { to: newTarget, yaw: facing }] }));
    setNewTarget('');
  };

  const save = async () => {
    if (!draft) return;
    if (draft.links.some((l) => !isNum(l.yaw))) {
      showToast('Every arrow needs a direction number.');
      return;
    }
    setSaving(true);
    try {
      const row = await saveTourOverride(nodeId, {
        yaw: norm(Number(draft.yaw) || 0),
        links: draft.links.map((l) => ({ to: l.to, yaw: norm(Number(l.yaw)) })),
      });
      setOverrides((o) => ({ ...o, [nodeId]: row }));
      dropDraft(nodeId);
      showToast('Arrows saved. Reload the campus tour to see them.');
    } catch (err) {
      showToast(err.message || 'Could not save the arrows.');
    } finally {
      setSaving(false);
    }
  };

  const resetToOriginal = async () => {
    setConfirmReset(false);
    setSaving(true);
    try {
      await deleteTourOverride(nodeId);
      setOverrides((o) => {
        const next = { ...o };
        delete next[nodeId];
        return next;
      });
      dropDraft(nodeId);
      showToast('Photo reset to the original arrows.');
    } catch (err) {
      showToast(err.message || 'Could not reset this photo.');
    } finally {
      setSaving(false);
    }
  };

  const editedCount = Object.keys(overrides).filter((id) => TOURS[tourId]?.nodeIds.includes(id)).length;

  return (
    <>
      {tableMissing && (
        <div className="ad-panel">
          <strong>Arrow editing is not set up yet.</strong>
          <p className="ad-muted">Run <code>tour_overrides.sql</code> once in Supabase → SQL Editor, then reload this page.</p>
        </div>
      )}

      <div className="ta-layout">
        <div className="ad-panel ta-side">
          <label className="ta-field">
            <span>Tour</span>
            <select value={tourId} onChange={(e) => pickTour(e.target.value)}>
              {TOUR_GROUPS.map((label, g) => {
                const list = tours.filter((t) => groupOf(t) === g);
                if (!list.length) return null;
                return (
                  <optgroup key={label} label={label}>
                    {list.map((t) => <option key={t.id} value={t.id}>{tourLabel(t)}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </label>
          {isAdminTour(tour) && (
            <p className="ad-muted ta-small">
              Added in the admin. Arrows saved here replace the ones set for that photo in Buildings → Edit.
            </p>
          )}
          <p className="ad-muted ta-small">
            {tour?.nodeIds.length || 0} photos{editedCount ? ` · ${editedCount} edited` : ''}
          </p>
          <ol className="ta-nodes">
            {(tour?.nodeIds || []).filter(hasNode).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`ta-node${id === nodeId ? ' active' : ''}`}
                  onClick={() => pickNode(id)}
                >
                  <span className="ta-node-name">{NODE_BY_ID[id]?.name || id}</span>
                  <span className="ta-node-id">{id}</span>
                  {overrides[id] && <span className="ta-badge">edited</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="ad-panel ta-main">
          {!node || !draft ? (
            <p className="ad-muted">{loading ? 'Loading…' : 'Choose a photo on the left.'}</p>
          ) : (
            <>
              <div className="ad-panel-header">
                <h2>{node.name} <span className="ta-node-id">{node.id}</span></h2>
                {overrides[nodeId] && <span className="ta-badge">edited</span>}
              </div>

              <div className="ad-aim">
                <PanoAimViewer
                  key={nodeId}
                  src={node.panorama}
                  startYaw={Number(draft.yaw) || 0}
                  pins={pins}
                  onFacing={setFacing}
                />
                <p className="ad-field-help">
                  Drag the photo so the centre line points where an arrow should be, then press “Aim here” on that
                  arrow. Green = arrow inside this tour, orange = arrow to another building or pathway. Hold Ctrl +
                  scroll to zoom.
                </p>
              </div>

              <div className="ta-section">
                <h3>Start view</h3>
                <div className="ta-row">
                  <span className="ta-row-label">Direction the photo faces when it opens</span>
                  <input
                    type="number"
                    step="any"
                    value={draft.yaw}
                    onChange={(e) => setDraft((d) => ({ ...d, yaw: e.target.value }))}
                  />
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setDraft((d) => ({ ...d, yaw: facing }))}>
                    Use current view ({facing}°)
                  </button>
                </div>
              </div>

              <div className="ta-section">
                <h3>Arrows on this photo ({draft.links.length})</h3>
                {draft.links.length === 0 && <p className="ad-muted">No arrows — users cannot leave this photo except by closing the tour.</p>}
                {draft.links.map((l, i) => {
                  const cross = NODE_BY_ID[l.to]?.data?.tour !== node.data.tour;
                  return (
                    <div className="ta-row" key={`${l.to}-${i}`}>
                      <span className={`ta-dot ${cross ? 'is-extra' : 'is-forward'}`}>{i + 1}</span>
                      <span className="ta-row-label">
                        → {cross ? <em>{tourTitleOf(l.to)} · </em> : null}{nodeName(l.to)}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={l.yaw}
                        aria-label="Arrow direction in degrees"
                        onChange={(e) => setLink(i, { yaw: e.target.value })}
                      />
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setLink(i, { yaw: facing })}>
                        Aim here ({facing}°)
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => pickNode(l.to)}>
                        Open
                      </button>
                      <button type="button" className="btn-ghost btn-sm ad-gallery-remove" onClick={() => removeLink(i)}>
                        Remove
                      </button>
                    </div>
                  );
                })}

                <div className="ad-aim-add">
                  <select value={newTarget} onChange={(e) => setNewTarget(e.target.value)} aria-label="New arrow goes to">
                    <option value="">New arrow goes to…</option>
                    {targetGroups.map((g) => (
                      <optgroup key={g.id} label={g.title}>
                        {g.nodes.map((id) => <option key={id} value={id}>{nodeName(id)}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <button type="button" className="btn-ghost btn-sm" disabled={!newTarget} onClick={addLink}>
                    + Add arrow here ({facing}°)
                  </button>
                </div>
                <p className="ad-field-help">
                  Arrows go one way. If users should be able to come back, open the other photo and add an arrow back
                  to this one.
                </p>
              </div>

              <div className="ta-actions">
                <button type="button" className="btn-primary" disabled={!dirty || saving || tableMissing} onClick={save}>
                  {saving ? 'Saving…' : 'Save arrows'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={!dirty || saving}
                  onClick={() => dropDraft(nodeId)}
                >
                  Discard changes
                </button>
                {overrides[nodeId] && (
                  <button type="button" className="ad-btn-danger" disabled={saving} onClick={() => setConfirmReset(true)}>
                    Reset to original
                  </button>
                )}
                {dirty && <span className="ta-unsaved">Unsaved changes</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset this photo?"
        message="This removes your saved arrow edits for this photo and brings back the original arrows from the code."
        confirmLabel="Reset"
        onConfirm={resetToOriginal}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}