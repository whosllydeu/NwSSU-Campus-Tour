import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const FIELDS = [
  { key: 'name', label: 'Organization Name', type: 'text', required: true, wide: true },
  { key: 'abbr', label: 'Abbreviation', type: 'text', required: true },
  { key: 'college', label: 'College', type: 'text', required: true },
  { key: 'president', label: 'President', type: 'text' },
  { key: 'vp', label: 'Vice President', type: 'text' },
  { key: 'secretary', label: 'Secretary', type: 'text' },
];

const COLUMNS = [
  { key: 'abbr', label: 'Abbr' },
  { key: 'name', label: 'Name' },
  { key: 'college', label: 'College' },
  { key: 'president', label: 'President' },
];

export default function OrganizationsAdmin() {
  const { isLoading, organizations, addRecord, updateRecord, deleteRecord } = useAdmin();
  const { showToast } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(row) { setEditing(row); setFormOpen(true); }

  function handleSubmit(data) {
    if (editing) {
      updateRecord('organizations', 'Organization', editing._id, data);
      showToast(`"${data.name}" updated`);
    } else {
      addRecord('organizations', 'Organization', data);
      showToast(`"${data.name}" added`);
    }
    setFormOpen(false);
  }

  function handleDeleteConfirm() {
    deleteRecord('organizations', 'Organization', toDelete._id, toDelete.name);
    showToast(`"${toDelete.name}" deleted`);
    setToDelete(null);
  }

  if (isLoading) return <div className="ad-loading">Loading organizations…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Organizations</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Organization</button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={organizations}
        onEdit={openEdit}
        onDelete={setToDelete}
        searchPlaceholder="Search organizations…"
        emptyLabel="No organizations yet. Add one to get started."
      />
      <FormModal
        open={formOpen}
        title={editing ? 'Edit Organization' : 'Add Organization'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete organization?"
        message={`"${toDelete?.name}" will be permanently removed from the campus tour data.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
