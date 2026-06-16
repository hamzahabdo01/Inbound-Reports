import { useMemo, useState } from 'react';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

const statuses = [
  { label: 'Excess', color: '#00373B' },
  { label: 'Normal', color: '#059669' },
  { label: 'Below Min', color: '#D97706' },
  { label: 'Below EOP', color: '#EA580C' },
  { label: 'Stocked Out', color: '#BA1A1A' },
];

const getCellStatus = (value, thresholds) => {
  if (!value) return statuses[4];

  const { min, max, eop } = thresholds;

  if (value < min) return statuses[2];
  if (value < eop) return statuses[3];
  if (value <= max) return statuses[1];
  return statuses[0];
};

function HubHeatmap({ rows, products, thresholds }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const getThresholds = (product) => thresholds[product] || { min: 0, max: Infinity, eop: Infinity };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let riskA = 0, riskB = 0;
      products.forEach(p => {
        const t = getThresholds(p);
        const sA = getCellStatus(a[p] || 0, t);
        const sB = getCellStatus(b[p] || 0, t);
        if (sA.label === 'Stocked Out' || sA.label === 'Below EOP') riskA++;
        if (sB.label === 'Stocked Out' || sB.label === 'Below EOP') riskB++;
      });
      return riskB - riskA;
    });
  }, [rows, products, thresholds]);

  const totalPages = Math.max(Math.ceil(sortedRows.length / rowsPerPage), 1);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [page, sortedRows]);

  const start = sortedRows.length > 0 ? (page - 1) * rowsPerPage + 1 : 0;
  const end = Math.min(page * rowsPerPage, sortedRows.length);

  const getPillStyle = (status, value) => {
    const isCritical = !value || status.label === 'Stocked Out' || status.label === 'Below EOP';
    const isWarning = status.label === 'Below Min';
    if (isCritical) {
      return { backgroundColor: status.color, color: '#ffffff', fontWeight: 600 };
    }
    if (isWarning) {
      return { backgroundColor: status.color + '20', color: status.color, fontWeight: 600 };
    }
    return { backgroundColor: status.color + '14', color: status.color, fontWeight: 500 };
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1220px] border-collapse">
          <thead>
            <tr className="bg-surface-container border-y border-outline-variant">
              <th className="w-16 px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">SN</th>
              <th className="min-w-[220px] px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">Site</th>
              <th className="px-4 py-3 text-center text-label-caps uppercase text-on-surface-variant whitespace-nowrap w-24">At Risk</th>
              {products.map((product) => (
                <th key={product} className="min-w-[100px] px-3 py-3 text-center text-label-caps uppercase text-on-surface-variant whitespace-nowrap">
                  {product}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => {
              let riskCount = 0;
              products.forEach(p => {
                const val = row[p] || 0;
                const s = getCellStatus(val, getThresholds(p));
                if (s.label === 'Stocked Out' || s.label === 'Below EOP') riskCount++;
              });

              return (
                <tr key={row.Site} className="border-b border-surface-container-low hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3 bg-white text-body-sm text-on-surface-variant">
                    {(page - 1) * rowsPerPage + rowIndex + 1}
                  </td>
                  <td className="px-4 py-3 bg-white text-body-md font-semibold text-on-surface whitespace-nowrap">
                    {row.Site}
                  </td>
                  <td className="px-4 py-3 bg-white text-center">
                    {riskCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-[#BA1A1A] text-white text-body-sm font-bold">
                        {riskCount}
                      </span>
                    ) : (
                      <span className="text-body-sm text-on-surface-variant">—</span>
                    )}
                  </td>
                  {products.map((product) => {
                    const value = row[product] || 0;
                    const status = getCellStatus(value, getThresholds(product));
                    const pillStyle = getPillStyle(status, value);

                    return (
                      <td
                        key={product}
                        className="px-3 py-2 border-l border-surface-container-low bg-white text-center whitespace-nowrap"
                        title={`${row.Site} / ${product}: ${formatNumber(value)} (${status.label})`}
                      >
                        {thresholds[product] ? (
                          <span
                            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[12px] min-w-[3rem] w-full"
                            style={pillStyle}
                          >
                            {formatNumber(value)}
                          </span>
                        ) : (
                          <span className="text-body-sm text-on-surface-variant">{formatNumber(value)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface-variant">
        <span>{start}–{end} of {sortedRows.length} hubs (sorted by risk)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous hub page"
          >
            <i className="fa-solid fa-chevron-left text-[11px]"></i>
          </button>
          <span className="text-body-sm font-medium text-on-surface min-w-[4ch] text-center">{page}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next hub page"
          >
            <i className="fa-solid fa-chevron-right text-[11px]"></i>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3 border-t border-outline-variant bg-white">
        {statuses.map((status) => (
          <span key={status.label} className="inline-flex items-center gap-1.5 text-body-sm font-medium text-on-surface-variant">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default HubHeatmap;
