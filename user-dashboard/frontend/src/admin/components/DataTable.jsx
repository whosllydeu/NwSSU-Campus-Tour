import { useMemo, useState } from 'react';

const PAGE_SIZE = 8;

export default function DataTable({ columns, rows, keyField = '_id', onEdit, onDelete, searchPlaceholder = 'Search…', emptyLabel = 'No records yet.' }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleSearch(v) {
    setQuery(v);
    setPage(1);
  }

  return (
    <div className="ad-table-wrap">
      <div className="ad-table-toolbar">
        <div className="ad-search-box">
          <span className="ad-search-icon">⌕</span>
          <input
            type="text"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <span className="ad-table-count">{sorted.length} record{sorted.length === 1 ? '' : 's'}</span>
      </div>

      <div className="ad-table-scroll">
        <table className="ad-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} onClick={() => c.sortable !== false && toggleSort(c.key)} className={c.sortable === false ? '' : 'sortable'}>
                  {c.label}
                  {sortKey === c.key && <span className="ad-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                </th>
              ))}
              <th className="ad-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="ad-empty-row">{emptyLabel}</td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr key={row[keyField]}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>
                ))}
                <td className="ad-row-actions">
                  <button className="ad-icon-btn" title="Edit" onClick={() => onEdit(row)}>✏️</button>
                  <button className="ad-icon-btn danger" title="Delete" onClick={() => onDelete(row)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ad-pagination">
          <button className="btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  );
}
