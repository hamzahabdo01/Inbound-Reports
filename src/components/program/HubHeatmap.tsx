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
  { label: 'Below Min', color: '#D97706' },
  { label: 'Below EOP', color: '#EA580C' },
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

function HubHeatmap({ rows, products, thresholds, statusMap }: any) {
  const [page, setPage] = useState(1);
  const [activeTemplate, setActiveTemplate] = useState<'subtle' | 'solid' | 'outline'>('subtle');
  const rowsPerPage = 10;

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

  const columns: ColumnDef[] = [
    {
      key: 'sn',
      label: 'SN',
      width: 'w-16',
      headerClassName: 'w-16',
      className: 'bg-white text-body-sm text-on-surface-variant',
      render: (row, index) => (page - 1) * rowsPerPage + index + 1,
    },
    {
      key: 'site',
      label: 'Site',
      className: 'bg-white font-semibold whitespace-nowrap',
      headerClassName: 'min-w-[220px]',
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
      className: '!px-2 !py-2 border-l border-surface-container-low bg-white whitespace-nowrap align-middle',
      render: (row) => {
        const value = row[product] || 0;
        const status = getCellStatus(value, getThresholds(product), statusMap?.[row.Site]?.[product]);
        const titleStr = `${row.Site} / ${product}: ${formatNumber(value)} (${status.label})`;

        if (activeTemplate === 'solid') {
          const badgeStyle = {
            backgroundColor: status.color,
            color: '#ffffff',
            fontWeight: 700,
          };
          return (
            <div className="flex items-center justify-center w-full py-0.5" title={titleStr}>
              <span
                className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] w-full text-center shadow-sm select-none"
                style={badgeStyle}
              >
                {formatCompact(value)}
              </span>
            </div>
          );
        }

        if (activeTemplate === 'outline') {
          const outlineStyle = {
            backgroundColor: 'transparent',
            color: status.color,
            border: `1px dashed ${status.color}70`,
            fontWeight: 700,
          };
          return (
            <div className="flex items-center justify-center w-full py-0.5" title={titleStr}>
              <span
                className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] w-full text-center select-none"
                style={outlineStyle}
              >
                {formatCompact(value)}
              </span>
            </div>
          );
        }

        // Default: subtle heatmap tint
        const cellStyle = {
          backgroundColor: status.color + '18', // ~9% opacity
          color: status.color,
          border: `1px solid ${status.color}25`,
        };
        return (
          <div className="flex items-center justify-center w-full py-0.5" title={titleStr}>
            <span
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-[12px] font-bold w-full text-center transition-colors select-none"
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
      {/* Template selection tabs bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-1.5 bg-surface-container-high p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTemplate('subtle')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTemplate === 'subtle'
                ? 'bg-white text-primary shadow-[0px_1px_3px_rgba(0,0,0,0.1)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50'
            }`}
          >
            <i className="fa-solid fa-border-all" /> Subtle Heatmap
          </button>
          <button
            type="button"
            onClick={() => setActiveTemplate('solid')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTemplate === 'solid'
                ? 'bg-white text-primary shadow-[0px_1px_3px_rgba(0,0,0,0.1)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50'
            }`}
          >
            <i className="fa-solid fa-square" /> Solid Badges
          </button>
          <button
            type="button"
            onClick={() => setActiveTemplate('outline')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTemplate === 'outline'
                ? 'bg-white text-primary shadow-[0px_1px_3px_rgba(0,0,0,0.1)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50'
            }`}
          >
            <i className="fa-solid fa-square-o" style={{ WebkitTextStroke: '1px' }} /> Outline Heatmap
          </button>
        </div>
        <div className="text-[11px] text-on-surface-variant font-medium">
          Style: <span className="font-bold text-primary capitalize">{activeTemplate} view (estimated values)</span>
        </div>
      </div>

      <BaseTable
        columns={columns}
        rows={visibleRows}
        minWidth="1220px"
        tableClassName="border-collapse"
        headerRowClassName="bg-surface-container border-y border-outline-variant"
        rowKey={(row) => row.Site}
        rowClassName="hover:bg-surface-container-low"
        pagination={{
          page,
          totalPages,
          total: sortedRows.length,
          rowsPerPage,
          onChange: setPage,
          info: <>{startRow}&ndash;{end} of {sortedRows.length} hubs (sorted by risk)</>,
        }}
      />

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
