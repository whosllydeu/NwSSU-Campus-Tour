import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const FIELDS = [
  { key: 'name', label: 'College/Department Name', type: 'text', required: true, wide: true },
  { key: 'abbr', label: 'Abbreviation', type: 'text', required: true },
  { key: 'color', label: 'Accent Color', type: 'color' },
  { key: 'photo', label: 'Photo (filename or URL)', type: 'text', wide: true },
  { key: 'programs', label: 'Programs Offered', type: 'list', wide: true },
  { key: 'faculty', label: 'Faculty (one per line, "Name - Role")', type: 'list', wide: true },
  { key: 'officers', label: 'Student Council Officers', type: 'list', wide: true },
  { key: 'organizations', label: 'Affiliated Organizations', type: 'list', wide: true },
];

const COLUMNS = [
  { key: 'abbr', label: 'Abbr' },
  { key: 'name', label: 'Name' },
  { key: 'programs', label: 'Programs', render: (r) => r.programs?.length ?? 0 },
  { key: 'faculty', label: 'Faculty', render: (r) => r.faculty?.length ?? 0 },
];

export default function DepartmentsAdmin() {
  const { isLoading, departments, addRecord, updateRecord, deleteRecord } = useAdmin();
  const { showToast } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(row) { setEditing(row); setFormOpen(true); }

  function handleSubmit(data) {
    if (editing) {
      updateRecord('departments', 'Department', editing._id, data);
      showToast(`"${data.name}" updated`);
    } else {
      addRecord('departments', 'Department', data);
      showToast(`"${data.name}" added`);
    }
    setFormOpen(false);
  }

  function handleDeleteConfirm() {
    deleteRecord('departments', 'Department', toDelete._id, toDelete.name);
    showToast(`"${toDelete.name}" deleted`);
    setToDelete(null);
  }

  if (isLoading) return <div className="ad-loading">Loading departments…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Departments</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={departments}
        onEdit={openEdit}
        onDelete={setToDelete}
        searchPlaceholder="Search departments…"
        emptyLabel="No departments yet. Add one to get started."
      />
      <FormModal
        open={formOpen}
        title={editing ? 'Edit Department' : 'Add Department'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete department?"
        message={`"${toDelete?.name}" will be permanently removed from the campus tour data.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
