import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import { listProfiles, updateUserRole } from '../services/users.service.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function Users() {
  const { profile: currentProfile } = useAuth();
  const { showToast } = useUI();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState(null); // { id, email, nextRole }

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      setProfiles(await listProfiles());
    } catch (err) {
      showToast(err.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refetch(); }, [refetch]);

  const adminCount = profiles.filter((p) => p.role === 'admin').length;

  function requestRoleChange(row) {
    const nextRole = row.role === 'admin' ? 'user' : 'admin';
    if (nextRole === 'user' && row.id === currentProfile?.id && adminCount <= 1) {
      showToast("You're the only admin — promote someone else first.");
      return;
    }
    setPending({ id: row.id, email: row.email, nextRole });
  }

  async function confirmRoleChange() {
    if (!pending) return;
    try {
      await updateUserRole(pending.id, pending.nextRole);
      setProfiles((prev) => prev.map((p) => (p.id === pending.id ? { ...p, role: pending.nextRole } : p)));
      showToast(`${pending.email} is now ${pending.nextRole}.`);
    } catch (err) {
      showToast(err.message || 'Role change failed.');
    } finally {
      setPending(null);
    }
  }

  if (isLoading) return <div className="ad-loading">Loading users…</div>;

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h2>All Users</h2>
        <span className="ad-table-count">{profiles.length} account{profiles.length === 1 ? '' : 's'}</span>
      </div>

      <div className="ad-table-scroll">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Joined</th>
              <th className="ad-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 && (
              <tr><td colSpan={5} className="ad-empty-row">No users yet.</td></tr>
            )}
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.email || '—'}</td>
                <td>{p.full_name || '—'}</td>
                <td><span className={`ad-chip type-${p.role}`}>{p.role}</span></td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                <td className="ad-row-actions">
                  <button
                    className={p.role === 'admin' ? 'ad-icon-btn danger' : 'btn-primary btn-sm'}
                    onClick={() => requestRoleChange(p)}
                  >
                    {p.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.nextRole === 'admin' ? 'Promote to admin?' : 'Demote to user?'}
        message={
          pending?.nextRole === 'admin'
            ? `${pending?.email} will be able to add, edit, and delete all campus data.`
            : `${pending?.email} will lose admin access to this dashboard.`
        }
        confirmLabel={pending?.nextRole === 'admin' ? 'Promote' : 'Demote'}
        danger={pending?.nextRole !== 'admin'}
        onConfirm={confirmRoleChange}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
