import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, GraduationCap, Compass, Images, Clock, Plus, Pencil, Trash } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TOURS, TOUR_NODES } from '../../user-dashboard/static/nwssuTour';
import campusPhoto from '../../assets/images/NwSSU.jpg';

const ACTION_ICON = { created: Plus, updated: Pencil, deleted: Trash };
const TYPE_LABEL = { academic: 'Academic', admin: 'Admin', facility: 'Facility' };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const panoCount = (b) => (Array.isArray(b.images) ? b.images.filter((i) => i?.panorama).length : 0);

export default function Overview() {
  const { isLoading, stats, activity, buildings } = useAdmin();
  const { profile } = useAuth();

  const tourCount = useMemo(() => Object.keys(TOURS).length, []);
  const photoCount = TOUR_NODES.length;

  const recentBuildings = useMemo(
    () => [...buildings]
      .sort((a, b) => new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0))
      .slice(0, 6),
    [buildings],
  );

  if (isLoading) {
    return (
      <div className="ad-skeleton-grid">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="ad-skeleton-card" />)}
      </div>
    );
  }

  const name = (profile?.full_name || profile?.email || 'Admin').split('@')[0];
  const typeEntries = Object.entries(stats.byType);
  const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));

  const cards = [
    { Icon: Landmark, value: stats.totalBuildings, label: 'Buildings', chip: `${stats.byType.academic || 0} academic` },
    { Icon: GraduationCap, value: stats.totalDepartments, label: 'Departments', chip: `${stats.totalPrograms} programs` },
    { Icon: Compass, value: tourCount, label: '360° Tours', chip: `${photoCount} photos` },
    { Icon: Images, value: stats.totalGalleryImages, label: 'Uploaded Images', chip: `${stats.buildingsWithPhoto} with cover` },
  ];

  return (
    <div className="ov">
      <div className="ov-main">
        {/* Welcome banner */}
        <section className="ov-welcome">
          <div className="ov-welcome-text">
            <span className="ov-eyebrow">{greeting()}, {name} 👋</span>
            <h1>Welcome to CampusTour Admin</h1>
            <p>Keep NwSSU's buildings, departments and 360° tours up to date so students and visitors always find their way.</p>
            <div className="ov-welcome-actions">
              <Link to="/admin/buildings" className="ov-btn ov-btn-primary">Manage Buildings</Link>
              <Link to="/admin/tours" className="ov-btn ov-btn-ghost">Edit 360° Tours</Link>
            </div>
          </div>
          <div className="ov-welcome-art">
            <img src={campusPhoto} alt="NwSSU campus" />
          </div>
        </section>

        {/* Stat cards */}
        <section className="ov-stats">
          {cards.map(({ Icon, value, label, chip }) => (
            <div className="ov-stat" key={label}>
              <div className="ov-stat-top">
                <span className="ov-stat-icon"><Icon size={18} /></span>
                <span className="ov-chip">{chip}</span>
              </div>
              <div className="ov-stat-value">{value}</div>
              <div className="ov-stat-label">{label}</div>
            </div>
          ))}
        </section>

        {/* Buildings table */}
        <section className="ov-card">
          <div className="ov-card-head">
            <div>
              <h2>Campus Buildings</h2>
              <p>Recently updated building records</p>
            </div>
            <Link to="/admin/buildings" className="ov-link">View all →</Link>
          </div>
          <div className="ov-table-wrap">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Abbr</th>
                  <th>Building</th>
                  <th>Type</th>
                  <th>Programs</th>
                  <th>360° Photos</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBuildings.map((b) => {
                  const pano = panoCount(b);
                  const complete = Boolean(b.photo && (b.desc || b.description));
                  return (
                    <tr key={b.id}>
                      <td className="ov-abbr">{b.abbr}</td>
                      <td>{b.name}</td>
                      <td>{TYPE_LABEL[b.type] || b.type}</td>
                      <td>{b.programs?.length || 0}</td>
                      <td>{pano || '—'}</td>
                      <td>
                        <span className={`ov-status ${complete ? 'is-ok' : 'is-warn'}`}>
                          {complete ? 'Complete' : 'Needs info'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentBuildings.length === 0 && (
                  <tr><td colSpan={6} className="ov-empty">No buildings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="ov-side">
        {/* Latest activity timeline */}
        <section className="ov-card">
          <div className="ov-card-head">
            <div>
              <h2>Latest Activity</h2>
              <p>Changes made in the dashboard</p>
            </div>
          </div>
          {activity.length === 0 ? (
            <p className="ov-empty">No changes yet — edits you make will show up here.</p>
          ) : (
            <ul className="ov-timeline">
              {activity.slice(0, 5).map((a) => {
                const Icon = ACTION_ICON[a.action] || Clock;
                return (
                  <li key={a.id}>
                    <span className={`ov-tl-dot is-${a.action}`}><Icon size={13} /></span>
                    <div className="ov-tl-body">
                      <div className="ov-tl-date">
                        {fmtDate(a.ts)} <b>· {timeAgo(a.ts)}</b>
                      </div>
                      <div className="ov-tl-text">
                        {a.entity} <strong>“{a.label}”</strong> was {a.action}.
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Buildings by type */}
        <section className="ov-card">
          <div className="ov-card-head">
            <div>
              <h2>Buildings by Type</h2>
              <p>{stats.totalFaculty} faculty listed across colleges</p>
            </div>
          </div>
          <div className="ov-bars">
            {typeEntries.map(([type, count]) => (
              <div className="ov-bar" key={type}>
                <span>{TYPE_LABEL[type] || type}</span>
                <div className="ov-bar-track"><div style={{ width: `${(count / maxType) * 100}%` }} /></div>
                <b>{count}</b>
              </div>
            ))}
            {typeEntries.length === 0 && <p className="ov-empty">No building data.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}