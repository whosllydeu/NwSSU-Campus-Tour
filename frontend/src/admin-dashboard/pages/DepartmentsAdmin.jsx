import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';

const FIELDS = [
  { key: 'name', label: 'College/Department Name', type: 'text', required: true, wide: true },
  { key: 'abbr', label: 'Abbreviation', type: 'text', required: true },
  { key: 'color', label: 'Accent Color', type: 'color' },
  { key: 'photo', label: 'Photo (filename or URL)', type: 'text', wide: true, help: 'Leave empty to use the linked building\'s photo.' },
  { key: 'offices', label: 'Offices', type: 'list', wide: true },
  { key: 'programs', label: 'Programs Offered', type: 'list', wide: true },
  { key: 'faculty', label: 'Faculty (one per line, "Name - Role")', type: 'list', wide: true },
  { key: 'officers', label: 'Student Council Officers', type: 'list', wide: true },
  { key: 'organizations', label: 'Affiliated Organizations', type: 'list', wide: true },
];

export default function DepartmentsAdmin() {
  const { isLoading, departments, buildings, addRecord, updateRecord } = useAdmin();
  const { showToast } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editing, setEditing] = useState(null);

  const COLUMNS = [
    { key: 'abbr', label: 'Abbr' },
    { key: 'name', label: 'Name' },
    {
      key: 'building',
      label: 'Building',
      sortable: false,
      render: (r) => buildings.find((b) => b.dept === r.id)?.name || '—',
    },
    { key: 'programs', label: 'Programs', render: (r) => r.programs?.length ?? 0 },
    { key: 'faculty', label: 'Faculty', render: (r) => r.faculty?.length ?? 0 },
  ];

  function openEdit(row) { setEditing(row); setFormSession((n) => n + 1); setFormOpen(true); }

  async function handleSubmit(data) {
    if (editing) {
      await updateRecord('departments', 'Department', editing._id, data);
      showToast(`"${data.name}" updated`);
    } else {
      await addRecord('departments', 'Department', data);
      showToast(`"${data.name}" added`);
    }
    setFormOpen(false);
  }

  if (isLoading) return <div className="ad-loading">Loading departments…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Departments</h2>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={departments}
        onEdit={openEdit}
        searchPlaceholder="Search departments…"
        emptyLabel="No departments yet. Add an academic building to create one."
      />
      <p className="ad-muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        Departments are created and removed together with their academic building in Buildings.
      </p>
      <FormModal
        key={formSession}
        open={formOpen}
        title={editing ? 'Edit Department' : 'Add Department'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}