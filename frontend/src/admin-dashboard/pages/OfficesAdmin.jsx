import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const FIELDS = [
  { key: 'name', label: 'Office Name', type: 'text', required: true, wide: true },
  { key: 'icon', label: 'Icon (emoji)', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'hours', label: 'Office Hours', type: 'text' },
  { key: 'photo', label: 'Photo (filename or URL)', type: 'text', wide: true },
  { key: 'desc', label: 'Description', type: 'textarea', wide: true },
];

const COLUMNS = [
  { key: 'icon', label: '', sortable: false },
  { key: 'name', label: 'Name' },
  { key: 'location', label: 'Location' },
  { key: 'hours', label: 'Hours' },
];

export default function OfficesAdmin() {
  const { isLoading, offices, addRecord, updateRecord, deleteRecord } = useAdmin();
  const { showToast } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(row) { setEditing(row); setFormOpen(true); }

  function handleSubmit(data) {
    if (editing) {
      updateRecord('offices', 'Office', editing._id, data);
      showToast(`"${data.name}" updated`);
    } else {
      addRecord('offices', 'Office', data);
      showToast(`"${data.name}" added`);
    }
    setFormOpen(false);
  }

  function handleDeleteConfirm() {
    deleteRecord('offices', 'Office', toDelete._id, toDelete.name);
    showToast(`"${toDelete.name}" deleted`);
    setToDelete(null);
  }

  if (isLoading) return <div className="ad-loading">Loading offices…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Offices</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Office</button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={offices}
        onEdit={openEdit}
        onDelete={setToDelete}
        searchPlaceholder="Search offices…"
        emptyLabel="No offices yet. Add one to get started."
      />
      <FormModal
        open={formOpen}
        title={editing ? 'Edit Office' : 'Add Office'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete office?"
        message={`"${toDelete?.name}" will be permanently removed from the campus tour data.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
