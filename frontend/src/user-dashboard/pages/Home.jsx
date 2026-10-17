import { useNavigate } from "react-router-dom";
import { COLLEGES, QUICK } from "../static/campusData";
import { useUI } from "../context/UIContext";
import { Navbar } from "../components";
import CampusMiniMap from "../components/CampusMiniMap";

export default function Home() {
  const navigate = useNavigate();
  const { openBuilding, openDept } = useUI();

  return (
    <>
      <Navbar/>
      <main className="page active" id="page-home">
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
                <CampusMiniMap onOpen={() => navigate('/map')} />
              </div>
            </div>
          </div>
        </div>

        <div className="home-section">
          <div className="sec-hd"><h2>Quick Access</h2><p>Jump to key locations</p></div>
          <div className="quick-grid">
            {QUICK.map((q) => (
              <button className="qbtn" key={q.id} 
                onClick={() => openBuilding(q.id)}
              >
                <span>{q.icon}</span><small>{q.label}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="home-section alt">
          <div className="sec-hd"><h2>Academic Colleges</h2><p>Seven colleges offering diverse programs</p></div>
          <div className="college-grid">
            {COLLEGES.map((c) => (
              <div className="clg-card" key={c.id} 
                onClick={() => openDept(c.id)}
              >
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
      </main>
    </>
  );
}