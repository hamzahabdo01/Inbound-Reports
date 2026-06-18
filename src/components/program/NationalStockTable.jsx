import StatusBadge from './StatusBadge';

const compactNumber = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

function NationalStockTable({ rows, onSelectItem }) {
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
            <tr
              key={row.ProductCN}
              className={`border-b border-surface-container-low ${onSelectItem ? 'group cursor-pointer hover:bg-primary' : ''}`}
              onClick={() => onSelectItem?.(row.ProductCN)}
            >
              <td className="px-4 py-3 text-body-md font-semibold text-on-surface group-hover:text-white">
                <button
                  type="button"
                  className={`text-left font-semibold ${onSelectItem ? 'group-hover:text-white' : 'text-primary hover:text-primary-hover hover:underline'}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectItem?.(row.ProductCN);
                  }}
                >
                  {row.ProductCN}
                </button>
              </td>
              <td className="px-4 py-3"><StatusBadge status={row.SS} hoverWhite /></td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.SOH)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.AMC)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-20 h-2 rounded-full bg-surface-container-low overflow-hidden">
                    <span
                      className={`block h-full ${row.MOS <= 1 ? 'bg-error' : row.MOS < 6 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min((row.MOS / 12) * 100, 100)}%` }}
                    />
                  </span>
                  <span className="text-body-md font-semibold text-on-surface group-hover:text-white">{row.MOS.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.QuantityPurchaseOrder)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.GIT)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.Min)}</td>
              <td className="px-4 py-3 text-body-md text-on-surface group-hover:text-white">{compactNumber(row.Max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NationalStockTable;
