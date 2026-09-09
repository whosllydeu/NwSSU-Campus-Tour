import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';

const QUICK = [
  { id: 'library', icon: '📚', label: 'Library' },
  { id: 'registrar', icon: '📋', label: 'Registrar' },
  { id: 'cashier', icon: '💳', label: 'Cashier' },
  { id: 'canteen', icon: '🍽️', label: 'Canteen' },
  { id: 'president', icon: '🏛️', label: 'President' },
  { id: 'hotel', icon: '🏨', label: 'Hotel' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'alumni', icon: '🎓', label: 'Alumni' },
];

const COLLEGES = [
  { id: 'cat',  color: '#2d5a27', code: 'CAT',  title: 'College of Agriculture', desc: 'Agricultural sciences, crop production, animal science & agri-business management' },
  { id: 'ccis', color: '#1a3a6b', code: 'CCIS', title: 'College of Computing & Information Sciences', desc: 'IT, Computer Science, Information Systems & Software Engineering programs' },
  { id: 'ccjs', color: '#8b1a1a', code: 'CCJS', title: 'College of Criminal Justice & Science', desc: 'Criminology, forensic science & criminal justice administration' },
  { id: 'coed', color: '#c8a84b', code: 'COED', title: 'College of Education', desc: 'Teacher education programs for elementary, secondary & special education' },
  { id: 'con',  color: '#1a6b5a', code: 'CON',  title: 'College of Nursing', desc: 'BS Nursing with clinical training, simulation labs & health sciences' },
  { id: 'com',  color: '#b5611a', code: 'COM',  title: 'College of Management', desc: 'Business administration, management, entrepreneurship & hospitality programs' },
  { id: 'cea',  color: '#4a1a6b', code: 'CEA',  title: 'College of Engineering & Architecture', desc: 'Civil, electrical, mechanical engineering & architecture programs' },
];

const MINI_MAP = [
  { code: 'CAT',  left: '8%',  top: '12%', bg: '#2d5a27' },
  { code: 'CCIS', left: '29%', top: '10%', bg: '#1a3a6b' },
  { code: 'LIB',  left: '50%', top: '8%',  bg: '#555' },
  { code: 'COED', left: '68%', top: '11%', bg: '#c8a84b' },
  { code: 'CEA',  left: '85%', top: '10%', bg: '#4a1a6b' },
  { code: 'CON',  left: '9%',  top: '44%', bg: '#1a6b5a' },
  { code: 'COM',  left: '29%', top: '42%', bg: '#b5611a' },
  { code: 'ADM',  left: '47%', top: '40%', bg: '#2c3e50', big: true },
  { code: 'CCJS', left: '83%', top: '42%', bg: '#8b1a1a' },
];

export default function Home() {
  const navigate = useNavigate();
  const { openBuilding, openDept } = useUI();

  return (
    <section className="page active" id="page-home">
      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">🌿 Est. 1983 · Calbayog City, Samar</div>
            <h1 className="hero-h1">
              Explore <em>NWSSU</em><br className="br-hide" /> — Your Campus,<br className="br-show" /> Your Home.
            </h1>
            <p className="hero-p">
              Discover buildings, navigate facilities, and find everything you need — all in one interactive campus platform.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/map')}>🗺️ Open Campus Map</button>
              <button className="btn-ghost" onClick={() => navigate('/buildings')}>🏛️ Explore Buildings →</button>
            </div>
          </div>
          <div className="hero-card-wrap">
            <div className="hero-card">
              <div className="hcard-top">
                <span>Campus Overview</span>
                <span className="hcard-live">● Live</span>
              </div>
              <div className="hcard-stats">
                <div className="hs-item"><b>7</b><span>Colleges</span></div>
                <div className="hs-div" />
                <div className="hs-item"><b>20+</b><span>Buildings</span></div>
                <div className="hs-div" />
                <div className="hs-item"><b>50+</b><span>Offices</span></div>
              </div>
              <div className="hcard-mini-map" onClick={() => navigate('/map')}>
                <div className="hmm-inner">
                  <div className="hmm-road rh" />
                  <div className="hmm-road rv" />
                  {MINI_MAP.map((m) => (
                    <div
                      key={m.code}
                      className={`hmm-b${m.big ? ' big' : ''}`}
                      style={{ left: m.left, top: m.top, background: m.bg }}
                    >
                      {m.code}
                    </div>
                  ))}
                  <div className="hmm-tap">View all buildings →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div className="home-section">
        <div className="sec-hd"><h2>Quick Access</h2><p>Jump to key locations</p></div>
        <div className="quick-grid">
          {QUICK.map((q) => (
            <button className="qbtn" key={q.id} onClick={() => openBuilding(q.id)}>
              <span>{q.icon}</span><small>{q.label}</small>
            </button>
          ))}
        </div>
      </div>

      {/* ── Academic Colleges ── */}
      <div className="home-section alt">
        <div className="sec-hd"><h2>Academic Colleges</h2><p>Seven colleges offering diverse programs</p></div>
        <div className="college-grid">
          {COLLEGES.map((c) => (
            <div className="clg-card" key={c.id} onClick={() => openDept(c.id)}>
              <div className="clg-strip" style={{ background: c.color }} />
              <div className="clg-body">
                <span className="clg-code" style={{ color: c.color }}>{c.code}</span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
              <span className="clg-chevron">›</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
