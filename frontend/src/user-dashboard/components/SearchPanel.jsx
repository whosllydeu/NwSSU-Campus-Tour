import { useMemo, useEffect, useRef } from 'react';
import { Building2, GraduationCap } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useCampusData } from '../context/DataContext';
import { resolveImage } from '../utils/assets';
import '../stylesheets/gallery.css';

function ResultIcon({ item }) {
  if (item.image) {
    return (
      <div className="sp-ico has-img">
        <img src={item.image} alt="" aria-hidden="true" loading="lazy" />
      </div>
    );
  }
  const Icon = item.type === 'Department' ? GraduationCap : Building2;
  return (
    <div className="sp-ico">
      <Icon size={18} aria-hidden="true" />
    </div>
  );
}

export default function SearchPanel() {
  const {
    searchQuery, setSearchQuery,
    openBuilding, openDept,
  } = useUI();
  const { buildings, departments } = useCampusData();
  const panelRef = useRef(null);

  const index = useMemo(() => [
    ...buildings.map((b) => ({
      key: `b-${b.id}`, name: b.name, type: 'Building', image: resolveImage(b.photo),
      run: () => openBuilding(b.id),
    })),
    ...departments.map((d) => ({
      key: `d-${d.id}`, name: `${d.name} (${d.abbr})`, type: 'Department', image: resolveImage(d.photo),
      run: () => openDept(d.id),
    })),
  ], [buildings, departments, openBuilding, openDept]);

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
                <ResultIcon item={r} />
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