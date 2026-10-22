import { cloneElement, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useAdmin } from '../context/AdminContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import nwssuLogo from '../../assets/images/nwssu-logo.jpg';
import '../styles/report-print.css';
import { TYPE_LABEL, exportReportExcel, exportBuildingsCsv } from '../utils/reportExport.js';

const PIE_COLORS = ['#2f6b45', '#64748b', '#3b6fb6', '#d0a12c', '#2a8a7a', '#b45309', '#7c5cbf', '#9ca3af'];
const AXIS = '#6b7280';
const GRID = '#e5e7eb';
const TOOLTIP = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' };

const list = (v) => (Array.isArray(v) ? v.filter((x) => String(x ?? '').trim()) : []);
const hasCoords = (b) => b.lat !== null && b.lng !== null && Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng));
const fmtDate = (iso, withTime = true) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });

const PRINT_WIDTH = 640; // fits an A4 page

/* Fills the screen width normally; uses a fixed paper width while printing. */
function ChartBox({ height, printing, children }) {
  return printing
    ? cloneElement(children, { width: PRINT_WIDTH, height })
    : <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>;
}

function activityInWindow(activity, days) {
  const cutoff = Date.now() - days * 86400000;
  return activity.filter((a) => new Date(a.ts).getTime() >= cutoff);
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
  const { profile, session } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [activityRange, setActivityRange] = useState(30);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Ctrl+P / browser menu printing also gets the paper-sized charts
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);

  function printReport() {
    flushSync(() => setPrinting(true));
    window.print();
    setPrinting(false);
  }

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

  const filteredBuildings = useMemo(
    () => (typeFilter === 'all' ? buildings : buildings.filter((b) => b.type === typeFilter)),
    [buildings, typeFilter]
  );

  const recentActivity = useMemo(() => activityInWindow(activity, activityRange), [activity, activityRange]);

  if (isLoading) return <div className="ad-loading">Crunching numbers…</div>;


  const buildingName = (id) => buildings.find((b) => b.dept === id)?.name || '—';
  const preparedBy = profile?.full_name || profile?.name || profile?.email || session?.user?.email || 'Administrator';

  async function exportExcel() {
    setExporting(true);
    try {
      await exportReportExcel({
        buildings: filteredBuildings,
        allBuildings: buildings,
        departments,
        activity: recentActivity,
        stats,
        filters: { typeLabel: typeFilter === 'all' ? 'All types' : TYPE_LABEL[typeFilter], days: activityRange },
        preparedBy,
      });
      showToast('Excel report downloaded');
    } catch (err) {
      showToast(`Could not export: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  function exportCsv() {
    exportBuildingsCsv(filteredBuildings, departments);
    showToast('Buildings CSV downloaded');
  }

  return (
    <>
      <div className="ad-panel rp-screen-only">
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
            <button className="btn-ghost btn-sm" onClick={printReport}>🖨️ Print Report</button>
            <button className="btn-gold btn-sm" onClick={exportExcel} disabled={exporting}>{exporting ? 'Preparing…' : '⬇ Export Excel'}</button>
            <button className="btn-ghost btn-sm" onClick={exportCsv}>⬇ CSV</button>
          </div>
        </div>
      </div>

      {/* ---------- Printed / PDF version: full system data ---------- */}
      <section className="rp-print-only rp-doc" aria-hidden="true">
        <header className="rp-head">
          <img src={nwssuLogo} alt="" />
          <div>
            <div className="rp-uni">Northwest Samar State University</div>
            <div className="rp-sub">Calbayog City, Samar</div>
            <h1>CampusTour System Report</h1>
          </div>
        </header>
        <div className="rp-meta">
          <span><b>Date generated:</b> {fmtDate(new Date().toISOString())}</span>
          <span><b>Prepared by:</b> {preparedBy}</span>
          <span><b>Building type:</b> {typeFilter === 'all' ? 'All types' : TYPE_LABEL[typeFilter]}</span>
          <span><b>Activity window:</b> Last {activityRange} days</span>
        </div>

        <h2>1. Summary</h2>
        <table className="rp-table rp-kv">
          <tbody>
            <tr><th>Total buildings</th><td>{stats.totalBuildings}</td><th>Academic programs</th><td>{stats.totalPrograms}</td></tr>
            <tr><th>Buildings with photo</th><td>{stats.buildingsWithPhoto}</td><th>Faculty listed</th><td>{stats.totalFaculty}</td></tr>
            <tr><th>Additional images</th><td>{stats.totalGalleryImages}</td><th>Colleges / departments</th><td>{stats.totalDepartments}</td></tr>
            <tr>
              <th>By type</th>
              <td colSpan={3}>
                {Object.entries(stats.byType).map(([t, n]) => `${TYPE_LABEL[t] || t}: ${n}`).join(' · ') || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rp-print-only rp-doc" aria-hidden="true">
        <h2>2. Buildings ({filteredBuildings.length})</h2>
        <table className="rp-table">
          <thead>
            <tr><th>#</th><th>Building</th><th>Type</th><th>Location</th><th>Offices inside</th><th>Programs</th><th>Photo</th><th>Map</th></tr>
          </thead>
          <tbody>
            {filteredBuildings.map((b, i) => (
              <tr key={b.id}>
                <td>{i + 1}</td>
                <td><b>{b.name}</b>{b.abbr ? ` (${b.abbr})` : ''}</td>
                <td>{TYPE_LABEL[b.type] || b.type || '—'}</td>
                <td>{b.location || '—'}</td>
                <td>{list(b.offices).join(', ') || '—'}</td>
                <td>{list(b.programs).length || '—'}</td>
                <td>{b.photo ? 'Yes' : 'No'}{list(b.images).length ? ` +${list(b.images).length}` : ''}</td>
                <td>{hasCoords(b) ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rp-print-only rp-doc" aria-hidden="true">
        <h2>3. Colleges and Departments ({departments.length})</h2>
        {departments.map((d) => (
          <div className="rp-dept" key={d.id}>
            <h3>{d.name}{d.abbr ? ` (${d.abbr})` : ''}</h3>
            <table className="rp-table rp-kv">
              <tbody>
                <tr><th>Building</th><td>{buildingName(d.id)}</td></tr>
                <tr><th>Programs offered ({list(d.programs).length})</th><td>{list(d.programs).join('; ') || '—'}</td></tr>
                <tr><th>Faculty ({list(d.faculty).length})</th><td>{list(d.faculty).join('; ') || '—'}</td></tr>
                <tr><th>Offices</th><td>{list(d.offices).join('; ') || '—'}</td></tr>
                {list(d.officers).length > 0 && <tr><th>Student council officers</th><td>{list(d.officers).join('; ')}</td></tr>}
                {list(d.organizations).length > 0 && <tr><th>Organizations</th><td>{list(d.organizations).join('; ')}</td></tr>}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section className="rp-print-only rp-doc" aria-hidden="true">
        <h2>4. Admin Activity — last {activityRange} days ({recentActivity.length})</h2>
        {recentActivity.length === 0 ? (
          <p>No admin edits recorded in this window.</p>
        ) : (
          <table className="rp-table">
            <thead><tr><th>Date</th><th>Action</th><th>Record</th><th>Item</th></tr></thead>
            <tbody>
              {recentActivity.map((a) => (
                <tr key={a.id}>
                  <td>{fmtDate(a.ts)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.action}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.entity}</td>
                  <td>{a.label || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rp-print-only rp-doc rp-charts-head" aria-hidden="true">
        <h2>5. Charts</h2>
      </section>
      <div className="ad-two-col">
        <div className="ad-panel">
          <h2>Buildings by Type</h2>
          <div className="ad-chart-box">
            <ChartBox height={260} printing={printing}>
              <BarChart data={buildingTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="type" stroke={AXIS} fontSize={12} />
                <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar isAnimationActive={!printing} dataKey="count" fill="#2f6b45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartBox>
          </div>
        </div>

        <div className="ad-panel">
          <h2>Building Photo Coverage</h2>
          <div className="ad-chart-box">
            <ChartBox height={260} printing={printing}>
              <PieChart>
                <Pie isAnimationActive={!printing} data={photoCoverage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d) => `${d.name}: ${d.value}`}>
                  {photoCoverage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ChartBox>
          </div>
        </div>
      </div>

      <div className="ad-panel">
        <h2>Programs Offered per College</h2>
        <div className="ad-chart-box">
          <ChartBox height={280} printing={printing}>
            <BarChart data={programsByCollege}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP} />
              <Bar isAnimationActive={!printing} dataKey="programs" fill="#64748b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartBox>
        </div>
      </div>

      <div className="ad-panel">
        <h2>Admin Activity Trend</h2>
        {activityTrend.length === 0 ? (
          <p className="ad-muted">No admin edits recorded in this window yet.</p>
        ) : (
          <div className="ad-chart-box">
            <ChartBox height={240} printing={printing}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={12} />
                <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend />
                <Line isAnimationActive={!printing} type="monotone" dataKey="count" name="Edits" stroke="#2f6b45" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartBox>
          </div>
        )}
      </div>

      <div className="ad-panel rp-screen-only">
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