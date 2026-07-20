import BaseTable, { ColumnDef } from '../BaseTable';

function formatDate(raw) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return raw;
  }
}

function formatEstimate(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return new Intl.NumberFormat('en').format(n);
}

function RecentReceivesTable({ rows }: any) {
  const columns: ColumnDef[] = [
    { key: 'FullDate', label: 'Date', className: 'whitespace-nowrap', render: (row) => formatDate(row.FullDate) },
    { key: 'Supplier', label: 'Supplier' },
    { key: 'Manufacturer', label: 'Manufacturer' },
    { key: 'Country', label: 'Country' },
    { key: 'QuantityReceived', label: 'Quantity', render: (row) => formatEstimate(row.QuantityReceived) },
    { key: 'AmountReceivedBirr', label: 'Value (ETB)', className: 'font-semibold text-primary', render: (row) => formatEstimate(row.AmountReceivedBirr) },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={rows}
      minWidth="760px"
      headerBg="bg-[#CFD8DC]"
      rowKey={(row) => `${row.RowNumber}-${row.ProductCN}`}
      rowClassName="hover:bg-surface-container-low"
    />
  );
}

export default RecentReceivesTable;
