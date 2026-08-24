import { useUI } from '../context/UIContext.jsx';
import { OFFICES, ORGANIZATIONS } from '../data/data.js';
import { slugify } from '../data/arDestinations.js';
import { img } from '../utils/assets.js';

// Local images (in src/assets/images) must go through img() so Vite bundles
// them; full http(s) URLs (e.g. Unsplash) are used as-is.
function resolvePhoto(photo) {
  if (!photo) return '';
  return /^https?:\/\//.test(photo) ? photo : img(photo);
}

function OfficeContent({ index }) {
  const { openAR, closeModal } = useUI();
  const o = OFFICES[index];
  if (!o) return null;
  const arKey = slugify(o.name);
  const photoUrl = resolvePhoto(o.photo);
  return (
    <>
      <div
        className={`m-banner${photoUrl ? ' has-photo' : ''}`}
        style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : { background: 'rgba(42,102,36,0.2)', fontSize: 64 }}
      >
        {photoUrl ? (
          <span className="m-banner-icon-badge">{o.icon}</span>
        ) : (
          o.icon
        )}
        {/* Always visible. If this office has no coordinates yet in
            arDestinations.js, tapping shows a "not measured yet" message. */}
        <button
          className="btn-primary ds-ar-btn m-banner-ar-pill"
          onClick={() => { closeModal(); openAR(arKey); }}
        >
          🧭 Walk There (AR)
        </button>
      </div>
      <div className="m-title">{o.name}</div>
      <div className="m-sub">📍 {o.location} · ⏰ {o.hours}</div>
      <div className="m-desc">{o.desc}</div>
    </>
  );
}

function OrgContent({ index }) {
  const o = ORGANIZATIONS[index];
  if (!o) return null;
  return (
    <>
      <div className="m-banner" style={{ background: 'rgba(42,102,36,0.2)', fontSize: 64 }}>👥</div>
      <div className="m-title">
        {o.name} <span style={{ fontSize: 14, opacity: 0.4 }}>({o.abbr})</span>
      </div>
      <div className="m-sub">🏫 {o.college}</div>
      <div className="m-grid">
        <div className="m-sec">
          <h4>👑 Officers</h4>
          <ul>
            <li>President: {o.president}</li>
            <li>Vice President: {o.vp}</li>
            <li>Secretary: {o.secretary}</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default function Modal() {
  const { modal, closeModal } = useUI();
  const open = Boolean(modal);

  return (
    <div className={`modal-overlay${open ? ' open' : ''}`} id="modalOverlay" onClick={closeModal}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={closeModal}>✕</button>
        <div id="modalContent">
          {modal?.kind === 'office' && <OfficeContent index={modal.index} />}
          {modal?.kind === 'org' && <OrgContent index={modal.index} />}
        </div>
      </div>
    </div>
  );
}