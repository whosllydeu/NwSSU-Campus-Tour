import { useState, useCallback, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { linkedDepartment } from '../utils/linkedDepartment.js';
import { missingInfo } from '../utils/buildingCompleteness.js';
import { BUILDING_TYPES } from '../data/adminData.js';
import { resolveImage } from '../../user-dashboard/utils/assets';
import {
  uploadBuildingImage,
  removeBuildingImages,
  collectBuildingImagePaths,
} from '../services/storage.service.js';
import { slugify } from '../../lib/slugify';
import '../styles/admin-images.css';

const buildFields = (requireDesc) => [
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
  {
    key: 'pathwayLink',
    label: '360° Pathway Connection',
    type: 'pathwayLink',
    galleryKey: 'images',
    wide: true,
    help: 'Optional. Connects this building’s 360° images to an outdoor pathway photo: a pin appears on that photo and “Walk there!” leads into the building.',
  },
  {
    key: 'desc',
    label: 'Description',
    type: 'textarea',
    wide: true,
    required: requireDesc,
    placeholder: 'e.g. Home of the College of Engineering, with lecture rooms, drafting studios and labs.',
    help: 'One or two sentences: what this building is and what visitors will find inside.',
  },
  { key: 'offices', label: 'Offices Inside', type: 'list', wide: true },
  { key: 'programs', label: 'Programs Offered', type: 'list', wide: true, showWhen: (v) => v.type === 'academic' },
  { key: 'faculty', label: 'Faculty (one per line, "Name - Role")', type: 'list', wide: true, showWhen: (v) => v.type === 'academic' },
  { key: 'officers', label: 'Student Council Officers', type: 'list', wide: true, showWhen: (v) => v.type === 'academic' },
  { key: 'organizations', label: 'Affiliated Organizations', type: 'list', wide: true, showWhen: (v) => v.type === 'academic' },
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
  {
    key: 'missingCount',
    label: 'Info',
    render: (row) => (row.missing.length === 0 ? (
      <span className="ad-chip is-complete">✓ Complete</span>
    ) : (
      <span className="ad-missing" title={`Missing: ${row.missing.join(', ')}`}>
        <span className="ad-chip is-missing">Missing info · {row.missing.length}</span>
        <small className="ad-missing-list">{row.missing.join(', ')}</small>
      </span>
    )),
  },
];

function deleteMessage(building, departments, buildings) {
  if (!building) return '';
  const base = `"${building.name}" and its uploaded images will be permanently removed from the campus tour data.`;
  const dept = linkedDepartment(building, departments, buildings);
  return dept
    ? `${base} Its department "${dept.name}" will also be deleted from the Departments page.`
    : base;
}

export default function BuildingsAdmin() {
  const { isLoading, buildings, departments, saveBuilding, deleteBuilding } = useAdmin();
  const { showToast } = useUI();

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const rows = useMemo(
    () => buildings.map((b) => {
      const missing = missingInfo(b);
      return { ...b, missing, missingCount: missing.length };
    }),
    [buildings]
  );
  const incompleteCount = rows.filter((r) => r.missingCount > 0).length;
  const shownRows = onlyIncomplete ? rows.filter((r) => r.missingCount > 0) : rows;

  // Description is required for new buildings (and can't be blanked on ones that already have one).
  const fields = useMemo(
    () => buildFields(!editing || Boolean(String(editing.desc || '').trim())),
    [editing]
  );

  // Faculty / officers / organizations live on the linked department, so prefill them from there when editing.
  const formInitialValues = useMemo(() => {
    if (!editing) return {};
    const dept = linkedDepartment(editing, departments, buildings);
    return {
      ...editing,
      faculty: dept?.faculty || [],
      officers: dept?.officers || [],
      organizations: dept?.organizations || [],
    };
  }, [editing, departments, buildings]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row) => {
    setEditing(buildings.find((b) => b._id === row._id) || row);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }, [buildings]);

  const handleUpload = useCallback(
    (file, values) => uploadBuildingImage(file, editing?._id || slugify(values?.name || '') || 'new-building'),
    [editing]
  );

  const handleSubmit = useCallback(async (data) => {
    const previousPaths = editing ? collectBuildingImagePaths(editing) : [];

    const result = await saveBuilding(editing ? editing._id : null, data);

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
      const { departmentDeleted } = await deleteBuilding(toDelete);
      removeBuildingImages(paths);
      showToast(departmentDeleted
        ? `"${toDelete.name}" and its department "${departmentDeleted}" deleted`
        : `"${toDelete.name}" deleted`);
      setToDelete(null);
    } catch (err) {
      showToast(`Could not delete "${toDelete.name}": ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }, [toDelete, deleting, deleteBuilding, showToast]);

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

      <div className="ad-missing-bar">
        <span>
          {incompleteCount === 0
            ? 'All buildings have their key info filled in.'
            : `${incompleteCount} of ${rows.length} building${rows.length === 1 ? '' : 's'} still need info.`}
        </span>
        {incompleteCount > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setOnlyIncomplete((v) => !v)}>
            {onlyIncomplete ? 'Show all' : 'Show only missing info'}
          </button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={shownRows}
        onEdit={openEdit}
        onDelete={setToDelete}
        searchPlaceholder="Search buildings…"
        emptyLabel="No buildings yet. Add one to get started."
      />

      <FormModal
        key={formSession}
        open={formOpen}
        title={editing ? 'Edit Building' : 'Add Building'}
        fields={fields}
        initialValues={formInitialValues}
        onSubmit={handleSubmit}
        onUploadImage={handleUpload}
        onDiscardUploads={removeBuildingImages}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete building?"
        message={deleteMessage(toDelete, departments, buildings)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}