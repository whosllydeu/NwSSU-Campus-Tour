import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';

const PIE_COLORS = ['#2a6624', '#c8a84b', '#1a3a6b', '#8b1a1a', '#1a6b5a', '#b5611a', '#4a1a6b', '#e8c96a'];

function toCsv(rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => escape(Array.isArray(r[h]) ? r[h].join('; ') : r[h])).join(',')));
  return lines.join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function groupActivityByDay(activity, days) {
  const cutoff = Date.now() - days * 86400000;
  const buckets = {};
  activity.filter((a) => new Date(a.ts).getTime() >= cutoff).forEach((a) => {
    const day = a.ts.slice(0, 10);
    buckets[day] = (buckets[day] || 0) + 1;
  });
  return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export default function Reports() {
  const { isLoading, buildings, departments, organizations, activity, stats } = useAdmin();
  const { showToast } = useUI();
  const [typeFilter, setTypeFilter] = useState('all');
  const [activityRange, setActivityRange] = useState(30);

  const buildingTypeData = useMemo(() => {
    const source = typeFilter === 'all' ? buildings : buildings.filter((b) => b.type === typeFilter);
    const byType = source.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }, [buildings, typeFilter]);

  const programsByCollege = useMemo(
    () => departments.map((d) => ({ name: d.abbr, programs: d.programs?.length ?? 0 })),
    [departments]
  );

  const orgsByCollege = useMemo(() => {
    const byCollege = organizations.reduce((acc, o) => { acc[o.college] = (acc[o.college] || 0) + 1; return acc; }, {});
    return Object.entries(byCollege).map(([college, count]) => ({ name: college, value: count }));
  }, [organizations]);

  const activityTrend = useMemo(() => groupActivityByDay(activity, activityRange), [activity, activityRange]);

  if (isLoading) return <div className="ad-loading">Crunching numbers…</div>;

  function exportBuildingsCsv() {
    const headers = ['name', 'abbr', 'type', 'location', 'programs', 'offices'];
    downloadCsv('buildings-report.csv', toCsv(buildings, headers));
    showToast('Buildings report exported');
  }

  return (
    <>
      <div className="ad-panel">
        <div className="ad-panel-header">
          <h2>Filters</h2>
        </div>
        <div className="ad-filters-row">
          <label>
            Building type
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              <option value="academic">Academic</option>
              <option value="admin">Admin</option>
              <option value="facility">Facility</option>
            </select>
          </label>
          <label>
            Activity window
            <select value={activityRange} onChange={(e) => setActivityRange(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <div className="ad-filters-actions">
            <button className="btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print Report</button>
            <button className="btn-gold btn-sm" onClick={exportBuildingsCsv}>⬇ Export CSV</button>
          </div>
        </div>
      </div>

      <div className="ad-two-col">
        <div className="ad-panel">
          <h2>Buildings by Type</h2>
          <div className="ad-chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buildingTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="type" stroke="#c8c0aa" fontSize={12} />
                <YAxis stroke="#c8c0aa" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#162a12', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 8, color: '#f0ebe0' }} />
                <Bar dataKey="count" fill="#c8a84b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ad-panel">
          <h2>Organizations by College</h2>
          <div className="ad-chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={orgsByCollege} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d) => d.name}>
                  {orgsByCollege.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#162a12', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 8, color: '#f0ebe0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ad-panel">
        <h2>Programs Offered per College</h2>
        <div className="ad-chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={programsByCollege}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#c8c0aa" fontSize={12} />
              <YAxis stroke="#c8c0aa" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#162a12', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 8, color: '#f0ebe0' }} />
              <Bar dataKey="programs" fill="#2a6624" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ad-panel">
        <h2>Admin Activity Trend</h2>
        {activityTrend.length === 0 ? (
          <p className="ad-muted">No admin edits recorded in this window yet.</p>
        ) : (
          <div className="ad-chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="#c8c0aa" fontSize={12} />
                <YAxis stroke="#c8c0aa" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#162a12', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 8, color: '#f0ebe0' }} />
                <Legend />
                <Line type="monotone" dataKey="count" name="Edits" stroke="#c8a84b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="ad-panel">
        <h2>Summary</h2>
        <p className="ad-muted">
          {stats.totalBuildings} buildings, {stats.totalDepartments} departments, {stats.totalOffices} offices and{' '}
          {stats.totalOrganizations} organizations are currently tracked. {stats.totalPrograms} academic programs are
          offered across {stats.totalDepartments} colleges, supported by {stats.totalFaculty} listed faculty members.
        </p>
      </div>
    </>
  );
}
