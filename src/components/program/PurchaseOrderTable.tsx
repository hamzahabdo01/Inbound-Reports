import BaseTable, { ColumnDef } from '../BaseTable';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

function PurchaseOrderTable({ rows }: any) {
  const columns: ColumnDef[] = [
    { key: 'PurchaseOrderNumber', label: 'PO Number', className: 'font-semibold text-primary' },
    { key: 'ProductCN', label: 'Item' },
    { key: 'Donor', label: 'Funding source' },
    { key: 'OrderQuantity', label: 'Ordered', render: (row) => formatNumber(row.OrderQuantity) },
    { key: 'NextDeliveryQuantity', label: 'Next delivery', render: (row) => formatNumber(row.NextDeliveryQuantity) },
    { key: 'DeliveredQuantity', label: 'Delivered', render: (row) => formatNumber(row.DeliveredQuantity) },
    {
      key: 'Progress',
      label: 'Progress',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-28 h-2 rounded-full bg-surface-container overflow-hidden">
            <span className="block h-full bg-primary" style={{ width: `${Math.min(row.deliveryProgress, 100)}%` }} />
          </span>
          <span className="text-[11px] font-bold text-on-surface-variant">{row.deliveryProgress.toFixed(0)}%</span>
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
      rowKey={(row) => row.PurchaseOrderNumber}
      rowClassName="hover:bg-surface-container-low"
    />
  );
}

export default PurchaseOrderTable;
