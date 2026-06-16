import StatusBadge from './StatusBadge';

const compactNumber = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

function NationalStockTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-[#CFD8DC]">
          <tr>
            {['Item', 'Status', 'SOH', 'AMC', 'MOS', 'Planned', 'GIT', 'Min', 'Max'].map((header) => (
              <th key={header} className="px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ProductCN} className="border-b border-surface-container-low hover:bg-surface-container-low">
              <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{row.ProductCN}</td>
              <td className="px-4 py-3"><StatusBadge status={row.SS} /></td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.SOH)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.AMC)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-20 h-2 rounded-full bg-surface-container overflow-hidden">
                    <span
                      className={`block h-full ${row.MOS <= 1 ? 'bg-error' : row.MOS < 6 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min((row.MOS / 12) * 100, 100)}%` }}
                    />
                  </span>
                  <span className="text-body-md font-semibold text-on-surface">{row.MOS.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.QuantityPurchaseOrder)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.GIT)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.Min)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{compactNumber(row.Max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NationalStockTable;
