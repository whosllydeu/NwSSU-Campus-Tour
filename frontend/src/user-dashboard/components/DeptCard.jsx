import { useState } from 'react';
import { useUI } from '../context/UIContext';
import { useCampusData } from '../context/DataContext';
import { resolveImage } from '../utils/assets';
import { ChevronRight, GraduationCap } from 'lucide-react';

const count = (list) => (Array.isArray(list) ? list.length : 0);

export default function DeptCard({ d }) {
  const { openDept } = useUI();
  const { buildings } = useCampusData();
  const building = buildings.find((b) => b.dept === d.id) || buildings.find((b) => b.id === d.id);
  const src = resolveImage(d.photo || building?.photo || '');
  const [errored, setErrored] = useState(false);
  const hasImg = Boolean(src) && !errored;
  const orgs = count(d.organizations);

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
            <GraduationCap size={26} color={d.color || 'currentColor'} aria-hidden="true" />
          )}
        </div>
        <div className="dh-badge" style={{ background: d.color }}>{d.abbr}</div>
        <div className="dh-text">
          <h3>{d.name}</h3>
          <p>
            {count(d.programs)} programs · {count(d.faculty)} faculty ·{' '}
            {orgs} org{orgs === 1 ? '' : 's'}
          </p>
        </div>
        <span className="dh-chevron">
          <ChevronRight size={30}/>
        </span>
      </div>
    </div>
  );
}