import { useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '../BaseTable';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

const formatCompact = (v) => {
  if (v === 0) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
};

const statuses = [
  { label: 'Excess', color: '#0B4F54' },
  { label: 'Normal', color: '#059669' },
  { label: 'Below Min', color: '#CA8A04' },
  { label: 'Below EOP', color: '#D94D14' },
  { label: 'Stocked Out', color: '#BA1A1A' },
];

const getCellStatus = (value, thresholds, ss) => {
  if (ss) {
    const found = statuses.find((s) => s.label.toLowerCase() === ss.toLowerCase());
    if (found) return found;
  }
  if (!value) return statuses[4]; // Stocked Out

  const { min, max, eop } = thresholds;

  if (value < min) return statuses[2];
  if (value < eop) return statuses[3];
  if (value <= max) return statuses[1];
  return statuses[0];
};

function HubHeatmap({ rows, products, thresholds, statusMap, siteFilter }: any) {
  const [page, setPage] = useState(1);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const rowsPerPage = 10;

  const isFilterActive = hoveredStatus !== null || selectedStatuses.length > 0;

  const getThresholds = (product) => (thresholds || {})[product] || { min: 0, max: Infinity, eop: Infinity };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let riskA = 0, riskB = 0;
      products.forEach(p => {
        const t = getThresholds(p);
        const sA = getCellStatus(a[p] || 0, t, statusMap?.[a.Site]?.[p]);
        const sB = getCellStatus(b[p] || 0, t, statusMap?.[b.Site]?.[p]);
        if (sA.label === 'Stocked Out' || sA.label === 'Below EOP' || sA.label === 'Excess') riskA++;
        if (sB.label === 'Stocked Out' || sB.label === 'Below EOP' || sB.label === 'Excess') riskB++;
      });
      return riskB - riskA;
    });
  }, [rows, products, thresholds, statusMap]);

  const totalPages = Math.max(Math.ceil(sortedRows.length / rowsPerPage), 1);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [page, sortedRows]);

  const startRow = sortedRows.length > 0 ? (page - 1) * rowsPerPage + 1 : 0;
  const end = Math.min(page * rowsPerPage, sortedRows.length);

  const computeRiskCount = (row) => {
    let count = 0;
    products.forEach(p => {
      const val = row[p] || 0;
      const s = getCellStatus(val, getThresholds(p), statusMap?.[row.Site]?.[p]);
      if (s.label === 'Stocked Out' || s.label === 'Below EOP' || s.label === 'Excess') count++;
    });
    return count;
  };

  const handleStatusClick = (label: string) => {
    if (selectedStatuses.includes(label)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== label));
    } else {
      setSelectedStatuses([...selectedStatuses, label]);
    }
  };

  const columns: ColumnDef[] = [
    {
      key: 'site',
      label: 'Site',
      className: 'sticky left-0 z-10 bg-white font-semibold whitespace-nowrap',
      headerClassName: 'sticky left-0 z-20 min-w-[160px] bg-surface-container',
      render: (row) => row.Site,
    },
    {
      key: 'atRisk',
      label: 'At Risk',
      align: 'center',
      width: 'w-24',
      headerClassName: 'w-24 whitespace-nowrap',
      className: 'bg-white',
      render: (row) => {
        const riskCount = computeRiskCount(row);
        return riskCount > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-[#BA1A1A] text-white text-body-sm font-bold">
            {riskCount}
          </span>
        ) : (
          <span className="text-body-sm text-on-surface-variant">—</span>
        );
      },
    },
    ...products.map((product) => ({
      key: product,
      label: product,
      align: 'center' as const,
      headerClassName: 'min-w-[90px] !px-2 whitespace-nowrap',
      className: '!px-2 !py-2 border-l border-surface-container-low bg-white whitespace-nowrap align-middle transition-all duration-200',
      render: (row) => {
        const value = row[product] || 0;
        const status = getCellStatus(value, getThresholds(product), statusMap?.[row.Site]?.[product]);
        const titleStr = `${row.Site} / ${product}: ${formatNumber(value)} (${status.label})`;

        // Matched if either hovered or included in selected statuses list
        const isMatched = (hoveredStatus && status.label.toLowerCase() === hoveredStatus.toLowerCase()) || 
                          selectedStatuses.some((s) => s.toLowerCase() === status.label.toLowerCase());

        let cellStyle: any = {};
        if (isFilterActive && isMatched) {
          // Highlight matched cells as Solid Badges
          cellStyle = {
            backgroundColor: status.color,
            color: '#ffffff',
            border: `1px solid ${status.color}`,
            fontWeight: 800,
            opacity: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transform: 'scale(1.02)',
          };
        } else {
          // All other cells render in standard Subtle Heatmap view (no fade/dim)
          cellStyle = {
            backgroundColor: status.color + '18', // ~9% opacity
            color: status.color,
            border: `1px solid ${status.color}25`,
            fontWeight: 600,
            opacity: 1,
          };
        }

        return (
          <div className="flex items-center justify-center w-full py-0.5" title={titleStr}>
            <span
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] w-full text-center transition-all duration-200 select-none"
              style={cellStyle}
            >
              {formatCompact(value)}
            </span>
          </div>
        );
      },
    })),
  ];

  return (
    <div className="flex flex-col">
      {/* Legend Indicators positioned above the table */}
      <div className="flex items-center flex-wrap gap-y-2 px-5 py-3 border-b border-outline-variant bg-surface-container-lowest select-none">
        {/* Desktop: highlight status buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-2">Highlight Status:</span>
          {statuses.map((status) => {
            const isSelected = selectedStatuses.includes(status.label);
            const isHovered = hoveredStatus === status.label;
            return (
              <button
                key={status.label}
                type="button"
                onMouseEnter={() => setHoveredStatus(status.label)}
                onMouseLeave={() => setHoveredStatus(null)}
                onClick={() => handleStatusClick(status.label)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-body-sm font-semibold transition-all cursor-pointer duration-200 ${
                  isSelected
                    ? 'bg-surface-container-high border-primary text-primary font-bold shadow-sm'
                    : isHovered
                    ? 'bg-surface-container-low border-outline-variant/60 text-on-surface'
                    : 'bg-transparent border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm transition-transform duration-200"
                  style={{
                    backgroundColor: status.color,
                    transform: (isSelected || isHovered) ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
                {status.label}
              </button>
            );
          })}
          {selectedStatuses.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatuses([])}
              className="text-[11px] font-bold text-primary hover:underline ml-4 cursor-pointer"
            >
              Clear Highlights
            </button>
          )}
        </div>
        {siteFilter && <div className="hidden lg:flex items-center gap-2 ml-auto">{siteFilter}</div>}
        {/* Mobile/Tablet: dropdown */}
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-2">Highlight Status:</span>
            <div className="relative">
              <select
                value={selectedStatuses.length === 1 ? selectedStatuses[0] : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedStatuses([]);
                  } else {
                    setSelectedStatuses([val]);
                  }
                }}
                className="appearance-none h-9 min-w-[130px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
              >
                <option value="">All</option>
                {statuses.map((s) => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
            </div>
            {selectedStatuses.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatuses([])}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {siteFilter && <div className="lg:hidden flex items-center gap-2">{siteFilter}</div>}
        </div>
      </div>

      <BaseTable
        columns={columns}
        rows={visibleRows}
        minWidth="1220px"
        tableClassName="border-separate border-spacing-0"
        headerRowClassName="bg-surface-container border-y border-outline-variant"
        rowKey={(row) => row.Site}
        rowClassName="hover:bg-surface-container-low"
        pagination={{
          page,
          totalPages,
          total: sortedRows.length,
          rowsPerPage,
          onChange: setPage,
        }}
      />
    </div>
  );
}

export default HubHeatmap;
