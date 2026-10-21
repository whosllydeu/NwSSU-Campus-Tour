import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';

// Chart width used while printing, so every chart fits inside a portrait page.
const PRINT_CHART_WIDTH = 600;

const PIE_COLORS = ['#2f6b45', '#64748b', '#3b6fb6', '#d0a12c', '#2a8a7a', '#b45309', '#7c5cbf', '#9ca3af'];
const AXIS = '#6b7280';
const GRID = '#e5e7eb';
const TOOLTIP = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' };

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
  const { isLoading, buildings, departments, activity, stats } = useAdmin();
  const { showToast } = useUI();
  const [typeFilter, setTypeFilter] = useState('all');
  const [activityRange, setActivityRange] = useState(30);
  const [printing, setPrinting] = useState(false);

  // Charts normally stretch to the screen width. Before printing, redraw them at a
  // fixed page width (and without animation) so nothing is cut off in the PDF.
  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const timer = setTimeout(() => {
      window.print();
      done();
    }, 400);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);

  const chartWidth = printing ? PRINT_CHART_WIDTH : '100%';

  const buildingTypeData = useMemo(() => {
    const source = typeFilter === 'all' ? buildings : buildings.filter((b) => b.type === typeFilter);
    const byType = source.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }, [buildings, typeFilter]);

  const programsByCollege = useMemo(
    () => departments.map((d) => ({ name: d.abbr, programs: d.programs?.length ?? 0 })),
    [departments]
  );

  const photoCoverage = useMemo(() => {
    const withPhoto = buildings.filter((b) => Boolean(b.photo)).length;
    return [
      { name: 'With photo', value: withPhoto },
      { name: 'No photo yet', value: buildings.length - withPhoto },
    ].filter((d) => d.value > 0);
  }, [buildings]);

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
            <button className="btn-ghost btn-sm" onClick={() => setPrinting(true)} disabled={printing}>🖨️ Print Report</button>
            <button className="btn-gold btn-sm" onClick={exportBuildingsCsv}>⬇ Export CSV</button>
          </div>
        </div>
      </div>

      <div className="ad-two-col" style={printing ? { gridTemplateColumns: '1fr' } : undefined}>
        <div className="ad-panel">
          <h2>Buildings by Type</h2>
          <div className="ad-chart-box">
            <ResponsiveContainer width={chartWidth} height={260}>
              <BarChart data={buildingTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="type" stroke={AXIS} fontSize={12} />
                <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" fill="#2f6b45" radius={[6, 6, 0, 0]} isAnimationActive={!printing} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ad-panel">
          <h2>Building Photo Coverage</h2>
          <div className="ad-chart-box">
            <ResponsiveContainer width={chartWidth} height={260}>
              <PieChart>
                <Pie data={photoCoverage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} isAnimationActive={!printing} label={(d) => `${d.name}: ${d.value}`}>
                  {photoCoverage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ad-panel">
        <h2>Programs Offered per College</h2>
        <div className="ad-chart-box">
          <ResponsiveContainer width={chartWidth} height={280}>
            <BarChart data={programsByCollege}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP} />
              <Bar dataKey="programs" fill="#64748b" radius={[6, 6, 0, 0]} isAnimationActive={!printing} />
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
            <ResponsiveContainer width={chartWidth} height={240}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={12} />
                <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend />
                <Line type="monotone" dataKey="count" name="Edits" stroke="#2f6b45" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={!printing} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="ad-panel">
        <h2>Summary</h2>
        <p className="ad-muted">
          {stats.totalBuildings} buildings ({stats.buildingsWithPhoto} with a photo, {stats.totalGalleryImages} additional
          images) and {stats.totalDepartments} departments are currently tracked. {stats.totalPrograms} academic programs are
          offered across {stats.totalDepartments} colleges, supported by {stats.totalFaculty} listed faculty members.
        </p>
      </div>
    </>
  );
}
