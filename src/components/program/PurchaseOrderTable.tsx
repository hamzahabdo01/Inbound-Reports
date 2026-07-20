import BaseTable, { ColumnDef } from '../BaseTable';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

function PurchaseOrderTable({ rows }: any) {
  const columns: ColumnDef[] = [
    { key: 'po', label: 'PO. Number', className: 'font-semibold text-primary whitespace-nowrap' },
    { key: 'date', label: 'Date' },
    { key: 'donor', label: 'Donor' },
    { key: 'procurer', label: 'Procurer' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'ordered', label: 'Ordered', render: (row) => formatNumber(row.ordered) },
    { key: 'shipped', label: 'Shipped', render: (row) => formatNumber(row.shipped) },
    { key: 'received', label: 'Recieved', render: (row) => formatNumber(row.received) },
    { key: 'pending', label: 'Pending', render: (row) => formatNumber(row.pending) },
    {
      key: 'completed',
      label: 'Recieve Completed',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-20 h-2 rounded-full bg-surface-container overflow-hidden">
            <span className="block h-full bg-success" style={{ width: `${Math.min(Number(row.completed), 100)}%` }} />
          </span>
          <span className="text-[11px] font-bold text-on-surface-variant">{row.completed}%</span>
        </div>
      ),
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={rows}
      minWidth="820px"
      headerBg="bg-[#CFD8DC]"
      rowKey={(row, index) => row.po || index}
      rowClassName="hover:bg-surface-container-low"
    />
  );
}

export default PurchaseOrderTable;
