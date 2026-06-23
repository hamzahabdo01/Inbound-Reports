const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

function PurchaseOrderTable({ rows }) {
  return (
    <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-[#CFD8DC]">
            <tr>
              {['PO Number', 'Item', 'Funding source', 'Ordered', 'Next delivery', 'Delivered', 'Progress'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.PurchaseOrderNumber} className="border-b border-surface-container-low hover:bg-surface-container-low">
                <td className="px-4 py-3 text-body-md font-semibold text-primary">{row.PurchaseOrderNumber}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.ProductCN}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.Donor}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{formatNumber(row.OrderQuantity)}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{formatNumber(row.NextDeliveryQuantity)}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{formatNumber(row.DeliveredQuantity)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-28 h-2 rounded-full bg-surface-container overflow-hidden">
                      <span className="block h-full bg-primary" style={{ width: `${Math.min(row.deliveryProgress, 100)}%` }} />
                    </span>
                    <span className="text-[11px] font-bold text-on-surface-variant">{row.deliveryProgress.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}

export default PurchaseOrderTable;
