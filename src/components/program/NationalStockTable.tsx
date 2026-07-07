import BaseTable, { ColumnDef } from '../BaseTable';
import StatusBadge from './StatusBadge';

const compactNumber = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

function NationalStockTable({ rows, onSelectItem }: any) {
  const clickable = !!onSelectItem;
  const hoverText = clickable ? 'group-hover:text-white' : '';
  const rowClasses = clickable ? 'group cursor-pointer hover:bg-primary' : 'hover:bg-surface-container-low';

  const columns: ColumnDef[] = [
    {
      key: 'ProductCN',
      label: 'Item',
      className: `font-semibold ${hoverText}`,
      render: (row) => (
        <button
          type="button"
          className={`text-left font-semibold ${clickable ? 'group-hover:text-white' : 'text-primary hover:text-primary-hover hover:underline'}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelectItem?.(row.ProductCN);
          }}
        >
          {row.ProductCN}
        </button>
      ),
    },
    {
      key: 'Status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.SS} hoverWhite={clickable} />,
    },
    { key: 'SOH', label: 'SOH', className: hoverText, render: (row) => compactNumber(row.SOH) },
    { key: 'AMC', label: 'AMC', className: hoverText, render: (row) => compactNumber(row.AMC) },
    {
      key: 'MOS',
      label: 'MOS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-20 h-2 rounded-full bg-surface-container-low overflow-hidden">
            <span
              className={`block h-full ${row.SS === 'Stocked Out' ? 'bg-error' : row.SS === 'Below EOP' ? 'bg-warning' : row.SS === 'Excess' ? 'bg-primary' : row.MOS <= 1 ? 'bg-error' : row.MOS < 6 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${Math.min((row.MOS / 12) * 100, 100)}%` }}
            />
          </span>
          <span className={`text-body-md font-semibold ${hoverText}`}>{row.MOS.toFixed(1)}</span>
        </div>
      ),
    },
    { key: 'QuantityPurchaseOrder', label: 'Planned', className: hoverText, render: (row) => compactNumber(row.QuantityPurchaseOrder) },
    { key: 'GIT', label: 'GIT', className: hoverText, render: (row) => compactNumber(row.GIT) },
    { key: 'Min', label: 'Min', className: hoverText, render: (row) => compactNumber(row.Min) },
    { key: 'Max', label: 'Max', className: hoverText, render: (row) => compactNumber(row.Max) },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={rows}
      minWidth="900px"
      headerBg="bg-[#CFD8DC]"
      rowKey={(row) => row.ProductCN}
      onRowClick={clickable ? (row) => onSelectItem(row.ProductCN) : undefined}
      rowClassName={rowClasses}
    />
  );
}

export default NationalStockTable;
