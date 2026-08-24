import { useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { BUILDINGS } from '../data/data.js';
import { img } from '../utils/assets.js';

export default function DeptCard({ d }) {
  const { openDept } = useUI();
  const building = BUILDINGS.find((b) => b.id === d.id || b.dept === d.id);
  const emoji = building?.emoji || '🎓';
  const src = img(d.photo || building?.photo || '');
  const [errored, setErrored] = useState(false);
  const hasImg = Boolean(src) && !errored;

  return (
    <div className="dept-card" id={`dept-${d.id}`} onClick={() => openDept(d.id)}>
      <div className="dept-hd">
        <div
          className={`dept-thumb-sm${hasImg ? ' has-img' : ''}`}
          style={{ background: `${d.color}33` }}
        >
          {hasImg ? (
            <img src={src} alt={d.name} loading="lazy" onError={() => setErrored(true)} />
          ) : (
            <span>{emoji}</span>
          )}
        </div>
        <div className="dh-badge" style={{ background: d.color }}>{d.abbr}</div>
        <div className="dh-text">
          <h3>{d.name}</h3>
          <p>
            {d.programs.length} programs · {d.faculty.length} faculty ·{' '}
            {d.organizations.length} org{d.organizations.length > 1 ? 's' : ''}
          </p>
        </div>
        <span className="dh-chevron">›</span>
      </div>
    </div>
  );
}
