import React, { useState, useMemo } from 'react';

export const Table = ({
  columns = [],
  rows = [],
  searchable = false,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found',
  pageSize = 10,
  onRowClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (!sortKey) return 0;
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortKey, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] w-64 font-mono"
          />
          <span className="text-[11px] font-mono text-slate-400">
            {sortedRows.length} total entries
          </span>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-700/80 rounded-xl bg-slate-850 shadow-sm">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-slate-900/90 border-b border-slate-750 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.key && handleSort(col.key)}
                  className={`py-3.5 px-4 font-semibold ${
                    col.key ? 'cursor-pointer select-none hover:text-[var(--brand-accent)]' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.key && sortKey === col.key && (
                      <span className="text-[var(--brand-accent)] text-[10px]">
                        {sortAsc ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-850/60">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-500 font-mono text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-800/80' : 'hover:bg-slate-800/50'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-3 px-4 ${col.className || ''}`}>
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-mono">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
