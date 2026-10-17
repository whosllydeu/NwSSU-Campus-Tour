import { useUI } from '../context/UIContext';
import { useCampusData } from '../context/DataContext';
import { capitalize } from '../utils/helpers';
import { hasTour } from '../static/nwssuTour';
import { resolveImage } from '../utils/assets';
import { findBuildingTourId } from '../utils/panorama';
import { Building2, GraduationCap } from 'lucide-react';
import Photo from './Photo';
import BuildingGallery from './BuildingGallery';

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

function PhotoNote({ rawPhoto }) {
  return (
    <div className="ds-photo-note">
      {resolveImage(rawPhoto) ? (
        <p>📷 Tap or click the photo to view full-size.</p>
      ) : (
        <p>
          📷 <strong>No photo uploaded yet.</strong><br />
          An administrator can upload one from the Admin Dashboard → Buildings.
        </p>
      )}
    </div>
  );
}

const asList = (list) => (Array.isArray(list) ? list : []);

function HeroVisual({ photo, kind = 'building', color }) {
  const src = resolveImage(photo);
  if (src) {
    return (
      <div className="ds-hero-emoji has-img">
        <img className="ds-hero-thumb" src={src} alt="" aria-hidden="true" />
      </div>
    );
  }
  const Icon = kind === 'dept' ? GraduationCap : Building2;
  return (
    <div className="ds-hero-emoji" style={{ color }}>
      <Icon size={140} strokeWidth={1.2} aria-hidden="true" />
    </div>
  );
}

function ContactIcon({ photo, name }) {
  const src = resolveImage(photo);
  if (src) {
    return (
      <div className="ds-contact-icon has-img">
        <img className="ds-contact-thumb" src={src} alt={name} />
      </div>
    );
  }
  return (
    <div className="ds-contact-icon">
      <Building2 size={40} strokeWidth={1.4} aria-hidden="true" />
    </div>
  );
}

function BuildingDetail({ id }) {
  const { closeDetail, openTour, openUnavailable } = useUI();
  const { buildings, departments } = useCampusData();
  const b = buildings.find((x) => x.id === id);
  if (!b) return null;

  const tourId = findBuildingTourId(b, departments, hasTour);

  const startTour = () => {
    if (tourId) openTour(tourId);
    else openUnavailable('Virtual tour is currently not available for this location yet.');
  };

  const dept = departments.find((d) => d.id === b.dept) || departments.find((d) => d.id === id);
  const programs = asList(b.programs).length ? b.programs : asList(dept?.programs);
  const offices = asList(b.offices);
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
        <HeroVisual photo={rawPhoto} kind="building" color={b.color} />
        <div className="ds-hero-content">
          <button className="ds-back-btn" onClick={closeDetail}>← Back</button>
          <div className="ds-tag">{capitalize(b.type || 'facility')} Building</div>
          <h1 className="ds-title">{b.name}</h1>
          <div className="ds-meta">
            {b.location && <div className="ds-meta-item">📍 {b.location}</div>}
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
          <Photo photo={rawPhoto} color={b.color} name={b.name} context="hero" />
          <PhotoNote rawPhoto={rawPhoto} />
        </div>

        <BuildingGallery building={b} />

        {b.desc && <p className="ds-desc">{b.desc}</p>}

        <div className="ds-sections">
          <Section title="🏢 Offices Inside" items={offices} />
          <Section title="📚 Programs Offered" items={programs} />
          <Section title="👨‍🏫 Faculty" items={dept?.faculty} />
          <Section title="⭐ Student Officers" items={dept?.officers} />
          <Section title="🏆 Organizations" items={dept?.organizations} />
        </div>

        <div className="ds-contact-card">
          <ContactIcon photo={rawPhoto} name={b.name} />
          <div className="ds-contact-info">
            <h4>{b.name}</h4>
            <p>📍 {b.location || 'NWSSU Campus'}{b.hours ? `${NBSP_DOT}🕐 ${b.hours}` : ''}</p>
          </div>
        </div>

        <div className="ds-actions">
          <button className="btn-ghost" onClick={closeDetail}>← Go Back</button>
        </div>
      </div>
    </>
  );
}

function DeptDetail({ id }) {
  const { closeDetail, openTour, openUnavailable } = useUI();
  const { buildings, departments } = useCampusData();
  const d = departments.find((x) => x.id === id);
  if (!d) return null;

  const building = buildings.find((b) => b.dept === id) || buildings.find((b) => b.id === id);
  const rawPhoto = d.photo || building?.photo || '';
  const programs = asList(d.programs);
  const faculty = asList(d.faculty);
  const officers = asList(d.officers);
  const organizations = asList(d.organizations);
  const offices = asList(d.offices).length ? d.offices : asList(building?.offices);
  const tourId = hasTour(d.id) ? d.id : (findBuildingTourId(building, [d], hasTour) || undefined);

  const startTour = () => {
    if (tourId) openTour(tourId);
    else openUnavailable('Virtual tour is currently not available for this location yet.');
  };

  return (
    <>
      <div className="ds-hero" style={{ minHeight: 260 }}>
        <div className="ds-hero-bg" style={{ background: `linear-gradient(160deg,${d.color}55,${d.color}11)` }} />
        <div className="ds-hero-pattern" />
        <HeroVisual photo={rawPhoto} kind="dept" color={d.color} />
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
            <div className="ds-meta-item">📚 {programs.length} Program{programs.length === 1 ? '' : 's'}</div>
            <div className="ds-meta-item">👨‍🏫 {faculty.length} Faculty</div>
            <div className="ds-meta-item">🏆 {organizations.length} Org{organizations.length === 1 ? '' : 's'}</div>
          </div>
          <div className="ds-stats">
            <Stat val={programs.length} lab="Programs" />
            <Stat val={faculty.length} lab="Faculty" />
            <Stat val={officers.length} lab="Officers" />
            <Stat val={organizations.length} lab="Orgs" />
          </div>
        </div>
      </div>

      <div className="ds-body">
        <div className="ds-primary-actions">
          <button className="btn-primary ds-tour-btn" onClick={startTour}>🌐 Start Virtual Tour</button>
        </div>

        <div className="ds-photo-row">
          <Photo photo={rawPhoto} color={d.color} name={building?.name || d.name} context="hero" />
          <PhotoNote rawPhoto={rawPhoto} />
        </div>

        {building && <BuildingGallery building={building} />}

        {building?.desc && <p className="ds-desc">{building.desc}</p>}

        <div className="ds-sections">
          <Section title="🏢 Offices" items={offices} />
          <Section title="📚 Programs Offered" items={programs} />
          <Section title="👨‍🏫 Faculty Members" items={faculty} />
          <Section title="⭐ Student Officers" items={officers} />
          <Section title="🏆 Student Organizations" items={organizations} />
        </div>

        {building && (
          <div className="ds-contact-card">
            <ContactIcon photo={building.photo || rawPhoto} name={building.name} />
            <div className="ds-contact-info">
              <h4>{building.name}</h4>
              <p>📍 {building.location || 'NWSSU Campus'}{building.hours ? `${NBSP_DOT}🕐 ${building.hours}` : ''}</p>
            </div>
          </div>
        )}

        <div className="ds-actions">
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