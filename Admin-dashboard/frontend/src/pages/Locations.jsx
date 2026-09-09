import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../context/ToastContext.jsx';
import { listWaypoints, updateWaypoint, createWaypoint, clearWaypoint } from '../services/arWaypoints.service.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const FIELDS = [
  { key: 'destination_key', label: 'Destination Key', type: 'text', required: true, wide: true },
  { key: 'display_name', label: 'Display Name', type: 'text', required: true, wide: true },
  { key: 'lat', label: 'Latitude', type: 'number' },
  { key: 'lng', label: 'Longitude', type: 'number' },
];

// Editing an existing waypoint shouldn't let the key be changed —
// destination_key must stay in sync with the building id / department
// id / office slug it points at, or AR breaks for that place.
const EDIT_FIELDS = FIELDS.filter((f) => f.key !== 'destination_key');

const COLUMNS = [
  { key: 'display_name', label: 'Place' },
  { key: 'destination_key', label: 'Key' },
  {
    key: 'lat',
    label: 'Status',
    sortable: false,
    render: (r) => (
      r.lat != null && r.lng != null
        ? <span className="ad-chip type-academic">📍 {r.lat.toFixed(6)}, {r.lng.toFixed(6)}</span>
        : <span className="ad-chip type-facility">Not set</span>
    ),
  },
];

export default function Locations() {
  const { showToast } = useUI();
  const [waypoints, setWaypoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toClear, setToClear] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      setWaypoints(await listWaypoints());
    } catch (err) {
      showToast(err.message || 'Failed to load locations.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refetch(); }, [refetch]);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(row) { setEditing(row); setFormOpen(true); }

  async function handleSubmit(data) {
    try {
      if (editing) {
        const updated = await updateWaypoint(editing._id, data);
        setWaypoints((prev) => prev.map((w) => (w._id === editing._id ? updated : w)));
        showToast(`"${updated.display_name}" location updated`);
      } else {
        const created = await createWaypoint(data);
        setWaypoints((prev) => [...prev, created]);
        showToast(`"${created.display_name}" added`);
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message || 'Save failed.');
    }
  }

  async function handleClearConfirm() {
    try {
      const cleared = await clearWaypoint(toClear._id);
      setWaypoints((prev) => prev.map((w) => (w._id === toClear._id ? cleared : w)));
      showToast(`Cleared coordinates for "${toClear.display_name}"`);
    } catch (err) {
      showToast(err.message || 'Clear failed.');
    } finally {
      setToClear(null);
    }
  }

  if (isLoading) return <div className="ad-loading">Loading locations…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>AR Locations</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Location</button>
      </div>
      <p className="ad-muted" style={{ marginBottom: 14 }}>
        Set the exact latitude/longitude for any building, department, or office here — the User
        Dashboard's "Walk There (AR)" feature uses these coordinates directly, so this replaces
        needing to physically walk to each spot with a phone.
      </p>
      <DataTable
        columns={COLUMNS}
        rows={waypoints}
        onEdit={openEdit}
        onDelete={setToClear}
        searchPlaceholder="Search locations…"
        emptyLabel="No locations yet."
      />
      <FormModal
        open={formOpen}
        title={editing ? `Edit "${editing.display_name}"` : 'Add Location'}
        fields={editing ? EDIT_FIELDS : FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toClear)}
        title="Clear coordinates?"
        message={`"${toClear?.display_name}" will show as "not measured yet" again in AR. This doesn't remove the place from the list.`}
        confirmLabel="Clear"
        danger={false}
        onConfirm={handleClearConfirm}
        onCancel={() => setToClear(null)}
      />
    </div>
  );
}
