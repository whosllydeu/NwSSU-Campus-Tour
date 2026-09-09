import { useState } from 'react';
import { useCampusData } from '../context/CampusDataContext.jsx';
import BuildingCard from '../components/BuildingCard.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'academic', label: 'Academic' },
  { key: 'admin', label: 'Administrative' },
  { key: 'facility', label: 'Facilities' },
];

export default function Buildings() {
  const { buildings } = useCampusData();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const byType = filter === 'all' ? buildings : buildings.filter((b) => b.type === filter);
  const q = query.trim().toLowerCase();
  const shown = q
    ? byType.filter((b) =>
        b.name.toLowerCase().includes(q) || (b.abbr && b.abbr.toLowerCase().includes(q))
      )
    : byType;

  return (
    <section className="page active" id="page-buildings">
      <div className="inner-page">
        <div className="page-header">
          <h1>Campus Buildings</h1>
          <p>All buildings and facilities at NWSSU</p>
        </div>

        <div className="page-search">
          <span className="page-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search buildings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`fbtn${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="page-search-empty">No buildings match "{query}".</div>
        ) : (
          <div className="bldg-grid" id="buildingsGrid">
            {shown.map((b) => <BuildingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>
    </section>
  );
}