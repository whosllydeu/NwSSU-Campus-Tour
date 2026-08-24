import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { BUILDING_TYPES } from '../data/adminData.js';

const FIELDS = [
  { key: 'name', label: 'Building Name', type: 'text', required: true, wide: true },
  { key: 'abbr', label: 'Abbreviation', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: BUILDING_TYPES, required: true },
  { key: 'emoji', label: 'Icon (emoji)', type: 'text' },
  { key: 'color', label: 'Accent Color', type: 'color' },
  { key: 'lat', label: 'Latitude', type: 'number' },
  { key: 'lng', label: 'Longitude', type: 'number' },
  { key: 'location', label: 'Location on Campus', type: 'text', wide: true },
  { key: 'photo', label: 'Photo (filename or URL)', type: 'text', wide: true },
  { key: 'desc', label: 'Description', type: 'textarea', wide: true },
  { key: 'offices', label: 'Offices Inside', type: 'list', wide: true },
  { key: 'programs', label: 'Programs Offered', type: 'list', wide: true },
];

const COLUMNS = [
  { key: 'abbr', label: 'Abbr' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (r) => <span className={`ad-chip type-${r.type}`}>{r.type}</span> },
  { key: 'programs', label: 'Programs', sortable: false, render: (r) => (r.programs?.length ?? 0) },
];

export default function BuildingsAdmin() {
  const { isLoading, buildings, addRecord, updateRecord, deleteRecord } = useAdmin();
  const { showToast } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(row) { setEditing(row); setFormOpen(true); }

  function handleSubmit(data) {
    if (editing) {
      updateRecord('buildings', 'Building', editing._id, data);
      showToast(`"${data.name}" updated`);
    } else {
      addRecord('buildings', 'Building', data);
      showToast(`"${data.name}" added`);
    }
    setFormOpen(false);
  }

  function handleDeleteConfirm() {
    deleteRecord('buildings', 'Building', toDelete._id, toDelete.name);
    showToast(`"${toDelete.name}" deleted`);
    setToDelete(null);
  }

  if (isLoading) return <div className="ad-loading">Loading buildings…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Buildings</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Building</button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={buildings}
        onEdit={openEdit}
        onDelete={setToDelete}
        searchPlaceholder="Search buildings…"
        emptyLabel="No buildings yet. Add one to get started."
      />
      <FormModal
        open={formOpen}
        title={editing ? 'Edit Building' : 'Add Building'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete building?"
        message={`"${toDelete?.name}" will be permanently removed from the campus tour data.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
