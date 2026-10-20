import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Copy, Download, KeyRound, Megaphone, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdmin } from '../context/AdminContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/ToastContext.jsx';
import { getAnnouncement, saveAnnouncement } from '../../user-dashboard/services/siteSettings.service';
import { pathwayNodesMissingGps } from '../../user-dashboard/static/nwssuTour';

const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '');
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME;
const MAX_ANNOUNCEMENT = 160;

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

const hasCoords = (b) => Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng)) && b.lat !== null && b.lng !== null;

/* ---------------- 1. Change password ---------------- */
function ChangePassword() {
  const { profile, session } = useAuth();
  const { showToast } = useUI();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const email = profile?.email || session?.user?.email || '';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('The new password must be at least 8 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');
    if (next === current) return setError('The new password must be different from the current one.');

    setBusy(true);
    try {
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) throw new Error('Your current password is incorrect.');
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) throw upErr;
      setCurrent(''); setNext(''); setConfirm('');
      showToast('Password changed');
    } catch (err) {
      setError(err.message || 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-panel">
      <h2><KeyRound size={18} className="st-h-icon" /> Change Password</h2>
      <form className="st-form" onSubmit={submit}>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <label>
          <span>Current password</span>
          <input type="password" name="current-password" autoComplete="current-password" value={current}
            onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label>
          <span>New password</span>
          <input type="password" name="new-password" autoComplete="new-password" value={next}
            onChange={(e) => setNext(e.target.value)} minLength={8} required />
        </label>
        <label>
          <span>Confirm new password</span>
          <input type="password" name="confirm-password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </label>
        {error && <p className="st-error">{error}</p>}
        <div className="st-actions">
          <span className="ad-muted">At least 8 characters. You stay logged in after changing it.</span>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Change Password'}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- 4. Site announcement ---------------- */
function SiteAnnouncement() {
  const { showToast } = useUI();
  const [form, setForm] = useState({ enabled: false, text: '', tone: 'info' });
  const [state, setState] = useState('loading'); // loading | ready | missing
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getAnnouncement()
      .then((a) => { if (alive) { setForm(a); setState('ready'); } })
      .catch(() => { if (alive) setState('missing'); });
    return () => { alive = false; };
  }, []);

  async function save() {
    setBusy(true);
    try {
      const saved = await saveAnnouncement(form);
      setForm(saved);
      showToast(saved.enabled && saved.text ? 'Announcement is live on the campus tour' : 'Announcement saved (hidden)');
    } catch (err) {
      showToast(`Could not save: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-panel">
      <h2><Megaphone size={18} className="st-h-icon" /> Site Announcement</h2>
      {state === 'missing' ? (
        <p className="st-error">
          The <code>site_settings</code> table was not found. Run <code>supabase/site_settings.sql</code> in the Supabase SQL Editor, then reload this page.
        </p>
      ) : (
        <div className="st-form">
          <p className="ad-muted">A short message shown at the top of the visitor site, e.g. “Enrollment week: the Registrar is at the Gym.” Visitors can close it.</p>
          <label>
            <span>Message</span>
            <textarea name="announcement" rows={2} maxLength={MAX_ANNOUNCEMENT} value={form.text}
              disabled={state === 'loading'} placeholder="Type the announcement…"
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
            <small className="st-count">{form.text.length}/{MAX_ANNOUNCEMENT}</small>
          </label>
          <div className="st-row">
            <label className="st-inline">
              <span>Style</span>
              <select name="announcement-tone" value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}>
                <option value="info">Info (green)</option>
                <option value="warning">Reminder (gold)</option>
                <option value="urgent">Urgent (red)</option>
              </select>
            </label>
            <label className="st-switch">
              <input type="checkbox" name="announcement-enabled" checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
              <span>Show on the campus tour</span>
            </label>
          </div>
          {form.text.trim() && (
            <div className={`st-preview is-${form.tone}`}>
              <Megaphone size={16} /> <span>{form.text}</span>
            </div>
          )}
          <div className="st-actions">
            <span className="ad-muted">{form.enabled ? 'Visible to visitors after you save.' : 'Hidden from visitors.'}</span>
            <button type="button" className="btn-primary" disabled={busy || state !== 'ready'} onClick={save}>
              {busy ? 'Saving…' : 'Save Announcement'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 7. Data check ---------------- */
function DataCheck() {
  const { buildings, departments } = useAdmin();
  const [open, setOpen] = useState(null);

  const checks = useMemo(() => {
    const linked = new Set(buildings.map((b) => b.dept).filter(Boolean));
    const noGps = pathwayNodesMissingGps();
    return [
      { id: 'photo', label: 'Buildings without a photo', to: '/admin/buildings', items: buildings.filter((b) => !b.photo).map((b) => b.name) },
      { id: 'desc', label: 'Buildings without a description', to: '/admin/buildings', items: buildings.filter((b) => !String(b.desc || '').trim()).map((b) => b.name) },
      { id: 'coords', label: 'Buildings without map coordinates', to: '/admin/buildings', items: buildings.filter((b) => !hasCoords(b)).map((b) => b.name) },
      { id: 'dept', label: 'Departments not linked to a building', to: '/admin/departments', items: departments.filter((d) => !linked.has(d.id)).map((d) => d.name) },
      { id: 'gps', label: 'Pathway 360° photos without GPS', to: '/admin/tours', items: noGps.map((n) => n.id) },
    ];
  }, [buildings, departments]);

  const problems = checks.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="ad-panel">
      <h2><ShieldCheck size={18} className="st-h-icon" /> Data Check</h2>
      <p className="ad-muted">
        {problems === 0 ? 'Everything looks complete. 🎉' : `${problems} item${problems === 1 ? '' : 's'} to review before they confuse visitors.`}
      </p>
      <ul className="st-checks">
        {checks.map((c) => {
          const ok = c.items.length === 0;
          const isOpen = open === c.id;
          return (
            <li key={c.id} className={ok ? 'is-ok' : 'is-warn'}>
              <button type="button" className="st-check-row" disabled={ok} onClick={() => setOpen(isOpen ? null : c.id)}>
                <span className="st-check-dot">{ok ? '✓' : '!'}</span>
                <span className="st-check-label">{c.label}</span>
                <span className="st-check-count">{ok ? 'OK' : c.items.length}</span>
              </button>
              {isOpen && !ok && (
                <div className="st-check-list">
                  <div>{c.items.slice(0, 12).join(' · ')}{c.items.length > 12 ? ` · +${c.items.length - 12} more` : ''}</div>
                  <Link to={c.to} className="st-link">Fix it →</Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- 10. System info + QR ---------------- */
function SystemInfo() {
  const { stats, resetAllData } = useAdmin();
  const { showToast } = useUI();
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(SITE_URL, { width: 480, margin: 1, color: { dark: '#1e4d1a', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      showToast('Link copied');
    } catch {
      showToast(SITE_URL);
    }
  }

  async function refresh() {
    await resetAllData();
    showToast('Data refreshed from the database');
  }

  return (
    <div className="ad-panel">
      <h2>System Information</h2>
      <div className="st-sys">
        <div className="st-sys-info">
          <div className="ad-info-grid">
            <div><span className="ad-info-label">Application</span><span>NwSSU CampusTour</span></div>
            <div><span className="ad-info-label">Last deployed</span><span>{fmtDateTime(BUILD_TIME)}</span></div>
            <div><span className="ad-info-label">Data source</span><span>Supabase (database + storage)</span></div>
            <div><span className="ad-info-label">Records</span><span>{stats.totalBuildings} buildings · {stats.totalDepartments} departments · {stats.totalGalleryImages} images</span></div>
          </div>
          <div className="st-link-row">
            <span className="ad-info-label">Visitor site</span>
            <div className="st-url">
              <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL.replace(/^https?:\/\//, '')}</a>
              <button type="button" className="btn-ghost btn-sm" onClick={copyLink}><Copy size={14} /> Copy link</button>
            </div>
          </div>
          <button type="button" className="btn-ghost btn-sm st-refresh" onClick={refresh}>
            <RefreshCw size={14} /> Refresh data
          </button>
        </div>

        <div className="st-qr">
          {qr ? <img src={qr} alt={`QR code for ${SITE_URL}`} /> : <div className="st-qr-empty">QR</div>}
          <span>Scan to open the Campus Tour</span>
          {qr && (
            <a className="btn-primary btn-sm" href={qr} download="nwssu-campustour-qr.png">
              <Download size={14} /> Download QR
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="st">
      <SystemInfo />
      <div className="st-grid">
        <ChangePassword />
        <SiteAnnouncement />
      </div>
      <DataCheck />
    </div>
  );
}