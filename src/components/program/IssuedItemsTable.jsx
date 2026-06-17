import { useState, useMemo } from 'react';

const FLOW_TYPES = ['Center to Hub', 'Hub to Facility'];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ROWS_PER_PAGE = 10;

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

/**
 * Issued Items table shared across program pages.
 * Accepts rows of shape:
 *   { id, date (YYYY-MM-DD), item, hub, facilityType, quantity, invoice, issuedTo, region }
 *
 * flowType filter: 'Center to Hub' | 'Hub to Facility'
 * monthFilter: 0-indexed month number ('' = all)
 */
function IssuedItemsTable({ rows = [] }) {
  const [flowType, setFlowType] = useState('Center to Hub');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = rows.filter((r) => r.flowType === flowType);
    if (monthFilter !== '') {
      result = result.filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === Number(monthFilter);
      });
    }
    return result;
  }, [rows, flowType, monthFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / ROWS_PER_PAGE), 1);
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  const start = filtered.length > 0 ? (page - 1) * ROWS_PER_PAGE + 1 : 0;
  const end = Math.min(page * ROWS_PER_PAGE, filtered.length);

  const handleFlowChange = (type) => {
    setFlowType(type);
    setPage(1);
  };

  const handleMonthChange = (m) => {
    setMonthFilter(m);
    setPage(1);
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-outline-variant">
        {/* Flow toggle */}
        <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-outline-variant/40">
          {FLOW_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFlowChange(type)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                flowType === type
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <div className="relative">
          <select
            value={monthFilter}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="appearance-none h-9 min-w-[130px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            aria-label="Filter by month"
          >
            <option value="">All months</option>
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-primary pointer-events-none" />
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
          Rows per page: 10 &nbsp;·&nbsp; {start}–{end} of {filtered.length}
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
