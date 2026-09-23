// Placeholder content — replace the text below with the real About Us copy
// (mission/vision, history, contact details, etc.) whenever it's ready.

import { Navbar } from "../components";

export default function About() {
  return (
    <>
      <Navbar/>
      <section className="page active" id="page-about">
        <div className="inner-page">
          <div className="page-header">
            <h1>About Us</h1>
            <p>Northwestern Samar State University — Calbayog City, Samar</p>
          </div>

          <div className="ds-desc" style={{ maxWidth: 720, margin: '0 auto' }}>
            <p>
              Northwestern Samar State University (NWSSU) has served students in Calbayog City
              since 1983, offering programs across seven colleges. This Campus Tour app helps
              prospective and current students explore buildings, departments, and offices around
              campus.
            </p>
            <p style={{ marginTop: 16, opacity: 0.7 }}>
              📝 This is placeholder content — swap in the real mission/vision, history, and
              contact details in <code>src/pages/About.jsx</code>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
