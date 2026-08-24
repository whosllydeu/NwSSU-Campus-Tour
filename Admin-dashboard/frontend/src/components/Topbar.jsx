export default function Topbar({ title, subtitle, onMenuClick }) {
  return (
    <header className="ad-topbar">
      <button className="ad-menu-btn" aria-label="Toggle admin menu" onClick={onMenuClick}>
        <span /><span /><span />
      </button>
      <div className="ad-topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="ad-topbar-admin">
        <div className="ad-admin-avatar">A</div>
        <div className="ad-admin-meta">
          <span className="ad-admin-name">Administrator</span>
          <span className="ad-admin-role">NWSSU CampusTour</span>
        </div>
      </div>
    </header>
  );
}
