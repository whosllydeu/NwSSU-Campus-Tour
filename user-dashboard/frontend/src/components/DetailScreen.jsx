import { useUI } from '../context/UIContext.jsx';
import { useCampusData } from '../context/CampusDataContext.jsx';
import { capitalize } from '../utils/helpers.js';
import { hasTour } from '../data/ccisTour.js';
import Photo from './Photo.jsx';

const NBSP_DOT = '\u00A0·\u00A0';

function Section({ title, items }) {
  if (!items || !items.length) return null;
  return (
    <div className="ds-section">
      <div className="ds-section-title">{title}</div>
      <ul className="ds-list">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

function Stat({ val, lab }) {
  return (
    <div className="ds-stat">
      <span className="ds-stat-val">{val}</span>
      <span className="ds-stat-lab">{lab}</span>
    </div>
  );
}

function PhotoNote({ rawPhoto, id }) {
  return (
    <div className="ds-photo-note">
      {rawPhoto ? (
        <p>📷 Tap or click the photo to view full-size.</p>
      ) : (
        <p>
          📷 <strong>No photo uploaded yet.</strong><br />
          Drop the image in <code>src/assets/images/</code> folder and set{' '}
          <code>photo: 'images/{id}.jpg'</code> in <code>data.js</code>.
        </p>
      )}
    </div>
  );
}

// ── Building detail ──
function BuildingDetail({ id }) {
  const { closeDetail, openTour, openUnavailable } = useUI();
  const { buildings, departments } = useCampusData();
  const b = buildings.find((x) => x.id === id);
  if (!b) return null;

  const startTour = () => {
    if (hasTour(b.id)) openTour(b.id);
    else openUnavailable('Virtual tour is currently not available for this location yet.');
  };

  const dept = departments.find((d) => d.id === id || d.id === b.dept);
  const programs = b.programs || dept?.programs || [];
  const offices = b.offices || [];
  const rawPhoto = b.photo || dept?.photo || '';

  const stats = [];
  if (b.programs?.length) stats.push({ val: b.programs.length, lab: 'Programs' });
  if (b.offices?.length) stats.push({ val: b.offices.length, lab: 'Offices' });
  if (dept?.faculty?.length) stats.push({ val: dept.faculty.length, lab: 'Faculty' });

  return (
    <>
      <div className="ds-hero" style={{ background: `${b.color}22` }}>
        <div className="ds-hero-bg" style={{ background: `linear-gradient(160deg,${b.color}55,${b.color}11)` }} />
        <div className="ds-hero-pattern" />
        <div className="ds-hero-emoji">{b.emoji}</div>
        <div className="ds-hero-content">
          <button className="ds-back-btn" onClick={closeDetail}>← Back</button>
          <div className="ds-tag">{capitalize(b.type || 'facility')} Building</div>
          <h1 className="ds-title">{b.name}</h1>
          <div className="ds-meta">
            <div className="ds-meta-item">📍 {b.location}</div>
            {b.hours && <div className="ds-meta-item">🕐 {b.hours}</div>}
            {b.abbr && <div className="ds-meta-item">🏷️ {b.abbr}</div>}
          </div>
          {stats.length > 0 && (
            <div className="ds-stats">
              {stats.map((s, i) => <Stat key={i} val={s.val} lab={s.lab} />)}
            </div>
          )}
        </div>
      </div>

      <div className="ds-body">
        <div className="ds-primary-actions">
          <button className="btn-primary ds-tour-btn" onClick={startTour}>🌐 Start Virtual Tour</button>
        </div>

        <div className="ds-photo-row">
          <Photo photo={rawPhoto} emoji={b.emoji} color={b.color} name={b.name} context="hero" tourId={hasTour(b.id) ? b.id : undefined} />
          {hasTour(b.id)
            ? <div className="ds-photo-note"><p>🌐 <strong>Tap the photo to start the virtual tour.</strong></p></div>
            : <PhotoNote rawPhoto={rawPhoto} id={b.id} />}
        </div>

        <p className="ds-desc">{b.desc}</p>

        <div className="ds-sections">
          <Section title="🏢 Offices Inside" items={offices} />
          <Section title="📚 Programs Offered" items={programs} />
          <Section title="👨‍🏫 Faculty" items={dept?.faculty} />
          <Section title="⭐ Student Officers" items={dept?.officers} />
          <Section title="🏆 Organizations" items={dept?.organizations} />
        </div>

        <div className="ds-contact-card">
          <div className="ds-contact-icon">{b.emoji}</div>
          <div className="ds-contact-info">
            <h4>{b.name}</h4>
            <p>📍 {b.location}{b.hours ? `${NBSP_DOT}🕐 ${b.hours}` : ''}</p>
          </div>
        </div>

        <div className="ds-actions">
          <button className="btn-ghost" onClick={closeDetail}>← Go Back</button>
        </div>
      </div>
    </>
  );
}

// ── Department detail ──
function DeptDetail({ id }) {
  const { closeDetail, openTour, openUnavailable } = useUI();
  const { buildings, departments } = useCampusData();
  const d = departments.find((x) => x.id === id);
  if (!d) return null;

  const building = buildings.find((b) => b.id === id || b.dept === id);
  const emoji = building?.emoji || '🎓';
  const rawPhoto = d.photo || building?.photo || '';
  const tourId = hasTour(d.id) ? d.id : (building && hasTour(building.id) ? building.id : undefined);

  const startTour = () => {
    if (tourId) openTour(tourId);
    else openUnavailable('Virtual tour is currently not available for this location yet.');
  };

  return (
    <>
      <div className="ds-hero" style={{ minHeight: 260 }}>
        <div className="ds-hero-bg" style={{ background: `linear-gradient(160deg,${d.color}55,${d.color}11)` }} />
        <div className="ds-hero-pattern" />
        <div className="ds-hero-emoji">{emoji}</div>
        <div className="ds-hero-content">
          <button className="ds-back-btn" onClick={closeDetail}>← Back</button>
          <div
            className="ds-tag"
            style={{ background: `${d.color}22`, borderColor: `${d.color}55`, color: d.color }}
          >
            {d.abbr}
          </div>
          <h1 className="ds-title">{d.name}</h1>
          <div className="ds-meta">
            <div className="ds-meta-item">📚 {d.programs.length} Program{d.programs.length > 1 ? 's' : ''}</div>
            <div className="ds-meta-item">👨‍🏫 {d.faculty.length} Faculty</div>
            <div className="ds-meta-item">🏆 {d.organizations.length} Org{d.organizations.length > 1 ? 's' : ''}</div>
          </div>
          <div className="ds-stats">
            <Stat val={d.programs.length} lab="Programs" />
            <Stat val={d.faculty.length} lab="Faculty" />
            <Stat val={d.officers.length} lab="Officers" />
            <Stat val={d.organizations.length} lab="Orgs" />
          </div>
        </div>
      </div>

      <div className="ds-body">
        <div className="ds-primary-actions">
          <button className="btn-primary ds-tour-btn" onClick={startTour}>🌐 Start Virtual Tour</button>
        </div>

        <div className="ds-photo-row">
          <Photo photo={rawPhoto} emoji={emoji} color={d.color} name={building?.name || d.name} context="hero" tourId={tourId} />
          {tourId
            ? <div className="ds-photo-note"><p>🌐 <strong>Tap the photo to start the virtual tour.</strong></p></div>
            : <PhotoNote rawPhoto={rawPhoto} id={d.id} />}
        </div>

        {building?.desc && <p className="ds-desc">{building.desc}</p>}

        <div className="ds-sections">
          <Section title="📚 Programs Offered" items={d.programs} />
          <Section title="👨‍🏫 Faculty Members" items={d.faculty} />
          <Section title="⭐ Student Officers" items={d.officers} />
          <Section title="🏆 Student Organizations" items={d.organizations} />
        </div>

        {building && (
          <div className="ds-contact-card">
            <div className="ds-contact-icon">{building.emoji}</div>
            <div className="ds-contact-info">
              <h4>{building.name}</h4>
              <p>📍 {building.location}{building.hours ? `${NBSP_DOT}🕐 ${building.hours}` : ''}</p>
            </div>
          </div>
        )}

        <div className="ds-actions">
          <button className="btn-ghost" onClick={closeDetail}>← Go Back</button>
        </div>
      </div>
    </>
  );
}

export default function DetailScreen() {
  const { detail } = useUI();
  const open = Boolean(detail);

  return (
    <div className={`detail-screen${open ? ' open' : ''}`} id="detailScreen">
      <div id="detailScreenInner">
        {detail?.kind === 'building' && <BuildingDetail id={detail.id} />}
        {detail?.kind === 'dept' && <DeptDetail id={detail.id} />}
      </div>
    </div>
  );
}