import { useState, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { BUILDING_TYPES } from '../data/adminData.js';
import { resolveImage } from '../../user-dashboard/utils/assets';
import {
  uploadBuildingImage,
  removeBuildingImages,
  collectBuildingImagePaths,
} from '../services/storage.service.js';
import { slugify } from '../../lib/slugify';
import '../styles/admin-images.css';

const FIELDS = [
  { key: 'name', label: 'Building Name', type: 'text', required: true, wide: true },
  { key: 'abbr', label: 'Abbreviation', type: 'text', required: true },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: BUILDING_TYPES,
    required: true,
    help: 'Academic buildings are added to Department Management automatically.',
  },
  { key: 'color', label: 'Accent Color', type: 'color' },
  { key: 'coordinates', label: 'Building Location', type: 'map', required: true, wide: true },
  { key: 'location', label: 'Location on Campus', type: 'text', wide: true },
  { key: 'photo', label: 'Building Photo', type: 'image', wide: true },
  {
    key: 'images',
    label: 'Additional Images & Coordinates',
    type: 'gallery',
    wide: true,
    help: 'Each image is saved with its own latitude and longitude.',
  },
  { key: 'desc', label: 'Description', type: 'textarea', wide: true },
  { key: 'offices', label: 'Offices Inside', type: 'list', wide: true },
  { key: 'programs', label: 'Programs Offered', type: 'list', wide: true },
];

function RowThumb({ row }) {
  const [errored, setErrored] = useState(false);
  const src = resolveImage(row.photo);
  if (src && !errored) {
    return <img className="ad-row-thumb" src={src} alt={row.name} loading="lazy" onError={() => setErrored(true)} />;
  }
  return <span className="ad-row-thumb-empty">{(row.abbr || '—').slice(0, 4)}</span>;
}

const COLUMNS = [
  { key: 'photo', label: '', sortable: false, render: (row) => <RowThumb row={row} /> },
  { key: 'abbr', label: 'Abbr' },
  { key: 'name', label: 'Name' },
  {
    key: 'type',
    label: 'Type',
    render: (row) => (
      <span className={`ad-chip type-${row.type}`}>
        {row.type}
      </span>
    ),
  },
  { key: 'images', label: 'Images', sortable: false, render: (row) => (Array.isArray(row.images) ? row.images.length : 0) },
  { key: 'programs', label: 'Programs', sortable: false, render: (row) => row.programs?.length ?? 0 },
];

export default function BuildingsAdmin() {
  const { isLoading, buildings, saveBuilding, deleteRecord } = useAdmin();
  const { showToast } = useUI();

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row) => {
    setEditing(row);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }, []);

  // Files are grouped in storage by the building's id (or the slug of the
  // name for a building that hasn't been created yet).
  const handleUpload = useCallback(
    (file, values) => uploadBuildingImage(file, editing?._id || slugify(values?.name || '') || 'new-building'),
    [editing]
  );

  // Called by FormModal; errors are thrown back so the form can show them.
  const handleSubmit = useCallback(async (data) => {
    const previousPaths = editing ? collectBuildingImagePaths(editing) : [];

    const result = await saveBuilding(editing ? editing._id : null, data);

    // Remove storage files that were replaced or deleted in this edit.
    if (previousPaths.length) {
      const keep = new Set(collectBuildingImagePaths(result.building));
      removeBuildingImages(previousPaths.filter((p) => !keep.has(p)));
    }

    let message = `"${result.building.name}" ${editing ? 'updated' : 'added'}`;
    if (result.departmentCreated) message += ' · added to Department Management';
    else if (result.departmentUnlinked) message += ' · unlinked from its department (department kept)';
    showToast(message);
    setFormOpen(false);
  }, [editing, saveBuilding, showToast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      const paths = collectBuildingImagePaths(toDelete);
      await deleteRecord('buildings', 'Building', toDelete._id, toDelete.name);
      removeBuildingImages(paths);
      showToast(`"${toDelete.name}" deleted`);
      setToDelete(null);
    } catch (err) {
      showToast(`Could not delete "${toDelete.name}": ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }, [toDelete, deleting, deleteRecord, showToast]);

  if (isLoading) {
    return (
      <div className="ad-loading">
        Loading buildings…
      </div>
    );
  }

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Buildings</h2>

        <button
          className="btn-primary"
          onClick={openCreate}
        >
          + Add Building
        </button>
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
        key={formSession}
        open={formOpen}
        title={editing ? 'Edit Building' : 'Add Building'}
        fields={FIELDS}
        initialValues={editing || {}}
        onSubmit={handleSubmit}
        onUploadImage={handleUpload}
        onDiscardUploads={removeBuildingImages}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete building?"
        message={`"${toDelete?.name}" and its uploaded images will be permanently removed from the campus tour data. Its department record (if any) is kept.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}