import { useMemo, useEffect, useRef } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { useCampusData } from '../context/CampusDataContext.jsx';

export default function SearchPanel() {
  const {
    searchQuery, setSearchQuery,
    openBuilding, openDept, showOfficeModal, showOrgModal,
  } = useUI();
  const { buildings, departments, offices, organizations } = useCampusData();
  const panelRef = useRef(null);

  // Combined search index (mirrors SEARCH_INDEX from the original data.js).
  const index = useMemo(() => [
    ...buildings.map((b) => ({
      key: `b-${b.id}`, name: b.name, type: 'Building', icon: b.emoji,
      run: () => openBuilding(b.id),
    })),
    ...departments.map((d) => ({
      key: `d-${d.id}`, name: `${d.name} (${d.abbr})`, type: 'Department', icon: '🎓',
      run: () => openDept(d.id),
    })),
    ...offices.map((o, i) => ({
      key: `o-${i}`, name: o.name, type: 'Office', icon: o.icon,
      run: () => showOfficeModal(i),
    })),
    ...organizations.map((o, i) => ({
      key: `g-${i}`, name: `${o.name} (${o.abbr})`, type: 'Organization', icon: '👥',
      run: () => showOrgModal(i),
    })),
  ], [buildings, departments, offices, organizations, openBuilding, openDept, showOfficeModal, showOrgModal]);

  const q = searchQuery.trim().toLowerCase();
  const show = q.length > 0;

  const results = useMemo(() => {
    if (!q) return [];
    return index
      .filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [index, q]);

  // Click-outside closes the panel (clears the query).
  useEffect(() => {
    if (!show) return;
    const onDocClick = (e) => {
      if (e.target.closest('.nav-search-box') || e.target.closest('#searchPanel')) return;
      setSearchQuery('');
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [show, setSearchQuery]);

  const handleRun = (item) => {
    item.run();
    setSearchQuery('');
  };

  return (
    <div className={`search-panel${show ? ' show' : ''}`} id="searchPanel" ref={panelRef}>
      {show && (
        results.length === 0 ? (
          <div className="sp-head">No results for "{searchQuery}"</div>
        ) : (
          <>
            <div className="sp-head">Results for "{searchQuery}"</div>
            {results.map((r) => (
              <div className="sp-item" key={r.key} onClick={() => handleRun(r)}>
                <div className="sp-ico">{r.icon}</div>
                <div>
                  <div className="sp-name">{r.name}</div>
                  <div className="sp-type">{r.type}</div>
                </div>
              </div>
            ))}
          </>
        )
      )}
    </div>
  );
}