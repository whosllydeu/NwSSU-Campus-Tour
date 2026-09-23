import { useState } from 'react';
import { useCampusData } from "../context/DataContext";
import DeptCard from '../components/DeptCard';
import { Navbar } from "../components";

export default function Departments() {
  const { data } = useCampusData();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q
    ? data.departments.filter((d) =>
        d.name.toLowerCase().includes(q) || (d.abbr && d.abbr.toLowerCase().includes(q))
      )
    : data.departments
  ;

  return (
    <>
      <Navbar/>
      <section className="page active" id="page-departments">
        <div className="inner-page">
          <div className="page-header">
            <h1>Academic Departments</h1>
            <p>Colleges, faculty members &amp; student organizations</p>
          </div>

          <div className="page-search">
            <span className="page-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search departments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <div className="page-search-empty">No departments match "{query}".</div>
          ) : (
            <div className="dept-list" id="deptList">
              {shown.map((d) => <DeptCard key={d.id} d={d} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}