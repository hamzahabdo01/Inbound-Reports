const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

function RecentReceivesTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead className="bg-[#CFD8DC]">
          <tr>
            {['Date', 'Item', 'Manufacturer', 'Country', 'Quantity', 'Value (ETB)'].map((header) => (
              <th key={header} className="px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.RowNumber}-${row.ProductCN}`} className="border-b border-surface-container-low hover:bg-surface-container-low">
              <td className="px-4 py-3 text-body-md text-on-surface whitespace-nowrap">{row.FullDate}</td>
              <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{row.ProductCN}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{row.Manufacturer}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{row.Country}</td>
              <td className="px-4 py-3 text-body-md text-on-surface">{formatNumber(row.QuantityReceived)}</td>
              <td className="px-4 py-3 text-body-md font-semibold text-primary">{formatNumber(row.AmountReceivedBirr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentReceivesTable;
