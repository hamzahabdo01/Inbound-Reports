import SimplePagination from '../../components/SimplePagination';

export const formatAmount = (v) => {
  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
};

export function Table({ headers, rows, renderRow, className = '', page, setPage, rowsPerPage = 15 }) {
  if (!rows.length) {
    return <div className="p-6 text-center text-body-sm text-on-surface-variant">No records</div>;
  }
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const displayRows = page ? rows.slice((page - 1) * rowsPerPage, page * rowsPerPage) : rows;
  return (
    <div>
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {headers.map((h) => (
                <th key={h.key} className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase ${h.className || ''}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {displayRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-container-low transition-colors">
                {renderRow(row, i)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page && setPage && (
        <SimplePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={rowsPerPage}
          onPageChange={setPage}
          label="records"
        />
      )}
    </div>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-body-sm text-on-surface ${className}`}>{children}</td>;
}

export function StatusBadge({ status }) {
  const map = {
    Open: 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    Overdue: 'bg-error/10 text-error',
    Completed: 'bg-success/10 text-success',
    Active: 'bg-success/10 text-success',
    Expired: 'bg-surface-container text-on-surface-variant',
    Critical: 'bg-error/10 text-error',
    Warning: 'bg-warning/10 text-warning',
    'Received at Warehouse': 'bg-success/10 text-success',
    'Contract Signed': 'bg-primary/10 text-primary',
    'PO Issued': 'bg-primary/10 text-primary',
    'LC Opened': 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'Port Arrival': 'bg-warning/10 text-warning',
    Cleared: 'bg-success/10 text-success',
    Received: 'bg-success/10 text-success',
    Verified: 'bg-success/10 text-success',
    Confiscated: 'bg-error/10 text-error',
    Extended: 'bg-warning/10 text-warning',
  };
  const cls = map[status] || 'bg-surface-container text-on-surface-variant';
  return <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${cls}`}>{status}</span>;
}

export function SectionPanel({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-level-1">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50">
        <div>
          <h3 className="text-title-sm font-bold text-on-surface">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
