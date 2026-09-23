import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import StatCard from '../components/StatCard.jsx';

const ACTION_ICON = { created: '➕', updated: '✏️', deleted: '🗑️' };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Overview() {
  const { isLoading, stats, activity } = useAdmin();

  if (isLoading) {
    return (
      <div className="ad-skeleton-grid">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="ad-skeleton-card" />)}
      </div>
    );
  }

  const typeEntries = Object.entries(stats.byType);
  const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));

  return (
    <>
      <div className="ad-stat-grid">
        <StatCard icon="🏛️" label="Total Buildings" value={stats.totalBuildings} accent="green" />
        <StatCard icon="🎓" label="Departments" value={stats.totalDepartments} accent="gold" />
        <StatCard icon="🏢" label="Offices" value={stats.totalOffices} accent="blue" />
        <StatCard icon="👥" label="Organizations" value={stats.totalOrganizations} accent="teal" />
      </div>

      <div className="ad-two-col">
        <div className="ad-panel">
          <h2>Buildings by Type</h2>
          <div className="ad-bar-list">
            {typeEntries.length === 0 && <p className="ad-muted">No building data.</p>}
            {typeEntries.map(([type, count]) => (
              <div className="ad-bar-row" key={type}>
                <span className="ad-bar-label">{type}</span>
                <div className="ad-bar-track">
                  <div className="ad-bar-fill" style={{ width: `${(count / maxType) * 100}%` }} />
                </div>
                <span className="ad-bar-value">{count}</span>
              </div>
            ))}
          </div>
          <div className="ad-panel-footer">
            <span>{stats.totalPrograms} programs across all colleges</span>
            <span>{stats.totalFaculty} faculty listed</span>
          </div>
        </div>

        <div className="ad-panel">
          <h2>Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="ad-muted">No changes yet — edits you make will show up here.</p>
          ) : (
            <ul className="ad-activity-feed">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="ad-activity-icon">{ACTION_ICON[a.action] || '•'}</span>
                  <span className="ad-activity-text">
                    <strong>{a.entity}</strong> "{a.label}" was {a.action}
                  </span>
                  <span className="ad-activity-time">{timeAgo(a.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="ad-panel">
        <h2>Quick Links</h2>
        <div className="ad-quicklinks">
          <Link to="/admin/buildings" className="btn-ghost">Manage Buildings</Link>
          <Link to="/admin/departments" className="btn-ghost">Manage Departments</Link>
          <Link to="/admin/offices" className="btn-ghost">Manage Offices</Link>
          <Link to="/admin/organizations" className="btn-ghost">Manage Organizations</Link>
          <Link to="/admin/reports" className="btn-gold">View Reports</Link>
        </div>
      </div>
    </>
  );
}
