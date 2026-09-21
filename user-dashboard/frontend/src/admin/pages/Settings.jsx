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
    showToast('All admin data reset to defaults');
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="ad-panel">
        <h2>System Information</h2>
        <div className="ad-info-grid">
          <div><span className="ad-info-label">Application</span><span>NWSSU Campus Tour</span></div>
          <div><span className="ad-info-label">Admin Interface</span><span>v1.0 — Frontend only</span></div>
          <div><span className="ad-info-label">Data Source</span><span>Local browser storage (no backend connected yet)</span></div>
          <div><span className="ad-info-label">Tracked Records</span><span>{stats.totalBuildings + stats.totalDepartments + stats.totalOffices + stats.totalOrganizations} total</span></div>
        </div>
        <p className="ad-muted" style={{ marginTop: 16 }}>
          This admin panel currently reads and writes to your browser's local storage. Once a backend API is
          available, the same add/edit/delete actions here can be wired to real endpoints without changing the page
          layouts.
        </p>
      </div>

      <div className="ad-panel">
        <h2>Data Management</h2>
        <div className="ad-danger-zone">
          <div>
            <strong>Reset all admin data</strong>
            <p className="ad-muted">Clears every edit you've made in this browser and restores the original campus tour dataset.</p>
          </div>
          <button className="ad-btn-danger" onClick={() => setConfirmOpen(true)}>Reset to Defaults</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset all data?"
        message="This clears every building, department, office, and organization edit stored in this browser. This can't be undone."
        confirmLabel="Reset Everything"
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
