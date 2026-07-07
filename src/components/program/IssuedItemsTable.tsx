import { useState, useMemo } from 'react';
import BaseTable, { ColumnDef } from '../BaseTable';

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

  const columns: ColumnDef[] = [
    { key: 'item', label: 'Item', className: 'font-semibold' },
    { key: 'hub', label: 'Hub' },
    { key: 'quantity', label: 'Quantity', render: (row) => formatNumber(row.quantity) },
    { key: 'invoice', label: 'Invoice', className: 'font-mono', render: (row) => row.invoice || '—' },
    { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
    { key: 'region', label: 'Region-Zone-Woreda', render: (row) => row.region || '—' },
    { key: 'amount', label: 'Amount (ETB)', className: 'font-semibold text-primary', render: (row) => formatNumber(row.amount) },
  ];

  return (
    <div>
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

      <BaseTable
        columns={columns}
        rows={paginated}
        emptyMessage="No records"
        minWidth="820px"
        headerBg="bg-[#CFD8DC]"
        rowKey={(row, idx) => row.id || idx}
        rowClassName="hover:bg-surface-container-low"
        pagination={{
          page,
          totalPages,
          total: rows.length,
          rowsPerPage: ROWS_PER_PAGE,
          onChange: setPage,
          info: <>Rows per page: 10 &nbsp;·&nbsp; {start}&ndash;{end} of {rows.length}</>,
        }}
      />
    </div>
  );
}

export default IssuedItemsTable;
