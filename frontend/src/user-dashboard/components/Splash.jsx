import { useState, useEffect } from 'react';

export default function Splash() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div id="splash" className={`splash${gone ? ' gone' : ''}`}>
      <div className="splash-orbs">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>
      <div className="splash-inner">
        <div className="splash-logo-wrap">
          <svg className="spin-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="4" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke="#c8a84b" strokeWidth="4"
              strokeDasharray="100 240" strokeLinecap="round" className="spin-arc"
            />
          </svg>
          <div className="splash-emblem">N</div>
        </div>
        <h1 className="splash-title">
          Northwest Samar<br />State University
        </h1>
        <p className="splash-sub">Interactive Campus Tour &amp; Navigation</p>
        <div className="splash-progress"><div className="splash-fill" /></div>
        <span className="splash-loading-text">Loading campus data…</span>
      </div>
    </div>
  );
}
