import { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function Settings() {
  const { stats, resetAllData } = useAdmin();
  const { showToast } = useUI();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleReset() {
    resetAllData();
    showToast('Admin data re-synced from the database');
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="ad-panel">
        <h2>System Information</h2>
        <div className="ad-info-grid">
          <div><span className="ad-info-label">Application</span><span>NWSSU Campus Tour</span></div>
          <div><span className="ad-info-label">Admin Interface</span><span>v1.1</span></div>
          <div><span className="ad-info-label">Data Source</span><span>Supabase (database + storage)</span></div>
          <div><span className="ad-info-label">Tracked Records</span><span>{stats.totalBuildings + stats.totalDepartments} total ({stats.totalGalleryImages} building images)</span></div>
        </div>
        <p className="ad-muted" style={{ marginTop: 16 }}>
          Buildings and departments are stored in Supabase. Building photos are uploaded to Supabase Storage and
          shown on both the admin and public dashboards.
        </p>
      </div>

      <div className="ad-panel">
        <h2>Data Management</h2>
        <div className="ad-danger-zone">
          <div>
            <strong>Re-sync admin data</strong>
            <p className="ad-muted">Reloads every building and department from the database. Nothing is deleted.</p>
          </div>
          <button className="ad-btn-danger" onClick={() => setConfirmOpen(true)}>Re-sync Data</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Re-sync all data?"
        message="This reloads every building and department from the database. Unsaved form changes will be lost."
        confirmLabel="Re-sync"
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}