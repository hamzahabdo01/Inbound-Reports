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
                <td className="px-4 py-3 text-body-md text-on-surface whitespace-nowrap">{formatDate(row.FullDate)}</td>
                <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{row.ProductCN}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.Manufacturer}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{row.Country}</td>
                <td className="px-4 py-3 text-body-md text-on-surface">{formatEstimate(row.QuantityReceived)}</td>
                <td className="px-4 py-3 text-body-md font-semibold text-primary">{formatEstimate(row.AmountReceivedBirr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}

export default RecentReceivesTable;
