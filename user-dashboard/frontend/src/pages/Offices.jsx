import { useState } from 'react';
import { useCampusData } from '../context/CampusDataContext.jsx';
import { useUI } from '../context/UIContext.jsx';

export default function Offices() {
  const { offices } = useCampusData();
  const { showOfficeModal } = useUI();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? offices.filter((o) => o.name.toLowerCase().includes(q)) : offices;

  return (
    <section className="page active" id="page-offices">
      <div className="inner-page">
        <div className="page-header">
          <h1>Campus Offices</h1>
          <p>Administrative and student-service offices at NWSSU</p>
        </div>

        <div className="page-search">
          <span className="page-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search offices…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {shown.length === 0 ? (
          <div className="page-search-empty">No offices match "{query}".</div>
        ) : (
          <div className="offices-grid" id="officesGrid">
            {shown.map((o) => {
              const i = offices.indexOf(o);
              return (
                <div className="off-card" key={o.id || i} onClick={() => showOfficeModal(i)}>
                  <div className="off-ico">{o.icon}</div>
                  <div className="off-name">{o.name}</div>
                  <div className="off-loc">📍 {o.location}</div>
                  <div className="off-hrs">🕐 {o.hours}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}