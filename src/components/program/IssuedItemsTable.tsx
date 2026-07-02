import { useState, useMemo } from 'react';

const ROWS_PER_PAGE = 10;

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

function IssuedItemsTable({ rows = [], fromDate, toDate, onFromChange, onToChange }: any) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(Math.ceil(rows.length / ROWS_PER_PAGE), 1);
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [rows, page]);

  const start = rows.length > 0 ? (page - 1) * ROWS_PER_PAGE + 1 : 0;
  const end = Math.min(page * ROWS_PER_PAGE, rows.length);

  return (
    <div>
      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <label className="text-label-sm text-on-surface-variant whitespace-nowrap">From:</label>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => { onFromChange(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-outline-variant bg-white px-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-label-sm text-on-surface-variant whitespace-nowrap">To:</label>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => { onToChange(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-outline-variant bg-white px-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-[#CFD8DC]">
            <tr>
              {['Item', 'Hub', 'Quantity', 'Invoice', 'Date', 'Region-Zone-Woreda', 'Amount (ETB)'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-body-sm text-on-surface-variant">
                  No records
                </td>
              </tr>
            ) : paginated.map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-surface-container-low hover:bg-surface-container-low">
                <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{row.item}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.hub}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{formatNumber(row.quantity)}</td>
                <td className="px-4 py-3 text-body-md text-on-surface font-mono">{row.invoice || '—'}</td>
                <td className="px-4 py-3 text-body-md text-on-surface whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.region || '—'}</td>
                <td className="px-4 py-3 text-body-md font-semibold text-primary">{formatNumber(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface-variant">
        <span>
          Rows per page: 10 &nbsp;·&nbsp; {start}–{end} of {rows.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            aria-label="Previous page"
          >
            <i className="fa-solid fa-chevron-left text-[11px]" />
          </button>
          <span className="font-medium text-on-surface min-w-[4ch] text-center">{page}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            aria-label="Next page"
          >
            <i className="fa-solid fa-chevron-right text-[11px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IssuedItemsTable;
